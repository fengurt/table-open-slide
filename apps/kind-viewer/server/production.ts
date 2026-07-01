import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ApiContext, handleApi } from './apiHandler.js';
import { getDb } from './db.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(serverDir, '..');
const distDir = path.join(appRoot, 'dist');
const deckRoot =
  process.env.KIND_DECK_ROOT?.trim() ||
  path.resolve(appRoot, '../../slides/kind-bp01/kind_presentation');

const ctx: ApiContext = { deckRoot };
const port = Number(process.env.PORT ?? '5190');

getDb();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

async function serveStatic(
  pathname: string,
  res: import('node:http').ServerResponse,
): Promise<boolean> {
  const safe = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(distDir, safe);
  const rel = path.relative(distDir, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', ext === '.html' ? 'no-store' : 'public, max-age=3600');
    res.end(data);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return false;
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(req, res, ctx, url.pathname, url.searchParams);
      if (handled) return;
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    if (await serveStatic(url.pathname, res)) return;
    if (await serveStatic('/index.html', res)) return;
    res.statusCode = 404;
    res.end('not found');
  } catch {
    res.statusCode = 500;
    res.end('server error');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`KiND viewer http://0.0.0.0:${port}/`);
  console.log(`Deck: ${deckRoot}`);
});
