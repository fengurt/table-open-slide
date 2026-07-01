import type { SlideLayoutLocale } from './slideLayoutTypes.js';
import { clampBox } from './slideLayoutTypes.js';
import type { SlideLang } from './slideRender.js';

export type OptimizeSource = 'ai' | 'rules';

export type OptimizeResult = {
  blocks: SlideLayoutLocale;
  source: OptimizeSource;
  note?: string;
};

type BlockMeta = { id: string; label: string; box: { x: number; y: number; w: number; h: number } };

const MARGIN = 3;
const MIN_STACK_H = 10;

function classify(label: string): string {
  const l = label.toLowerCase();
  if (/left-panel|huge-text|huge-title|vision-big|subtitle/.test(l)) return 'left';
  if (/right-panel|problem-grid|summary-box/.test(l)) return 'right';
  if (/header-section|tagline/.test(l)) return 'header';
  if (
    /problem-row|mission-item|summary-item|talent-row|risk-row|allocation|use-case|product-card|stage|moat|founding|team-member|ecosystem|financing|pillar|benefit-item|outcome-item|mentorship-item|content-block/.test(
      l,
    )
  )
    return 'row';
  if (/deco/.test(l)) return 'deco';
  return 'other';
}

/** Heuristic layout: spacing, columns, no overlap — works offline. */
export function optimizeLayoutRules(
  blocks: SlideLayoutLocale,
  labels: Record<string, string>,
  _lang: SlideLang,
): SlideLayoutLocale {
  const ids = Object.keys(blocks);
  if (ids.length === 0) return blocks;

  // Keep measured geometry for simple slides or dense text-box scans (avoid flattening).
  if (ids.length <= 4 || ids.length > 10) {
    const kept: SlideLayoutLocale = {};
    for (const id of ids) kept[id] = clampBox(blocks[id]);
    return kept;
  }

  const meta: BlockMeta[] = ids.map((id) => ({
    id,
    label: labels[id] ?? id,
    box: blocks[id],
  }));

  const result: SlideLayoutLocale = {};
  const deco = meta.filter((b) => classify(b.label) === 'deco');
  const left = meta.filter((b) => classify(b.label) === 'left');
  const right = meta.filter((b) => classify(b.label) === 'right');
  const header = meta.filter((b) => classify(b.label) === 'header');
  const rows = meta.filter((b) => classify(b.label) === 'row');
  const other = meta.filter(
    (b) => !['deco', 'left', 'right', 'header', 'row'].includes(classify(b.label)),
  );

  for (const b of deco) {
    result[b.id] = clampBox({ x: 72, y: 0, w: 28, h: 28 });
  }

  if (left.length > 0 && (right.length > 0 || rows.length > 0)) {
    const leftW = 36;
    for (const b of left) {
      result[b.id] = clampBox({
        x: MARGIN,
        y: MARGIN,
        w: leftW - MARGIN,
        h: 100 - MARGIN * 2,
      });
    }
    const rx = leftW + 2;
    const rw = 100 - rx - MARGIN;
    let y = MARGIN;
    for (const b of header) {
      result[b.id] = clampBox({ x: rx, y, w: rw, h: 11 });
      y += 12;
    }
    const stack = [...right, ...rows];
    if (stack.length > 0) {
      const gap = 2;
      const avail = 100 - y - MARGIN;
      let stackH = (avail - gap * (stack.length - 1)) / stack.length;
      const totalNeeded = stack.length * stackH + (stack.length - 1) * gap;
      if (totalNeeded > avail) {
        stackH = (avail - gap * (stack.length - 1)) / stack.length;
      }
      stackH = Math.max(MIN_STACK_H, stackH);
      stack.forEach((b, i) => {
        const top = y + i * (stackH + gap);
        result[b.id] = clampBox({
          x: rx,
          y: top,
          w: rw,
          h: Math.min(stackH, 100 - top - MARGIN),
        });
      });
    }
  } else if (rows.length > 1) {
    const gap = 2.5;
    const avail = 100 - MARGIN * 2;
    const rowH = (avail - gap * (rows.length - 1)) / rows.length;
    rows.forEach((b, i) => {
      result[b.id] = clampBox({
        x: MARGIN,
        y: MARGIN + i * (rowH + gap),
        w: 100 - MARGIN * 2,
        h: rowH,
      });
    });
  } else if (meta.length <= 4) {
    const cols = meta.length <= 2 ? meta.length : 2;
    const rowsN = Math.ceil(meta.length / cols);
    const cw = (100 - MARGIN * 2) / cols;
    const ch = (100 - MARGIN * 2) / rowsN;
    meta.forEach((b, i) => {
      if (classify(b.label) === 'deco') return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      result[b.id] = clampBox({
        x: MARGIN + col * cw,
        y: MARGIN + row * ch,
        w: cw - 2,
        h: ch - 2,
      });
    });
  }

  for (const b of other) {
    if (!result[b.id]) {
      result[b.id] = clampBox({
        x: MARGIN,
        y: MARGIN,
        w: 100 - MARGIN * 2,
        h: 40,
      });
    }
  }

  for (const id of ids) {
    if (!result[id]) result[id] = clampBox(blocks[id]);
  }

  return result;
}

type AiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

function readAiConfig(): AiConfig | null {
  const apiKey =
    process.env.KIND_LAYOUT_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || '';
  if (!apiKey) return null;
  const baseUrl = (
    process.env.KIND_LAYOUT_AI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '');
  const model =
    process.env.KIND_LAYOUT_AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  return { apiKey, baseUrl, model };
}

async function optimizeLayoutWithAi(
  blocks: SlideLayoutLocale,
  labels: Record<string, string>,
  lang: SlideLang,
  slideHint: string,
  config: AiConfig,
): Promise<SlideLayoutLocale | null> {
  const blockList = Object.entries(blocks).map(([id, box]) => ({
    id,
    label: labels[id] ?? id,
    ...box,
  }));

  const system = `You are a presentation layout designer for 1280×720 slides.
Output ONLY valid JSON: {"blocks":{"<id>":{"x":number,"y":number,"w":number,"h":number}}}}
All values are percentages 0-100. Rules:
- No overlapping regions; keep margin ≥ 3% from edges
- min w,h ≥ 8; x+w ≤ 100; y+h ≤ 100
- For Chinese (${lang === 'zh' ? 'yes' : 'no'}): favor balanced whitespace, avoid tiny orphan strips
- left-panel / titles: left column ~35-42% width
- problem-row / list items: stack in right column with equal height gaps
- Preserve every block id exactly; only adjust geometry`;

  const user = JSON.stringify({
    lang,
    slideHint: slideHint.slice(0, 500),
    blocks: blockList,
  });

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  const parsed = JSON.parse(raw) as {
    blocks?: Record<string, { x?: number; y?: number; w?: number; h?: number }>;
  };
  if (!parsed.blocks) return null;

  const out: SlideLayoutLocale = {};
  for (const id of Object.keys(blocks)) {
    const b = parsed.blocks[id];
    if (!b) {
      out[id] = clampBox(blocks[id]);
      continue;
    }
    out[id] = clampBox({
      x: Number(b.x ?? blocks[id].x),
      y: Number(b.y ?? blocks[id].y),
      w: Number(b.w ?? blocks[id].w),
      h: Number(b.h ?? blocks[id].h),
    });
  }
  return out;
}

export async function optimizeSlideLayout(opts: {
  blocks: SlideLayoutLocale;
  labels: Record<string, string>;
  lang: SlideLang;
  slideHint?: string;
}): Promise<OptimizeResult> {
  const { blocks, labels, lang, slideHint = '' } = opts;
  const rules = optimizeLayoutRules(blocks, labels, lang);

  const aiConfig = readAiConfig();
  if (aiConfig) {
    try {
      const aiBlocks = await optimizeLayoutWithAi(blocks, labels, lang, slideHint, aiConfig);
      if (aiBlocks && Object.keys(aiBlocks).length > 0) {
        return {
          blocks: aiBlocks,
          source: 'ai',
          note: aiConfig.model,
        };
      }
    } catch {
      /* fall through to rules */
    }
  }

  return {
    blocks: rules,
    source: 'rules',
    note: aiConfig
      ? 'AI unavailable, used smart layout'
      : 'Smart layout (set KIND_LAYOUT_AI_API_KEY for AI)',
  };
}
