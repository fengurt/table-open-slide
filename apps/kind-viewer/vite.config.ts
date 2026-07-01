import type { ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Connect, PreviewServer, ViteDevServer } from 'vite';
import { defineConfig } from 'vite';
import { type ApiContext, handleApi } from './server/apiHandler';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const DECK_ROOT = path.resolve(appDir, '../../slides/kind-bp01/kind_presentation');
const ctx: ApiContext = { deckRoot: DECK_ROOT };

function kindApiPlugin() {
  const handler = async (
    req: Connect.IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ) => {
    const rawUrl = req.url ?? '/';
    const url = new URL(rawUrl, 'http://local');
    if (!url.pathname.startsWith('/api/')) {
      next();
      return;
    }
    const handled = await handleApi(req, res, ctx, url.pathname, url.searchParams);
    if (!handled) {
      res.statusCode = 404;
      res.end('not found');
    }
  };

  return {
    name: 'kind-viewer-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), kindApiPlugin()],
  server: {
    port: 5190,
    host: true,
    fs: { allow: [DECK_ROOT, appDir] },
  },
  preview: {
    port: 5190,
  },
});
