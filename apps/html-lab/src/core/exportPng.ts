export type PngExportVariant = 'original' | 'hd' | 'web';

export type PngVariantMeta = {
  id: PngExportVariant;
  label: string;
  description: string;
  ext: 'png' | 'jpg';
};

export const PNG_VARIANTS: PngVariantMeta[] = [
  {
    id: 'original',
    label: 'Original',
    description: '1280×720 @2× — lossless PNG',
    ext: 'png',
  },
  {
    id: 'hd',
    label: 'HD compressed',
    description: '1920×1080 @2× — optimized PNG',
    ext: 'png',
  },
  {
    id: 'web',
    label: 'Web',
    description: '960×540 — JPEG ~88%',
    ext: 'jpg',
  },
];

export async function exportPagePng(
  path: string,
  variant: PngExportVariant,
  tuneParams?: Record<string, number>,
): Promise<Blob> {
  const q = new URLSearchParams({ path, variant });
  if (tuneParams && Object.keys(tuneParams).length > 0) {
    q.set('tune', btoa(unescape(encodeURIComponent(JSON.stringify(tuneParams)))));
  }
  const r = await fetch(`/api/export-png?${q}`);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || `Export failed (${r.status})`);
  }
  return r.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportFilename(path: string, variant: PngExportVariant): string {
  const base = path.replace(/[/\\]/g, '__').replace(/\.html$/i, '');
  const ext = PNG_VARIANTS.find((v) => v.id === variant)?.ext ?? 'png';
  return `${base}--${variant}.${ext}`;
}
