import { basename, dirname } from './api';
import type { HtmlItem, SearchResult } from './types';

const RECENTS_KEY = 'html-lab:recents';
const MAX_RECENTS = 12;

const SEARCH_ALIASES: Record<string, string[]> = {
  jindou: ['金豆', '金豆投资', '金豆投资控股', '金豆投资控股集团', 'jd'],
  'jindou-corporate': ['金豆', '企业形象', '集团介绍'],
  dong: ['董家大院', '董报告', 'dongreport'],
  guizang: ['归藏', 'guizang-ppt-skill'],
  tongyi: ['通义', '千问', 'qwen'],
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function tokenize(query: string): string[] {
  const tokens = normalize(query)
    .trim()
    .split(/[\s/\\._-]+/)
    .filter(Boolean);
  return [...new Set(tokens)];
}

function aliasesForPath(path: string): string[] {
  const lower = normalize(path);
  const aliases: string[] = [];
  for (const [needle, values] of Object.entries(SEARCH_ALIASES)) {
    if (lower.includes(needle)) aliases.push(...values);
  }
  return aliases.map(normalize);
}

function tokenScore(token: string, path: string, aliases: string[]): number {
  const lower = normalize(path);
  const base = normalize(basename(path));
  const dir = normalize(dirname(path));
  const alias = aliases.find((value) => value.includes(token) || token.includes(value));

  if (base === token) return 140;
  if (base.startsWith(token)) return 105;
  if (base.includes(token)) return 80;
  if (alias) return 78;
  if (dir.includes(token)) return 48;
  if (lower.includes(token)) return 32;

  let cursor = 0;
  let gaps = 0;
  for (const char of token) {
    const next = lower.indexOf(char, cursor);
    if (next < 0) return 0;
    gaps += next - cursor;
    cursor = next + 1;
  }
  return Math.max(10, 28 - gaps);
}

/** Lightweight fuzzy score — higher is better; 0 means no match. */
export function scorePath(query: string, path: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 1;

  const aliases = aliasesForPath(path);
  let score = 0;

  for (const token of tokens) {
    const nextScore = tokenScore(token, path, aliases);
    if (nextScore === 0) return 0;
    score += nextScore;
  }

  if (normalize(path) === normalize(query)) score += 220;
  if (aliases.includes(normalize(query))) score += 110;
  return score;
}

export function searchHtmlItems(items: HtmlItem[], query: string, limit = 48): SearchResult[] {
  const q = query.trim();
  if (!q) {
    return items.slice(0, limit).map((item) => ({
      ...item,
      score: item.mtimeMs,
      segments: item.path.split('/'),
    }));
  }

  return items
    .map((item) => ({
      ...item,
      score: scorePath(q, item.path),
      segments: item.path.split('/'),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.mtimeMs - a.mtimeMs)
    .slice(0, limit);
}

export function loadRecentPaths(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecentPath(path: string): void {
  const prev = loadRecentPaths().filter((p) => p !== path);
  const next = [path, ...prev].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export function recentItems(items: HtmlItem[], limit = 8): HtmlItem[] {
  const recents = loadRecentPaths();
  const map = new Map(items.map((i) => [i.path, i]));
  return recents
    .map((p) => map.get(p))
    .filter((i): i is HtmlItem => i !== undefined)
    .slice(0, limit);
}
