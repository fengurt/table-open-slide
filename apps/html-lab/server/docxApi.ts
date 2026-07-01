import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Connect } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const pipelineUrl = pathToFileURL(
  path.join(repoRoot, 'skills/tableai-docx-master/lib/pipeline.mjs'),
).href;

async function loadPipeline() {
  return import(pipelineUrl);
}

function safeOutPath(rel: string): string {
  const decoded = decodeURIComponent(rel);
  let normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  if (normalized === 'out' || normalized.startsWith(`out${path.sep}`)) {
    normalized = normalized.slice(4).replace(/^[/\\]/, '');
  }
  // Never serve dot-directories/files (e.g. out/.studio/settings.json holds
  // admin-configured API keys). Reject any segment starting with a dot.
  if (normalized.split(/[/\\]/).some((seg) => seg.startsWith('.'))) {
    throw new Error('forbidden path');
  }
  const abs = path.join(repoRoot, 'out', normalized);
  const outRoot = path.join(repoRoot, 'out');
  if (!abs.startsWith(`${outRoot}${path.sep}`) && abs !== outRoot) {
    throw new Error('path outside out/');
  }
  return abs;
}

function safeBrandPath(rel: string): string {
  const decoded = decodeURIComponent(rel);
  if (!decoded.startsWith('modules/') || !decoded.endsWith('/design.md')) {
    throw new Error('invalid brand path');
  }
  const abs = path.join(repoRoot, decoded);
  if (!abs.startsWith(path.join(repoRoot, 'modules'))) {
    throw new Error('brand path outside modules/');
  }
  return abs;
}

async function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function attachDocxApi(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/docx/')) {
      next();
      return;
    }
    try {
      const pipeline = await loadPipeline();

      if (req.method === 'GET' && url.startsWith('/api/docx/library')) {
        const u = new URL(url, 'http://localhost');
        const q = u.searchParams.get('q') ?? undefined;
        const brand = u.searchParams.get('brand') ?? undefined;
        const { listDocumentSets } = await import(
          pathToFileURL(path.join(repoRoot, 'skills/tableai-docx-master/lib/document-library.mjs'))
            .href
        );
        const sets = await listDocumentSets(repoRoot, { q, brand });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, sets }));
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/docx/brands')) {
        const brands = await pipeline.listBrands();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ brands }));
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/docx/brand?')) {
        const u = new URL(url, 'http://localhost');
        const brandPath = u.searchParams.get('path');
        if (!brandPath) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'path required' }));
          return;
        }
        safeBrandPath(brandPath);
        const tokens = await pipeline.getBrandTokens(brandPath);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, tokens }));
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/docx/sample?')) {
        const u = new URL(url, 'http://localhost');
        const samplePath = u.searchParams.get('path');
        if (!samplePath?.endsWith('.md')) {
          res.statusCode = 400;
          res.end('invalid sample path');
          return;
        }
        const abs = path.join(repoRoot, samplePath.replace(/^(\.\.(\/|\\|$))+/, ''));
        if (!abs.startsWith(repoRoot)) {
          res.statusCode = 400;
          res.end('path outside repo');
          return;
        }
        const body = await fs.readFile(abs, 'utf8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(body);
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/docx/out/')) {
        const rel = url.slice('/api/docx/out/'.length).split('?')[0] ?? '';
        const abs = safeOutPath(rel);
        const st = await fs.stat(abs);
        const ext = path.extname(abs).toLowerCase();
        const types: Record<string, string> = {
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.pdf': 'application/pdf',
          '.png': 'image/png',
        };
        const base = path.basename(abs);
        const asciiName = base.replace(/[^\x20-\x7E]/g, '_') || 'download';
        // .docx → force download; pdf/png stay inline for in-browser preview.
        const disposition = ext === '.docx' ? 'attachment' : 'inline';
        res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
        res.setHeader('Content-Length', String(st.size));
        res.setHeader(
          'Content-Disposition',
          `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(base)}`,
        );
        await streamPipeline(createReadStream(abs), res);
        return;
      }

      if (req.method === 'POST' && url === '/api/docx/build') {
        const body = (await readJsonBody(req)) as {
          markdown?: string;
          brand?: string;
          pages?: number;
          filename?: string;
          slug?: string;
          tags?: string[];
          client?: string;
          documentSet?: boolean;
        };
        if (!body.markdown?.trim()) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'markdown required' }));
          return;
        }
        const brandPath = body.brand ?? 'modules/kind-brand/design.md';
        safeBrandPath(brandPath);
        const result = await pipeline.buildFromMarkdown({
          markdown: body.markdown,
          brandPath,
          outDir: 'out',
          pages: body.pages ?? 12,
          filename: body.filename,
          slug: body.slug,
          tags: body.tags,
          client: body.client,
          documentSet: body.documentSet,
        });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: true, ...result }));
        return;
      }

      res.statusCode = 404;
      res.end('not found');
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      // Path-safety rejections are client errors, not server faults.
      const isPathError = /forbidden path|outside|invalid/.test(msg);
      res.statusCode = isPathError ? 403 : 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: msg }));
    }
  });
}
