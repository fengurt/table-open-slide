import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import fg from 'fast-glob';
import type { Connect, Plugin, PreviewServer, ViteDevServer } from 'vite';
import { defineConfig } from 'vite';
import { attachAdminApi } from './server/adminApi.js';
import { attachAuthGate } from './server/authGate.js';
import { attachDocxApi } from './server/docxApi.js';
import { attachDocxFormatApi } from './server/docxFormat.js';
import { captureHtmlPng, type ExportVariant } from './server/exportPng.js';
import { attachDocxIngestApi } from './server/ingest.js';
import { attachLabHealthApi } from './server/labHealth.js';
import { attachPageGenerateApi } from './server/pageGenerate.js';
import { attachSiteGate } from './server/siteGate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_LIST = 2500;

function safeHtmlPath(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(repoRoot, normalized);
  if (!abs.startsWith(repoRoot)) {
    throw new Error('path outside repo');
  }
  if (!abs.endsWith('.html')) {
    throw new Error('not an html file');
  }
  return abs;
}

function safeRepoJsonPath(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(repoRoot, normalized);
  if (!abs.startsWith(repoRoot)) {
    throw new Error('path outside repo');
  }
  if (!abs.endsWith('.json')) {
    throw new Error('not a json file');
  }
  return abs;
}

function attachHtmlLabApi(middlewares: Connect.Server) {
  middlewares.use(async (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/')) {
      next();
      return;
    }
    try {
      if (req.method === 'GET' && url.startsWith('/api/html-files')) {
        const u = new URL(url, 'http://localhost');
        const roots = u.searchParams
          .get('roots')
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? ['landing01', 'slides'];
        const patterns = roots.map((r) => `${r}/**/*.html`);
        let paths = await fg(patterns, {
          cwd: repoRoot,
          onlyFiles: true,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/coverage/**',
            'apps/html-lab/**',
          ],
          followSymbolicLinks: false,
        });
        const total = paths.length;
        let truncated = false;
        if (paths.length > MAX_LIST) {
          paths = paths.slice(0, MAX_LIST);
          truncated = true;
        }
        const items = await Promise.all(
          paths.map(async (rel) => {
            const abs = path.join(repoRoot, rel);
            const st = await fs.stat(abs);
            return { path: rel, mtimeMs: st.mtimeMs, size: st.size };
          }),
        );
        items.sort((a, b) => b.mtimeMs - a.mtimeMs);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ items, truncated, total }));
        return;
      }
      if (req.method === 'GET' && url.startsWith('/api/project-manifest')) {
        const u = new URL(url, 'http://localhost');
        const p = u.searchParams.get('path');
        if (!p) {
          res.statusCode = 400;
          res.end('missing path');
          return;
        }
        const abs = safeRepoJsonPath(p);
        const body = await fs.readFile(abs, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(body);
        return;
      }
      if (
        req.method === 'GET' &&
        (url.startsWith('/api/raw-html') || url.startsWith('/api/preview'))
      ) {
        const u = new URL(url, 'http://localhost');
        const p = u.searchParams.get('path');
        if (!p) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('missing path');
          return;
        }
        const abs = safeHtmlPath(p);
        const st = await fs.stat(abs);
        if (st.size > MAX_FILE_BYTES) {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('file too large');
          return;
        }
        const body = await fs.readFile(abs, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.end(body);
        return;
      }
      if (req.method === 'PUT' && url.startsWith('/api/raw-html')) {
        const u = new URL(url, 'http://localhost');
        const p = u.searchParams.get('path');
        if (!p) {
          res.statusCode = 400;
          res.end('missing path');
          return;
        }
        const abs = safeHtmlPath(p);
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const body = Buffer.concat(chunks).toString('utf8');
        if (Buffer.byteLength(body, 'utf8') > MAX_FILE_BYTES) {
          res.statusCode = 413;
          res.end('file too large');
          return;
        }
        await fs.writeFile(abs, body, 'utf8');
        res.statusCode = 204;
        res.end();
        return;
      }
      if (req.method === 'GET' && url.startsWith('/api/export-png')) {
        const u = new URL(url, 'http://localhost');
        const p = u.searchParams.get('path');
        const variant = (u.searchParams.get('variant') ?? 'original') as ExportVariant;
        if (!p) {
          res.statusCode = 400;
          res.end('missing path');
          return;
        }
        const abs = safeHtmlPath(p);
        let tuneParams: Record<string, number> | undefined;
        const tuneRaw = u.searchParams.get('tune');
        if (tuneRaw) {
          try {
            tuneParams = JSON.parse(Buffer.from(tuneRaw, 'base64').toString('utf8')) as Record<
              string,
              number
            >;
          } catch {
            res.statusCode = 400;
            res.end('invalid tune params');
            return;
          }
        }
        const { buffer, contentType } = await captureHtmlPng(abs, variant, p, tuneParams);
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store');
        res.end(buffer);
        return;
      }
    } catch (e) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(String(e instanceof Error ? e.message : e));
      return;
    }
    next();
  });
}

function htmlLabApiPlugin(): Plugin {
  return {
    name: 'html-lab-api',
    configureServer(server: ViteDevServer) {
      attachSiteGate(server.middlewares);
      attachAdminApi(server.middlewares);
      attachAuthGate(server.middlewares);
      attachHtmlLabApi(server.middlewares);
      attachPageGenerateApi(server.middlewares);
      attachDocxFormatApi(server.middlewares);
      attachDocxIngestApi(server.middlewares);
      attachDocxApi(server.middlewares);
      attachLabHealthApi(server.middlewares);
    },
    configurePreviewServer(server: PreviewServer) {
      attachSiteGate(server.middlewares);
      attachAdminApi(server.middlewares);
      attachAuthGate(server.middlewares);
      attachHtmlLabApi(server.middlewares);
      attachPageGenerateApi(server.middlewares);
      attachDocxFormatApi(server.middlewares);
      attachDocxIngestApi(server.middlewares);
      attachDocxApi(server.middlewares);
      attachLabHealthApi(server.middlewares);
    },
  };
}

export default defineConfig({
  plugins: [react(), htmlLabApiPlugin()],
  server: { port: 3333, strictPort: true, host: true },
  preview: {
    port: 3334,
    strictPort: true,
    host: true,
    // Production runs `vite preview` behind nginx (slides.opcglobal.cn).
    allowedHosts: ['slides.opcglobal.cn', 'localhost', '127.0.0.1', '.opcglobal.cn'],
  },
  root: __dirname,
  publicDir: false,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (
            id.includes('node_modules/markdown-it') ||
            id.includes('node_modules/turndown') ||
            id.includes('node_modules/dompurify')
          ) {
            return 'content-tools';
          }
        },
      },
    },
  },
});
