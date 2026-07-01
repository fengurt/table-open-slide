import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

export type SlideTrack = 'presentation' | 'ai_report_2026_slides';

export type SlideManifestEntry = {
  rel: string;
  track: SlideTrack;
  trackLabel: string;
  order: number;
  title: string;
  /** Substantive on-slide briefing (subtitle / body facts), not margin meta. */
  briefing: string;
  tags: string[];
};

const TRACK_LABEL: Record<SlideTrack, string> = {
  presentation: '闭门场 · 少数人的视野',
  ai_report_2026_slides: 'AI 年报 2026 · 参考线',
};

const TAG_RULES: [RegExp, string][] = [
  [/cover|封面|开篇/i, '开篇'],
  [/summary|摘要|总览/i, '总览'],
  [/macro|宏观/i, '宏观'],
  [/friction|摩擦|阻力/i, '组织摩擦'],
  [/logistics|零售|物流/i, '零售物流'],
  [/marketing|市场|人力/i, '市场人力'],
  [/semiconductor|芯片|安全/i, '芯片安全'],
  [/edtech|教培|联络|中心/i, '教培联络'],
  [/evolution|演进/i, '演进'],
  [/technology|技术/i, '技术'],
  [/roadmap|路线/i, '路线图'],
  [/immediate|行动|立即/i, '行动清单'],
  [/epilogue|尾声|收束/i, '尾声'],
  [/question|互动|问|默答/i, '互动'],
  [/executive|高管/i, '高管视角'],
  [/organization|组织/i, '组织'],
];

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractClassBlock(html: string, className: string): string {
  const re = new RegExp(
    `<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[a-zA-Z0-9]+>`,
    'i',
  );
  const m = html.match(re);
  return m ? stripTags(m[1]) : '';
}

function collectClassTexts(html: string, classBase: string, max: number): string {
  const re = new RegExp(`class="[^"]*\\b${classBase}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'gi');
  const matches = [...html.matchAll(re)].slice(0, max);
  return matches
    .map((m) => stripTags(m[1] ?? '').trim())
    .filter((t) => t.length > 1)
    .join(' ');
}

/** Uppercase / Latin margin lines (e.g. venue stamps), not briefing body. */
function looksLikeMarginMeta(s: string): boolean {
  const t = s.trim();
  if (t.length < 8) return false;
  if (/[\u4e00-\u9fff]/.test(t)) return false;
  if (/^[A-Z0-9\s·,.:'’\-–]+$/.test(t) && /[A-Z]{4,}/.test(t)) return true;
  return false;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function firstSubstantialSubtitle(html: string): string {
  for (const cls of ['subtitle', 'subtitle-zh', 'subtitle-en']) {
    const t = extractClassBlock(html, cls).trim();
    if (t && !looksLikeMarginMeta(t)) return t;
  }
  return '';
}

/**
 * Prefer on-slide briefing copy: subtitle family, then data facts, then Q&A / conclusion.
 * Does not stitch margin labels (top-meta, chapter-label, footer).
 */
function extractBriefing(html: string): string {
  const sub = firstSubstantialSubtitle(html);
  if (sub) return truncate(sub, 240);

  const dataChunks = collectClassTexts(html, 'data-desc', 6);
  if (dataChunks.trim()) return truncate(dataChunks, 240);

  const conclusion = extractClassBlock(html, 'conclusion').trim();
  if (conclusion) return truncate(conclusion, 240);

  const q = extractClassBlock(html, 'question').trim();
  if (q) return truncate(q, 240);

  const baseline = collectClassTexts(html, 'baseline-item', 4);
  if (baseline.trim()) return truncate(baseline, 240);

  const se = extractClassBlock(html, 'se').trim();
  if (se.length > 16) return truncate(se, 240);

  const topicDesc = collectClassTexts(html, 'topic-desc', 4);
  if (topicDesc.trim()) return truncate(topicDesc, 240);

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const plain = stripTags(body);
  return truncate(plain, 240);
}

function extractTitle(html: string): string {
  const fromMain = extractClassBlock(html, 'main-title');
  if (fromMain) return fromMain;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  const t = html.match(/<title>([^<]*)<\/title>/i);
  if (t) return stripTags(t[1]);
  return '未命名页面';
}

function parseOrder(rel: string): number {
  const base = path.basename(rel, '.html');
  const m = base.match(/slide_(\d+)/i);
  return m ? Number.parseInt(m[1], 10) : 999;
}

function inferTags(rel: string, title: string, briefing: string, track: SlideTrack): string[] {
  const tags = new Set<string>();
  tags.add(track === 'presentation' ? '闭门场主线' : 'AI 年报附录');
  const blob = `${rel} ${title} ${briefing}`;
  for (const [re, label] of TAG_RULES) {
    if (re.test(blob)) tags.add(label);
  }
  return [...tags];
}

function asTrack(dir: string): SlideTrack | null {
  if (dir === 'presentation') return 'presentation';
  if (dir === 'ai_report_2026_slides') return 'ai_report_2026_slides';
  return null;
}

export async function buildManifest(eventRoot: string): Promise<SlideManifestEntry[]> {
  const relPaths = await fg(['presentation/**/*.html', 'ai_report_2026_slides/**/*.html'], {
    cwd: eventRoot,
    onlyFiles: true,
  });

  const entries: SlideManifestEntry[] = [];

  for (const rel of relPaths) {
    const top = rel.split(path.sep)[0] ?? '';
    const track = asTrack(top);
    if (!track) continue;
    const abs = path.join(eventRoot, rel);
    const raw = await fs.readFile(abs, 'utf8');
    const title = extractTitle(raw);
    const briefing = extractBriefing(raw);
    const order = parseOrder(rel);
    entries.push({
      rel,
      track,
      trackLabel: TRACK_LABEL[track],
      order,
      title,
      briefing,
      tags: inferTags(rel, title, briefing, track),
    });
  }

  const pres = entries.filter((e) => e.track === 'presentation').sort((a, b) => a.order - b.order);
  const report = entries
    .filter((e) => e.track === 'ai_report_2026_slides')
    .sort((a, b) => a.order - b.order);

  return [...pres, ...report];
}

export function safeSlidePath(eventRoot: string, rel: string): string | null {
  const normalized = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(eventRoot, normalized);
  const relOut = path.relative(eventRoot, abs);
  if (relOut.startsWith('..') || path.isAbsolute(relOut)) return null;
  const parts = relOut.split(path.sep);
  if (parts.length < 2) return null;
  const top = parts[0];
  if (top !== 'presentation' && top !== 'ai_report_2026_slides') return null;
  if (!parts[parts.length - 1]?.endsWith('.html')) return null;
  return abs;
}
