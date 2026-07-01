export function readDeepLinkPath(): string | null {
  const path = new URLSearchParams(window.location.search).get('path');
  if (!path?.endsWith('.html')) return null;
  return path;
}

export function syncUrlPath(path: string | null): void {
  const url = new URL(window.location.href);
  if (path) url.searchParams.set('path', path);
  else url.searchParams.delete('path');
  window.history.replaceState(null, '', url);
}

export function previewPageUrl(path: string, base?: string): string {
  const origin = base ?? `${window.location.origin}${window.location.pathname}`;
  return `${origin}?path=${encodeURIComponent(path)}`;
}

export function isPreviewOnlyMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'preview' || params.get('embed') === '1';
}
