import type { Connect } from 'vite';

const formatMarkdownUrl = new URL(
  '../../../skills/tableai-docx-master/lib/format-markdown.mjs',
  import.meta.url,
).href;

async function loadFormatMarkdown() {
  return import(/* @vite-ignore */ formatMarkdownUrl) as Promise<{
    formatRawToMarkdown: (opts: {
      raw: string;
      brandPath?: string;
      hint?: string;
      locale?: string;
    }) => Promise<Record<string, unknown>>;
    llmStatus: () => Record<string, unknown>;
  }>;
}

async function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function safeBrandPath(rel: string): void {
  const decoded = decodeURIComponent(rel);
  if (!decoded.startsWith('modules/') || !decoded.endsWith('/design.md')) {
    throw new Error('invalid brand path');
  }
}

export function attachDocxFormatApi(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/docx/format') && url !== '/api/docx/llm-status') {
      next();
      return;
    }
    try {
      if (req.method === 'GET' && url === '/api/docx/llm-status') {
        const { llmStatus } = await loadFormatMarkdown();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, ...llmStatus() }));
        return;
      }

      if (req.method === 'POST' && url === '/api/docx/format') {
        const body = (await readJsonBody(req)) as {
          raw?: string;
          brand?: string;
          hint?: string;
          locale?: string;
        };
        if (!body.raw?.trim()) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'raw text required' }));
          return;
        }
        const brand = body.brand ?? 'modules/kind-brand/design.md';
        safeBrandPath(brand);
        const { formatRawToMarkdown } = await loadFormatMarkdown();
        const result = await formatRawToMarkdown({
          raw: body.raw,
          brandPath: brand,
          hint: body.hint,
          locale: body.locale,
        });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result));
        return;
      }

      res.statusCode = 404;
      res.end('not found');
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: String(e instanceof Error ? e.message : e) }));
    }
  });
}
