import { authHeaders, StudioApiError } from './api';

export type DocumentSetMeta = {
  slug: string;
  title: string;
  brandPath: string;
  brandId: string;
  tags: string[];
  client?: string;
  createdAt: string;
  updatedAt: string;
  filename: string;
  docxRel: string;
  pdfRel?: string;
  thumbRel?: string;
  pageCount?: number;
};

export async function fetchDocumentLibrary(params?: {
  q?: string;
  brand?: string;
}): Promise<DocumentSetMeta[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.brand) sp.set('brand', params.brand);
  const qs = sp.toString();
  const r = await fetch(`/api/docx/library${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
  if (!r.ok) throw new StudioApiError(r.status, await r.text());
  const d = (await r.json()) as { ok: boolean; sets: DocumentSetMeta[] };
  return d.sets;
}
