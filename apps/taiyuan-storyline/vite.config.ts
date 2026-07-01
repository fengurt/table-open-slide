import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Connect, PreviewServer, ViteDevServer } from 'vite';
import { defineConfig } from 'vite';
import { buildManifest, safeSlidePath } from './server/buildManifest';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const EVENT_ROOT = path.resolve(appDir, '../../event/20260514taiyuan');

function taiyuanApiPlugin() {
  const handler = async (
    req: Connect.IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ) => {
    const rawUrl = req.url ?? '/';
    const url = new URL(rawUrl, 'http://local');
    if (req.method !== 'GET') {
      next();
      return;
    }
    if (url.pathname === '/api/manifest') {
      try {
        const slides = await buildManifest(EVENT_ROOT);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(
          JSON.stringify({
            root: EVENT_ROOT,
            slides,
            scannedAt: Date.now(),
          }),
        );
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: String((e as Error)?.message ?? e) }));
      }
      return;
    }
    if (url.pathname === '/api/slide') {
      const rel = url.searchParams.get('path');
      if (!rel) {
        res.statusCode = 400;
        res.end('missing path');
        return;
      }
      const abs = safeSlidePath(EVENT_ROOT, rel);
      if (!abs) {
        res.statusCode = 400;
        res.end('invalid path');
        return;
      }
      try {
        const html = await fs.readFile(abs, 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(html);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        res.statusCode = 500;
        res.end('read error');
      }
      return;
    }
    next();
  };

  return {
    name: 'taiyuan-storyline-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), taiyuanApiPlugin()],
  server: {
    port: 5188,
    fs: { allow: [EVENT_ROOT, appDir] },
  },
  preview: {
    port: 5188,
  },
});
