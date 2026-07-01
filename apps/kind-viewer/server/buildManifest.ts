import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

export type SlideManifestEntry = {
  rel: string;
  id: string;
  order: number;
  titleEn: string;
  titleZh: string;
  briefingEn: string;
  briefingZh: string;
  tags: string[];
};

type SlideState = {
  slides?: Array<{ id: string; pageNum: number }>;
  outline?: Array<{ id: string; title: string; summary: string }>;
};

type ZhEntry = { title: string; briefing: string };
type ZhMap = Record<string, ZhEntry>;

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  const h2 = html.match(/<h2[^>]*class="[^"]*subtitle[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2) return stripTags(h2[1]);
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return stripTags(h1[1]);
  const section = html.match(/class="[^"]*section-label[^"]*"[^>]*>([\s\S]*?)<\//i);
  if (section) return stripTags(section[1]);
  const t = html.match(/<title>([^<]*)<\/title>/i);
  if (t) return stripTags(t[1]);
  return 'Untitled';
}

function extractBriefing(html: string): string {
  const mission = [...html.matchAll(/class="[^"]*mission-text[^"]*"[^>]*>([\s\S]*?)<\//gi)]
    .map((m) => stripTags(m[1] ?? ''))
    .filter(Boolean);
  if (mission.length) return mission.join(' · ').slice(0, 240);

  const belief = html.match(/class="[^"]*belief-text[^"]*"[^>]*>([\s\S]*?)<\//i);
  if (belief) return stripTags(belief[1]).slice(0, 240);

  const tagline = html.match(/class="[^"]*tagline[^"]*"[^>]*>([\s\S]*?)<\//i);
  if (tagline) return stripTags(tagline[1]).slice(0, 240);

  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return stripTags(body?.[1] ?? html).slice(0, 240);
}

function slideIdFromRel(rel: string): string {
  return path.basename(rel, '.html');
}

async function loadSlideState(deckRoot: string): Promise<SlideState | null> {
  try {
    const raw = await fs.readFile(path.join(deckRoot, 'slide_state.json'), 'utf8');
    return JSON.parse(raw) as SlideState;
  } catch {
    return null;
  }
}

async function loadZhMap(deckRoot: string): Promise<ZhMap> {
  try {
    const raw = await fs.readFile(path.join(deckRoot, 'i18n.zh.json'), 'utf8');
    return JSON.parse(raw) as ZhMap;
  } catch {
    return {};
  }
}

const TAG_RULES: [RegExp, string][] = [
  [/title|cover/i, 'Opening'],
  [/mission|vision/i, 'Vision'],
  [/problem|gap/i, 'Problem'],
  [/solution|pillar/i, 'Solution'],
  [/product|clone/i, 'Product'],
  [/hardware/i, 'Hardware'],
  [/mentorship|mentor/i, 'Mentorship'],
  [/result/i, 'Results'],
  [/business|model/i, 'Business'],
  [/ecosystem|opc/i, 'Ecosystem'],
  [/use.?case|scenario/i, 'Use cases'],
  [/competitive|moat/i, 'Moat'],
  [/roadmap/i, 'Roadmap'],
  [/evolution|long/i, 'Evolution'],
  [/team|founding/i, 'Team'],
  [/talent|hiring/i, 'Talent'],
  [/financ/i, 'Financing'],
  [/risk/i, 'Risk'],
  [/conclusion|cta/i, 'Closing'],
];

function inferTags(id: string, titleEn: string): string[] {
  const tags = new Set<string>();
  const blob = `${id} ${titleEn}`;
  for (const [re, label] of TAG_RULES) {
    if (re.test(blob)) tags.add(label);
  }
  return [...tags];
}

export async function buildManifest(deckRoot: string): Promise<SlideManifestEntry[]> {
  const relPaths = await fg(['*.html'], { cwd: deckRoot, onlyFiles: true });
  const state = await loadSlideState(deckRoot);
  const zh = await loadZhMap(deckRoot);
  const orderById = new Map<string, number>();
  const outlineById = new Map<string, { title: string; summary: string }>();

  for (const s of state?.slides ?? []) {
    orderById.set(s.id, s.pageNum);
  }
  for (const o of state?.outline ?? []) {
    outlineById.set(o.id, { title: o.title, summary: o.summary });
  }

  const entries: SlideManifestEntry[] = [];

  for (const file of relPaths) {
    const id = slideIdFromRel(file);
    const abs = path.join(deckRoot, file);
    const raw = await fs.readFile(abs, 'utf8');
    const outline = outlineById.get(id);
    const titleEn = outline?.title ?? extractTitle(raw);
    const briefingEn = outline?.summary ?? extractBriefing(raw);
    const z = zh[id];
    const titleZh = z?.title ?? titleEn;
    const briefingZh = z?.briefing ?? briefingEn;
    const order = orderById.get(id) ?? 999;

    entries.push({
      rel: file,
      id,
      order,
      titleEn,
      titleZh,
      briefingEn,
      briefingZh,
      tags: inferTags(id, titleEn),
    });
  }

  return entries.sort((a, b) => a.order - b.order);
}

export function safeSlidePath(deckRoot: string, rel: string): string | null {
  const normalized = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(deckRoot, normalized);
  const relOut = path.relative(deckRoot, abs);
  if (relOut.startsWith('..') || path.isAbsolute(relOut)) return null;
  if (!relOut.endsWith('.html')) return null;
  if (relOut.includes(path.sep)) return null;
  return abs;
}
