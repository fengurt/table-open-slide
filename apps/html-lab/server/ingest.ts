/**
 * Ingestion layer for the docx studio.
 *
 * Turns "text / link / document" into clean Markdown the docx-master engine can
 * render, and exposes two endpoints:
 *   POST /api/docx/ingest  → { markdown, title, source }
 *   POST /api/docx/create  → ingest → (optional LLM format) → build → links
 *
 * Source detection:
 *   - JSON body  { text } or { url }
 *   - Binary body (raw bytes) with `X-Doc-Filename` header → pdf / docx / md / txt
 *     (we avoid multipart parsing; the browser uploads the raw File body, which
 *      is robust for binary PDFs where boundary scanning is fragile).
 */
import dns from 'node:dns/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Connect } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB raw upload cap
const URL_FETCH_TIMEOUT_MS = 15_000;
const URL_MAX_BYTES = 8 * 1024 * 1024;

export type IngestSource = 'text' | 'url' | 'pdf' | 'docx' | 'md' | 'txt';

export type IngestOk = {
  ok: true;
  markdown: string;
  title: string | null;
  source: IngestSource;
  chars: number;
};
export type IngestErr = { ok: false; error: string };
export type IngestResult = IngestOk | IngestErr;

type FileInput = { kind: 'file'; filename: string; bytes: Buffer; contentType?: string };
type IngestInput = { kind: 'text'; text: string } | { kind: 'url'; url: string } | FileInput;

const pipelineUrl = pathToFileURL(
  path.join(repoRoot, 'skills/tableai-docx-master/lib/pipeline.mjs'),
).href;
const formatMarkdownUrl = pathToFileURL(
  path.join(repoRoot, 'skills/tableai-docx-master/lib/format-markdown.mjs'),
).href;

function safeBrandPath(rel: string): string {
  const decoded = decodeURIComponent(rel);
  if (!decoded.startsWith('modules/') || !decoded.endsWith('/design.md')) {
    throw new Error('invalid brand path');
  }
  return decoded;
}

async function htmlToMarkdown(html: string): Promise<string> {
  // Lazy import keeps turndown out of the cold path when only text is ingested.
  const TurndownService = (await import('turndown')).default;
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  });
  return String(td.turndown(html)).trim();
}

/** Block SSRF to loopback / private / link-local ranges. */
function isPrivateAddr(addr: string): boolean {
  if (net.isIP(addr) === 0) return false;
  if (addr === '::1' || addr === '0.0.0.0') return true;
  if (addr.startsWith('127.') || addr.startsWith('10.') || addr.startsWith('169.254.')) return true;
  if (addr.startsWith('192.168.')) return true;
  if (addr.startsWith('172.')) {
    const second = Number(addr.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  const lower = addr.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) return true;
  return false;
}

async function assertPublicUrl(target: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    throw new Error('invalid url');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('only http(s) urls are allowed');
  }
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('refusing to fetch internal host');
  }
  if (net.isIP(host) !== 0) {
    if (isPrivateAddr(host)) throw new Error('refusing to fetch private address');
    return u;
  }
  let resolved: string[] = [];
  try {
    const results = await dns.lookup(host, { all: true });
    resolved = results.map((r) => r.address);
  } catch {
    throw new Error('could not resolve host');
  }
  if (resolved.length === 0 || resolved.some(isPrivateAddr)) {
    throw new Error('refusing to fetch private address');
  }
  return u;
}

async function ingestUrl(target: string): Promise<IngestOk> {
  const u = await assertPublicUrl(target);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), URL_FETCH_TIMEOUT_MS);
  let html: string;
  try {
    const res = await fetch(u, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'docx-studio-ingest/1.0', accept: 'text/html,*/*' },
    });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > URL_MAX_BYTES) throw new Error('remote document too large');
    html = buf.toString('utf8');
  } finally {
    clearTimeout(timer);
  }

  const { JSDOM } = await import('jsdom');
  const { Readability } = await import('@mozilla/readability');
  const dom = new JSDOM(html, { url: u.href });
  const article = new Readability(dom.window.document).parse();
  const title = article?.title?.trim() || dom.window.document.title?.trim() || null;
  const contentHtml = article?.content;
  let markdown: string;
  if (contentHtml) {
    markdown = await htmlToMarkdown(contentHtml);
  } else {
    markdown = (article?.textContent || dom.window.document.body?.textContent || '').trim();
  }
  if (title && !markdown.startsWith('# ')) {
    markdown = `# ${title}\n\n${markdown}`;
  }
  return { ok: true, markdown, title, source: 'url', chars: markdown.length };
}

async function ingestPdf(bytes: Buffer): Promise<IngestOk> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    const text = String(result?.text ?? '').trim();
    const firstLine =
      text
        .split('\n')
        .find((l) => l.trim().length > 0)
        ?.trim() ?? null;
    const markdown = firstLine && !text.startsWith('# ') ? `# ${firstLine}\n\n${text}` : text;
    return { ok: true, markdown, title: firstLine, source: 'pdf', chars: markdown.length };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function ingestDocx(bytes: Buffer): Promise<IngestOk> {
  const mammoth = (await import('mammoth')).default;
  const { value: html } = await mammoth.convertToHtml({ buffer: bytes });
  const markdown = await htmlToMarkdown(html);
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
  return { ok: true, markdown, title: firstHeading, source: 'docx', chars: markdown.length };
}

function ingestText(text: string, source: IngestSource): IngestOk {
  const markdown = text.replace(/\r\n/g, '\n').trim();
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
  return { ok: true, markdown, title: firstHeading, source, chars: markdown.length };
}

function detectFileKind(filename: string, contentType?: string): IngestSource {
  const ext = path.extname(filename).toLowerCase();
  const ct = (contentType ?? '').toLowerCase();
  if (ext === '.pdf' || ct.includes('application/pdf')) return 'pdf';
  if (ext === '.docx' || ct.includes('wordprocessingml.document')) return 'docx';
  if (ext === '.md' || ext === '.markdown' || ct.includes('text/markdown')) return 'md';
  if (ext === '.txt' || ct.includes('text/plain')) return 'txt';
  throw new Error(`unsupported file type: ${ext || ct || 'unknown'}`);
}

export async function ingest(input: IngestInput): Promise<IngestResult> {
  try {
    if (input.kind === 'text') {
      if (!input.text.trim()) return { ok: false, error: 'text is empty' };
      return ingestText(input.text, 'text');
    }
    if (input.kind === 'url') {
      if (!input.url.trim()) return { ok: false, error: 'url is empty' };
      return await ingestUrl(input.url.trim());
    }
    const kind = detectFileKind(input.filename, input.contentType);
    if (kind === 'pdf') return await ingestPdf(input.bytes);
    if (kind === 'docx') return await ingestDocx(input.bytes);
    return ingestText(input.bytes.toString('utf8'), kind);
  } catch (e) {
    return { ok: false, error: String(e instanceof Error ? e.message : e) };
  }
}

async function readJsonBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += b.byteLength;
    if (size > MAX_UPLOAD_BYTES) throw new Error('request body too large');
    chunks.push(b);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

async function readRawBody(req: Connect.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += b.byteLength;
    if (size > MAX_UPLOAD_BYTES) throw new Error('upload too large');
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}

/**
 * Build an IngestInput plus the build params from a request, supporting JSON and
 * raw-binary uploads. For JSON, build params (brand/pages/…) ride in the same
 * object as text/url; for binary uploads they come from the query string.
 */
async function inputFromRequest(
  req: Connect.IncomingMessage,
  query: URLSearchParams,
): Promise<{ input: IngestInput; params: Record<string, unknown> }> {
  const contentType = (req.headers['content-type'] ?? '').toString().toLowerCase();
  if (contentType.includes('application/json')) {
    const body = await readJsonBody(req);
    if (typeof body.url === 'string' && body.url.trim()) {
      return { input: { kind: 'url', url: body.url }, params: body };
    }
    if (typeof body.text === 'string') {
      return { input: { kind: 'text', text: body.text }, params: body };
    }
    throw new Error('provide { text } or { url }');
  }
  // Raw-binary upload
  const filename =
    (req.headers['x-doc-filename'] as string | undefined) ?? query.get('filename') ?? 'upload.bin';
  const bytes = await readRawBody(req);
  if (bytes.byteLength === 0) throw new Error('empty upload');
  return {
    input: { kind: 'file', filename: path.basename(filename), bytes, contentType },
    params: Object.fromEntries(query.entries()),
  };
}

export function attachDocxIngestApi(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    const url = req.url ?? '';
    const isIngest = url.startsWith('/api/docx/ingest');
    const isCreate = url.startsWith('/api/docx/create');
    if (req.method !== 'POST' || (!isIngest && !isCreate)) {
      next();
      return;
    }
    try {
      const u = new URL(url, 'http://localhost');
      const { input, params } = await inputFromRequest(req, u.searchParams);

      const result = await ingest(input);
      if (!result.ok) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result));
        return;
      }

      if (isIngest) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result));
        return;
      }

      // --- one-shot create: ingest → (optional LLM format) → build ---
      const brand = safeBrandPath(String(params.brand ?? 'modules/kind-brand/design.md'));
      const wantFormat = params.format !== false && params.format !== 'false';
      const pages = Number(params.pages ?? 12) || 12;

      let markdown = result.markdown;
      let formatModel: string | undefined;
      let formatted = false;

      // Plain .md/.txt are already structured enough to render deterministically.
      const isAlreadyMarkdown = result.source === 'md';
      if (wantFormat && !isAlreadyMarkdown) {
        const { formatRawToMarkdown, llmStatus } = await import(formatMarkdownUrl);
        if (llmStatus().configured) {
          const f = await formatRawToMarkdown({
            raw: result.markdown,
            brandPath: brand,
            hint: typeof params.hint === 'string' ? params.hint : undefined,
            locale: typeof params.locale === 'string' ? params.locale : undefined,
          });
          if (f.ok && f.markdown) {
            markdown = f.markdown;
            formatModel = f.model;
            formatted = true;
          }
        }
      }

      const { buildFromMarkdown } = await import(pipelineUrl);
      const build = await buildFromMarkdown({
        markdown,
        brandPath: brand,
        outDir: 'out',
        pages,
        slug: typeof params.slug === 'string' ? params.slug : undefined,
        tags: Array.isArray(params.tags) ? (params.tags as string[]) : undefined,
        client: typeof params.client === 'string' ? params.client : undefined,
        documentSet: params.documentSet !== false && params.documentSet !== 'false',
      });

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: true,
          ...build,
          markdown,
          ingest: { source: result.source, title: result.title, chars: result.chars },
          format: { applied: formatted, model: formatModel ?? null },
        }),
      );
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: String(e instanceof Error ? e.message : e) }));
    }
  });
}
