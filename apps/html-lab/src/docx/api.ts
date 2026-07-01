export type BrandListItem = { id: string; path: string; name: string };

export type BrandTokens = {
  name: string;
  path: string;
  pageSize: string;
  colors: {
    ink: string;
    accent: string;
    gold: string;
    muted: string;
    paper: string;
    tableHeaderFill: string;
  };
  fonts: { latin: string; eastAsia: string };
  headerText: string;
  footerConfidential: string;
};

export type LlmStatus = {
  ok?: boolean;
  configured: boolean;
  model: string | null;
  baseUrl: string | null;
  source?: 'none' | 'env' | 'studio';
  providerCount?: number;
};

export type FormatResult = {
  ok: boolean;
  markdown?: string;
  error?: string;
  source?: string;
  model?: string;
};

export type BuildResult = {
  ok: boolean;
  title?: string;
  filename?: string;
  docxRel?: string;
  error?: string;
  markdown?: string;
  validated?: { ok: boolean; error?: string };
  preview?: { pdfRel?: string; pages: Array<{ name: string; rel: string }> };
  documentMeta?: import('./documentLibrary').DocumentSetMeta;
};

export type IngestResult = {
  ok: boolean;
  markdown?: string;
  title?: string | null;
  source?: string;
  chars?: number;
  error?: string;
};

export type CreateResult = BuildResult & {
  ingest?: { source: string; title: string | null; chars: number };
  format?: { applied: boolean; model: string | null };
};

const brandTokenCache = new Map<string, Promise<BrandTokens>>();

const STUDIO_TOKEN_KEY = 'docx-studio-token:v1';

/** Fired on `window` whenever the studio token is saved or cleared, so any
 *  mounted panel can re-fetch its data without a full page reload. */
export const STUDIO_TOKEN_EVENT = 'studio-token-changed';

/** Error that preserves the HTTP status so callers can tell a 401 (locked —
 *  needs a token) apart from a genuine server/parse failure. */
export class StudioApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'StudioApiError';
    this.status = status;
  }
}

/** True when the error is an auth failure (missing/invalid studio token). */
export function isLockedError(err: unknown): boolean {
  return err instanceof StudioApiError && (err.status === 401 || err.status === 403);
}

export function getStudioToken(): string {
  try {
    return localStorage.getItem(STUDIO_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setStudioToken(token: string): void {
  try {
    if (token) localStorage.setItem(STUDIO_TOKEN_KEY, token);
    else localStorage.removeItem(STUDIO_TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) */
  }
  // Mirror into a same-origin cookie so <img>/<a> subresource GETs to
  // /api/docx/out/* (which can't set an Authorization header) authenticate too.
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    // biome-ignore lint/suspicious/noDocumentCookie: shared-token cookie for same-origin subresource (img/a) auth; Cookie Store API is async + not broadly supported
    document.cookie = token
      ? `docx_studio_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax${secure}`
      : 'docx_studio_token=; path=/; max-age=0; SameSite=Lax';
  } catch {
    /* document unavailable */
  }
  // Let mounted panels (hub library, status, brand pickers) re-fetch with the
  // new token instead of forcing a reload.
  try {
    window.dispatchEvent(new Event(STUDIO_TOKEN_EVENT));
  } catch {
    /* non-browser env */
  }
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getStudioToken();
  return { ...(extra ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function fetchAuthStatus(): Promise<{ required: boolean }> {
  try {
    const r = await fetch('/api/docx/auth-status');
    if (!r.ok) return { required: false };
    return (await r.json()) as { required: boolean };
  } catch {
    return { required: false };
  }
}

export async function fetchLlmStatus(): Promise<LlmStatus> {
  const r = await fetch('/api/docx/llm-status', { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as LlmStatus;
}

export async function fetchBrands(): Promise<BrandListItem[]> {
  const r = await fetch('/api/docx/brands', { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  const d = (await r.json()) as { brands: BrandListItem[] };
  return d.brands;
}

export async function fetchBrandTokens(path: string): Promise<BrandTokens> {
  const cached = brandTokenCache.get(path);
  if (cached) return cached;

  const pending = (async () => {
    const r = await fetch(`/api/docx/brand?path=${encodeURIComponent(path)}`, {
      headers: authHeaders(),
    });
    if (!r.ok) throw new Error(await r.text());
    const d = (await r.json()) as { ok: boolean; tokens: BrandTokens };
    if (!d.ok) throw new Error('brand load failed');
    return d.tokens;
  })();

  brandTokenCache.set(path, pending);
  try {
    return await pending;
  } catch (e) {
    brandTokenCache.delete(path);
    throw e;
  }
}

export async function fetchSampleMarkdown(path: string): Promise<string> {
  const r = await fetch(`/api/docx/sample?path=${encodeURIComponent(path)}`, {
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.text();
}

export async function formatRawText(body: {
  raw: string;
  brand: string;
  hint?: string;
  locale?: string;
}): Promise<FormatResult> {
  const r = await fetch('/api/docx/format', {
    method: 'POST',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return (await r.json()) as FormatResult;
}

export async function buildDocx(body: {
  markdown: string;
  brand: string;
  pages?: number;
  filename?: string;
  slug?: string;
  tags?: string[];
  client?: string;
  documentSet?: boolean;
}): Promise<BuildResult> {
  const r = await fetch('/api/docx/build', {
    method: 'POST',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return (await r.json()) as BuildResult;
}

/** Ingest a link or pasted text → clean Markdown (no build). */
export async function ingestSource(body: { text?: string; url?: string }): Promise<IngestResult> {
  const r = await fetch('/api/docx/ingest', {
    method: 'POST',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return (await r.json()) as IngestResult;
}

function uploadHeaders(file: File): Record<string, string> {
  return authHeaders({
    'content-type': file.type || 'application/octet-stream',
    'x-doc-filename': encodeURIComponent(file.name),
  });
}

/** Ingest an uploaded PDF/DOCX/MD/TXT file → clean Markdown (no build). */
export async function ingestFile(file: File): Promise<IngestResult> {
  const r = await fetch(`/api/docx/ingest?filename=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: uploadHeaders(file),
    body: file,
  });
  return (await r.json()) as IngestResult;
}

type CreateParams = {
  brand: string;
  hint?: string;
  locale?: string;
  pages?: number;
  format?: boolean;
  documentSet?: boolean;
  slug?: string;
  tags?: string[];
  client?: string;
};

/** One-shot: text/url → ingest → optional LLM format → build → links. */
export async function createFromSource(
  body: { text?: string; url?: string } & CreateParams,
): Promise<CreateResult> {
  const r = await fetch('/api/docx/create', {
    method: 'POST',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify(body),
  });
  return (await r.json()) as CreateResult;
}

/** One-shot from an uploaded file. */
export async function createFromFile(file: File, params: CreateParams): Promise<CreateResult> {
  const qs = new URLSearchParams();
  qs.set('filename', file.name);
  qs.set('brand', params.brand);
  if (params.hint) qs.set('hint', params.hint);
  if (params.locale) qs.set('locale', params.locale);
  if (params.pages != null) qs.set('pages', String(params.pages));
  if (params.format === false) qs.set('format', 'false');
  if (params.documentSet === false) qs.set('documentSet', 'false');
  const r = await fetch(`/api/docx/create?${qs.toString()}`, {
    method: 'POST',
    headers: uploadHeaders(file),
    body: file,
  });
  return (await r.json()) as CreateResult;
}

export function outUrl(relWithinOut: string): string {
  return `/api/docx/out/${encodeURIComponent(relWithinOut)}`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
