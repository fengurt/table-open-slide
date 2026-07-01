import type { SlideManifestEntry } from './types';

export type SlideDigest = Pick<
  SlideManifestEntry,
  'rel' | 'title' | 'briefing' | 'order' | 'track' | 'tags'
>;

export type SlideFieldChange = 'title' | 'briefing' | 'order' | 'track' | 'tags';

export type ManifestDiff = {
  added: SlideManifestEntry[];
  removed: SlideManifestEntry[];
  changed: { rel: string; before: SlideDigest; after: SlideDigest; fields: SlideFieldChange[] }[];
  unchangedCount: number;
};

export function digestSlide(s: SlideManifestEntry): SlideDigest {
  return {
    rel: s.rel,
    title: s.title,
    briefing: s.briefing,
    order: s.order,
    track: s.track,
    tags: [...s.tags].sort((a, b) => a.localeCompare(b, 'zh-CN')),
  };
}

function tagsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x.localeCompare(y, 'zh-CN'));
  const sb = [...b].sort((x, y) => x.localeCompare(y, 'zh-CN'));
  return sa.every((v, i) => v === sb[i]);
}

export function fieldChanges(before: SlideDigest, after: SlideDigest): SlideFieldChange[] {
  const out: SlideFieldChange[] = [];
  if (before.title !== after.title) out.push('title');
  if (before.briefing !== after.briefing) out.push('briefing');
  if (before.order !== after.order) out.push('order');
  if (before.track !== after.track) out.push('track');
  if (!tagsEqual(before.tags, after.tags)) out.push('tags');
  return out;
}

/** Compare two manifest slide lists by `rel`. */
export function compareManifestSlides(
  before: SlideManifestEntry[] | null,
  after: SlideManifestEntry[],
): ManifestDiff {
  if (!before || before.length === 0) {
    return {
      added: [...after],
      removed: [],
      changed: [],
      unchangedCount: 0,
    };
  }
  const beforeMap = new Map(before.map((s) => [s.rel, s]));
  const afterMap = new Map(after.map((s) => [s.rel, s]));
  const added: SlideManifestEntry[] = [];
  const removed: SlideManifestEntry[] = [];
  const changed: ManifestDiff['changed'] = [];
  let unchangedCount = 0;

  for (const s of after) {
    const prev = beforeMap.get(s.rel);
    if (!prev) added.push(s);
    else {
      const db = digestSlide(prev);
      const da = digestSlide(s);
      const fields = fieldChanges(db, da);
      if (fields.length) changed.push({ rel: s.rel, before: db, after: da, fields });
      else unchangedCount += 1;
    }
  }
  for (const s of before) {
    if (!afterMap.has(s.rel)) removed.push(s);
  }

  return { added, removed, changed, unchangedCount };
}

export const BASELINE_STORAGE_KEY = 'taiyuan-storyline-manifest-baseline';

export function loadBaselineFromStorage(): SlideManifestEntry[] | null {
  try {
    const raw = sessionStorage.getItem(BASELINE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SlideManifestEntry[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBaselineToStorage(slides: SlideManifestEntry[]): void {
  sessionStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(slides));
}

export function clearBaselineFromStorage(): void {
  sessionStorage.removeItem(BASELINE_STORAGE_KEY);
}
