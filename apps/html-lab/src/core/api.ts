import type { HtmlItem, ListResponse } from './types';

export async function fetchHtmlList(roots: string[]): Promise<ListResponse> {
  const q = new URLSearchParams({ roots: roots.join(',') });
  const r = await fetch(`/api/html-files?${q}`);
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as ListResponse;
}

export async function fetchRawHtml(path: string): Promise<string> {
  const r = await fetch(`/api/raw-html?path=${encodeURIComponent(path)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.text();
}

export function basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] ?? path;
}

export function dirname(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.slice(0, idx) : '';
}

export function formatFileMeta(item: HtmlItem): string {
  return `${new Date(item.mtimeMs).toLocaleString()} · ${(item.size / 1024).toFixed(1)} KB`;
}
