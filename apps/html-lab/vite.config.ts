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
import { captureHtmlPdf } from './server/exportPdf.js';
import { captureHtmlPng, type ExportVariant } from './server/exportPng.js';
import { attachDocxIngestApi } from './server/ingest.js';
import { attachLabHealthApi } from './server/labHealth.js';
import { attachPageGenerateApi } from './server/pageGenerate.js';
import { attachSiteGate } from './server/siteGate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_LIST = 2500;
const VIRTUAL_DECK_PREFIX = 'virtual-slide-folder:';
const VIRTUAL_MANIFEST_PREFIX = 'virtual-slide-folder-manifest:';
const VIRTUAL_SLIDE_ROOTS = ['slides', 'event'];
const ASSET_CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

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

function safeRepoAssetPath(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(repoRoot, normalized);
  if (!abs.startsWith(repoRoot)) {
    throw new Error('path outside repo');
  }
  const ext = path.extname(abs).toLowerCase();
  if (!ASSET_CONTENT_TYPES[ext]) {
    throw new Error('unsupported asset type');
  }
  return abs;
}

function safeRepoDirPath(raw: string): string {
  const decoded = decodeURIComponent(raw);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(repoRoot, normalized);
  if (!abs.startsWith(repoRoot)) {
    throw new Error('path outside repo');
  }
  const rel = path.relative(repoRoot, abs).split(path.sep).join('/');
  if (!VIRTUAL_SLIDE_ROOTS.some((root) => rel === root || rel.startsWith(`${root}/`))) {
    throw new Error('unsupported virtual deck root');
  }
  return abs;
}

type ProjectManifestSummary = {
  id?: unknown;
  title?: unknown;
  subtitle?: unknown;
  description?: unknown;
  slideCount?: unknown;
  deckPath?: unknown;
  tags?: unknown;
  theme?: unknown;
};

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function projectIdFromManifestPath(rel: string): string {
  const parts = rel.split('/');
  return parts.length >= 3 ? parts[2] : path.basename(path.dirname(rel));
}

function slugFromPath(rel: string): string {
  return rel
    .replace(/\.[^.]+$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function titleFromPath(rel: string): string {
  return path.basename(rel).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || rel;
}

function slideFileSort(a: string, b: string): number {
  const na = Number(a.match(/(?:slide[_-]?|^)(\d+)/i)?.[1] ?? Number.NaN);
  const nb = Number(b.match(/(?:slide[_-]?|^)(\d+)/i)?.[1] ?? Number.NaN);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function listVirtualSlideFiles(relDir: string): Promise<string[]> {
  const absDir = safeRepoDirPath(relDir);
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.posix.join(relDir, entry.name))
    .sort(slideFileSort);
}

async function buildVirtualManifest(relDir: string) {
  const files = await listVirtualSlideFiles(relDir);
  const title = titleFromPath(relDir);
  return {
    id: slugFromPath(relDir),
    title,
    subtitle: `Auto-discovered folder deck · ${files.length} HTML slides`,
    description: `Generated from ${relDir}`,
    slideCount: files.length,
    deckPath: `${VIRTUAL_DECK_PREFIX}${relDir}`,
    modules: [
      {
        id: 'slides',
        title: 'Slides',
        start: 1,
        end: files.length,
        act: 'Folder',
      },
    ],
  };
}

async function buildVirtualDeckHtml(relDir: string): Promise<string> {
  const files = await listVirtualSlideFiles(relDir);
  const title = titleFromPath(relDir);
  const sections = files
    .map((file, index) => {
      const slideTitle = titleFromPath(file);
      const src = `/api/preview?path=${encodeURIComponent(file)}`;
      return `<section class="slide" data-title="${escapeHtml(slideTitle)}"><iframe title="${escapeHtml(
        slideTitle,
      )}" src="${src}"></iframe><span class="slide-badge">${String(index + 1).padStart(
        2,
        '0',
      )}</span></section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} · Folder Deck</title>
<style>
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#050a12;color:#f7f4ed;font-family:ui-sans-serif,system-ui,sans-serif}
#deck{position:fixed;inset:0;display:flex;height:100vh;transition:transform .48s cubic-bezier(.76,0,.24,1)}
.slide{position:relative;flex:0 0 100vw;width:100vw;height:100vh;background:#050a12;overflow:hidden}
.slide iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}
.slide-badge{position:absolute;right:1rem;bottom:1rem;z-index:3;padding:.35rem .5rem;border:1px solid rgba(255,255,255,.22);background:rgba(5,10,18,.72);font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#f7f4ed}
#nav{position:fixed;right:1rem;top:1rem;z-index:5;display:flex;gap:.55rem;align-items:center;padding:.5rem .65rem;border:1px solid rgba(255,255,255,.18);background:rgba(5,10,18,.72);backdrop-filter:blur(12px);font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#f7f4ed}
body.is-embedded #nav{display:none}
</style>
</head>
<body>
<div id="deck">
${sections}
</div>
<div id="nav"><span id="label">1 / ${files.length}</span></div>
<script>
const deck=document.getElementById('deck');
const slides=[...document.querySelectorAll('.slide')];
const label=document.getElementById('label');
let idx=0,lock=false;
if(window.parent!==window) document.body.classList.add('is-embedded');
deck.style.width=\`\${slides.length*100}vw\`;
function post(){try{parent.postMessage({type:'atelier-slide',index:idx,total:slides.length},'*')}catch(_){}}
function update(){deck.style.transform=\`translateX(\${-idx*100}vw)\`;label.textContent=\`\${idx+1} / \${slides.length}\`;history.replaceState(null,'',\`#\${idx+1}\`);post()}
function go(n){if(lock)return;idx=Math.max(0,Math.min(slides.length-1,n));lock=true;update();setTimeout(()=>lock=false,160)}
addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key))go(idx+1);if(['ArrowLeft','PageUp'].includes(e.key))go(idx-1);if(e.key==='Home')go(0);if(e.key==='End')go(slides.length-1)});
addEventListener('wheel',e=>{if(Math.abs(e.deltaY)+Math.abs(e.deltaX)<45)return;go(idx+(e.deltaY+e.deltaX>0?1:-1))},{passive:true});
addEventListener('message',e=>{if(e.data?.type==='atelier-go'&&typeof e.data.index==='number')go(e.data.index);if(e.data?.type==='atelier-low-power')document.body.classList.add('is-embedded')});
addEventListener('hashchange',()=>{const m=location.hash.match(/^#(\\d+)$/);if(m)go(Number(m[1])-1)});
const m=location.hash.match(/^#(\\d+)$/);if(m)idx=Math.max(0,Math.min(slides.length-1,Number(m[1])-1));update();
</script>
</body>
</html>`;
}

async function discoverSlideProjects() {
  const manifests = await fg(['slides/**/manifest.json'], {
    cwd: repoRoot,
    onlyFiles: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**'],
    followSymbolicLinks: false,
  });
  const projects = await Promise.all(
    manifests.sort().map(async (manifestPath) => {
      const abs = path.join(repoRoot, manifestPath);
      const raw = await fs.readFile(abs, 'utf8');
      const manifest = JSON.parse(raw) as ProjectManifestSummary;
      const folderId = projectIdFromManifestPath(manifestPath);
      const id = stringValue(manifest.id, folderId);
      const deckPath = stringValue(
        manifest.deckPath,
        path.posix.join(path.posix.dirname(manifestPath), 'deck/index.html'),
      );
      const tags = Array.isArray(manifest.tags)
        ? manifest.tags.filter((tag): tag is string => typeof tag === 'string')
        : [stringValue(manifest.theme, 'deck'), `${Number(manifest.slideCount) || 0}p`].filter(
            Boolean,
          );
      return {
        id,
        title: stringValue(manifest.title, id),
        subtitle: stringValue(manifest.subtitle, 'HTML deck'),
        description: stringValue(manifest.description, `Discovered from ${manifestPath}`),
        slideCount: Number(manifest.slideCount) || 0,
        manifestPath,
        deckPath,
        tags,
      };
    }),
  );
  const htmlFiles = await fg(['slides/**/*.html', 'event/**/*.html'], {
    cwd: repoRoot,
    onlyFiles: true,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      'slides/projects/**',
    ],
    followSymbolicLinks: false,
  });
  const dirs = new Map<string, string[]>();
  for (const file of htmlFiles) {
    const dir = path.posix.dirname(file);
    dirs.set(dir, [...(dirs.get(dir) ?? []), file]);
  }
  const virtualProjects = [...dirs.entries()]
    .filter(([, files]) => files.length >= 3)
    .map(([dir, files]) => {
      const slideCount = files.length;
      const title = titleFromPath(dir);
      return {
        id: slugFromPath(dir),
        title,
        subtitle: `Folder deck · ${slideCount} HTML slides`,
        description: `Auto-discovered from ${dir}`,
        slideCount,
        manifestPath: `${VIRTUAL_MANIFEST_PREFIX}${dir}`,
        deckPath: `${VIRTUAL_DECK_PREFIX}${dir}`,
        tags: ['folder', `${slideCount}p`],
      };
    });
  return [...projects, ...virtualProjects].sort((a, b) => a.title.localeCompare(b.title));
}

async function wrapProjectSlideFragment(relPath: string, html: string): Promise<string> {
  if (/<html[\s>]/i.test(html)) return html;

  const match = relPath.match(/^(slides\/projects\/[^/]+)\/pages\/slide-\d+\.html$/);
  if (!match) return html;

  const deckPath = path.join(repoRoot, match[1], 'deck/index.html');
  let deckHtml = '';
  try {
    deckHtml = await fs.readFile(deckPath, 'utf8');
  } catch {
    return html;
  }

  const head = deckHtml.match(/<head[\s\S]*?<\/head>/i)?.[0];
  if (!head) return html;

  const previewCss = `
<style>
  #deck {
    display: block !important;
    height: 100vh !important;
    inset: 0 !important;
    position: fixed !important;
    transform: none !important;
    transition: none !important;
    width: 100vw !important;
  }
  #deck > .slide {
    content-visibility: visible !important;
    flex: none !important;
    height: 100vh !important;
    width: 100vw !important;
  }
  #hint,
  #nav,
  canvas.bg {
    display: none !important;
  }
</style>`;
  const patchedHead = head.replace(/<\/head>/i, `${previewCss}\n</head>`);

  return `<!DOCTYPE html>
<html lang="zh-CN">
${patchedHead}
<body class="deck-large low-power">
<div id="deck">
${html}
</div>
<script>
  const slide = document.querySelector('.slide');
  document.body.classList.toggle('light-bg', slide?.classList.contains('light'));
</script>
</body>
</html>`;
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
        if (p.startsWith(VIRTUAL_MANIFEST_PREFIX)) {
          const body = await buildVirtualManifest(p.slice(VIRTUAL_MANIFEST_PREFIX.length));
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(body));
          return;
        }
        const abs = safeRepoJsonPath(p);
        const body = await fs.readFile(abs, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(body);
        return;
      }
      if (req.method === 'GET' && url.startsWith('/api/projects')) {
        const projects = await discoverSlideProjects();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ projects }));
        return;
      }
      if (req.method === 'GET' && url.startsWith('/api/asset')) {
        const u = new URL(url, 'http://localhost');
        const p = u.searchParams.get('path');
        if (!p) {
          res.statusCode = 400;
          res.end('missing path');
          return;
        }
        const abs = safeRepoAssetPath(p);
        const st = await fs.stat(abs);
        if (st.size > MAX_FILE_BYTES) {
          res.statusCode = 413;
          res.end('file too large');
          return;
        }
        const ext = path.extname(abs).toLowerCase();
        const body = await fs.readFile(abs);
        res.statusCode = 200;
        res.setHeader('Content-Type', ASSET_CONTENT_TYPES[ext]);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=3600');
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
        if (url.startsWith('/api/preview') && p.startsWith(VIRTUAL_DECK_PREFIX)) {
          const body = await buildVirtualDeckHtml(p.slice(VIRTUAL_DECK_PREFIX.length));
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.end(body);
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
        let body = await fs.readFile(abs, 'utf8');
        if (url.startsWith('/api/preview')) {
          body = await wrapProjectSlideFragment(p, body);
        }
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
      if (req.method === 'GET' && url.startsWith('/api/export-pdf')) {
        const u = new URL(url, 'http://localhost');
        const p = u.searchParams.get('path');
        const slideRaw = u.searchParams.get('slide');
        if (!p) {
          res.statusCode = 400;
          res.end('missing path');
          return;
        }
        const abs = safeHtmlPath(p);
        const slide = slideRaw ? Number.parseInt(slideRaw, 10) : undefined;
        if (slideRaw && (!Number.isFinite(slide) || (slide ?? 0) < 1)) {
          res.statusCode = 400;
          res.end('invalid slide');
          return;
        }
        const buffer = await captureHtmlPdf(abs, repoRoot, { slide });
        const name = path.basename(abs, '.html');
        const suffix = slide ? `-slide-${String(slide).padStart(3, '0')}` : '';
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}${suffix}.pdf"`);
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
