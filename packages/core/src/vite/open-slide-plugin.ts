import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';
import fg from 'fast-glob';
import { loadConfigFromFile, type Plugin } from 'vite';
import type { OpenSlideConfig } from '../config.ts';
import { mimeForFilename } from './files-plugin.ts';
import { resolveLanding01Root } from './landing01-root.ts';

export type { OpenSlideConfig };

export type OpenSlidePluginOptions = {
  userCwd: string;
  config: OpenSlideConfig;
};

const CONFIG_FILE = 'open-slide.config.ts';

const SLIDES_VMOD = 'virtual:open-slide/slides';
const CONFIG_VMOD = 'virtual:open-slide/config';
const FOLDERS_VMOD = 'virtual:open-slide/folders';

type FoldersManifest = {
  folders: unknown[];
  assignments: Record<string, string>;
};

const LANDING01_FILES_MAX = 20_000;
const LANDING01_RAW_MAX_BYTES = 25 * 1024 * 1024;
const LANDING01_UTF8_EXT = /\.(html|htm|css|js|mjs|cjs|jsx|tsx|ts|json|md|txt|xml|svg|yml|yaml)$/i;

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function landingFileWithinRoot(root: string, rel: string): string | null {
  const trimmed = rel.trim();
  if (!trimmed) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }
  const abs = path.resolve(root, decoded);
  const relOut = path.relative(root, abs);
  if (relOut.startsWith('..') || path.isAbsolute(relOut)) return null;
  return abs;
}

async function readFoldersManifest(file: string): Promise<FoldersManifest> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FoldersManifest>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? (parsed.assignments as Record<string, string>)
          : {},
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { folders: [], assignments: {} };
    }
    throw err;
  }
}

function resolved(id: string): string {
  return `\0${id}`;
}

async function findSlides(userCwd: string, slidesDir: string): Promise<string[]> {
  const abs = path.resolve(userCwd, slidesDir);
  if (!existsSync(abs)) return [];
  const hits = await fg('*/index.{tsx,jsx,ts,js}', {
    cwd: abs,
    absolute: true,
    onlyFiles: true,
  });
  return hits.sort();
}

function toId(absFile: string, slidesRoot: string): string {
  const rel = path.relative(slidesRoot, absFile);
  return rel.split(path.sep)[0];
}

function generateSlidesModule(files: string[], slidesRoot: string, isDev: boolean): string {
  const entries = files.map((abs) => {
    const id = toId(abs, slidesRoot);
    const importPath = isDev ? `/@fs${abs}` : abs;
    return { id, importPath };
  });

  const ids = JSON.stringify(entries.map((e) => e.id).sort());
  const cases = entries
    .map((e) => `    case ${JSON.stringify(e.id)}: return import(${JSON.stringify(e.importPath)});`)
    .join('\n');

  return `// virtual:open-slide/slides — generated
export const slideIds = ${ids};

export async function loadSlide(id) {
  switch (id) {
${cases}
    default: throw new Error('Slide not found: ' + id);
  }
}
`;
}

export function openSlidePlugin(opts: OpenSlidePluginOptions): Plugin {
  const { userCwd, config } = opts;
  const slidesDir = config.slidesDir ?? 'slides';
  const slidesRoot = path.resolve(userCwd, slidesDir);
  const landing01Root = resolveLanding01Root(userCwd);
  const foldersManifestPath = path.join(slidesRoot, '.folders.json');

  let isDev = false;

  return {
    name: 'open-slide',
    config(_c, env) {
      isDev = env.command === 'serve';
      return {
        server: { fs: { allow: [userCwd] } },
      };
    },
    resolveId(id) {
      if (id === SLIDES_VMOD) return resolved(SLIDES_VMOD);
      if (id === CONFIG_VMOD) return resolved(CONFIG_VMOD);
      if (id === FOLDERS_VMOD) return resolved(FOLDERS_VMOD);
      return null;
    },
    async load(id) {
      if (id === resolved(SLIDES_VMOD)) {
        const files = await findSlides(userCwd, slidesDir);
        return generateSlidesModule(files, slidesRoot, isDev);
      }
      if (id === resolved(CONFIG_VMOD)) {
        const userBuild = config.build ?? {};
        const buildResolved = isDev
          ? { showSlideBrowser: true, showSlideUi: true, allowHtmlDownload: true }
          : {
              showSlideBrowser: userBuild.showSlideBrowser ?? true,
              showSlideUi: userBuild.showSlideUi ?? true,
              allowHtmlDownload: userBuild.allowHtmlDownload ?? true,
            };
        const resolvedConfig = { ...config, build: buildResolved };
        return `export default ${JSON.stringify(resolvedConfig)};\n`;
      }
      if (id === resolved(FOLDERS_VMOD)) {
        const manifest = await readFoldersManifest(foldersManifestPath);
        return `export default ${JSON.stringify(manifest)};\n`;
      }
      return null;
    },
    configureServer(server) {
      if (landing01Root) {
        server.watcher.add(landing01Root);
        let landTimer: ReturnType<typeof setTimeout> | null = null;
        const pingLanding01 = () => {
          if (landTimer) clearTimeout(landTimer);
          landTimer = setTimeout(() => {
            landTimer = null;
            server.ws.send({ type: 'custom', event: 'open-slide:landing01-changed' });
          }, 120);
        };
        const underLanding = (p: string) =>
          p === landing01Root || p.startsWith(`${landing01Root}${path.sep}`);
        for (const ev of ['add', 'change', 'unlink'] as const) {
          server.watcher.on(ev, (p: string) => {
            if (underLanding(p)) pingLanding01();
          });
        }

        server.middlewares.use(async (req, res, next) => {
          const rawUrl = req.url ?? '';
          if (!rawUrl.startsWith('/api/landing01')) {
            next();
            return;
          }
          if ((req.method ?? 'GET') !== 'GET') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }
          const url = new URL(rawUrl, 'http://local');
          try {
            if (url.pathname === '/api/landing01-files') {
              const relPaths = await fg('**/*', {
                cwd: landing01Root,
                onlyFiles: true,
                dot: true,
                followSymbolicLinks: false,
              });
              relPaths.sort((a, b) => a.localeCompare(b));
              const truncated = relPaths.length > LANDING01_FILES_MAX;
              const slice = truncated ? relPaths.slice(0, LANDING01_FILES_MAX) : relPaths;
              const chunkSize = 256;
              const files: { rel: string; size: number; mtimeMs: number }[] = [];
              for (let i = 0; i < slice.length; i += chunkSize) {
                const chunk = slice.slice(i, i + chunkSize);
                const part = await Promise.all(
                  chunk.map(async (rel) => {
                    const abs = path.join(landing01Root, rel);
                    const st = await fs.stat(abs);
                    return { rel, size: st.size, mtimeMs: st.mtimeMs };
                  }),
                );
                files.push(...part);
              }
              sendJson(res, 200, {
                root: landing01Root,
                count: relPaths.length,
                truncated,
                files,
              });
              return;
            }
            if (url.pathname === '/api/landing01-raw') {
              const rel = url.searchParams.get('path');
              if (!rel) {
                sendJson(res, 400, { error: 'missing path query' });
                return;
              }
              const abs = landingFileWithinRoot(landing01Root, rel);
              if (!abs) {
                sendJson(res, 400, { error: 'invalid path' });
                return;
              }
              let st: import('node:fs').Stats;
              try {
                st = await fs.stat(abs);
              } catch (e) {
                if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
                  sendJson(res, 404, { error: 'not found' });
                  return;
                }
                throw e;
              }
              if (!st.isFile()) {
                sendJson(res, 400, { error: 'not a file' });
                return;
              }
              if (st.size > LANDING01_RAW_MAX_BYTES) {
                sendJson(res, 413, { error: 'file too large' });
                return;
              }
              const base = path.basename(abs);
              const mime = mimeForFilename(base);
              if (LANDING01_UTF8_EXT.test(base)) {
                const text = await fs.readFile(abs, 'utf8');
                res.statusCode = 200;
                res.setHeader('Content-Type', mime);
                res.end(text);
                return;
              }
              const buf = await fs.readFile(abs);
              res.statusCode = 200;
              res.setHeader('Content-Type', mime);
              res.setHeader('Content-Length', String(buf.length));
              res.end(buf);
              return;
            }
          } catch (e) {
            sendJson(res, 500, { error: String((e as Error)?.message ?? e) });
            return;
          }
          next();
        });
      }

      const isSlideEntry = (p: string) => {
        const rel = path.relative(slidesRoot, p);
        if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
        const parts = rel.split(path.sep);
        if (parts.length !== 2) return false;
        return /^index\.(tsx|jsx|ts|js)$/.test(parts[1]);
      };

      let reloadTimer: ReturnType<typeof setTimeout> | null = null;
      const reload = () => {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          reloadTimer = null;
          const mod = server.moduleGraph.getModuleById(resolved(SLIDES_VMOD));
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }, 150);
      };
      server.watcher.add(path.join(slidesRoot, '*/index.{tsx,jsx,ts,js}'));
      server.watcher.on('add', (p) => {
        if (isSlideEntry(p)) reload();
      });
      server.watcher.on('unlink', (p) => {
        if (isSlideEntry(p)) reload();
      });

      let foldersTimer: ReturnType<typeof setTimeout> | null = null;
      const invalidateFolders = () => {
        if (foldersTimer) clearTimeout(foldersTimer);
        foldersTimer = setTimeout(() => {
          foldersTimer = null;
          const mod = server.moduleGraph.getModuleById(resolved(FOLDERS_VMOD));
          if (mod) server.moduleGraph.invalidateModule(mod);
        }, 100);
      };
      server.watcher.add(foldersManifestPath);
      server.watcher.on('change', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
      server.watcher.on('add', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
      server.watcher.on('unlink', (p) => {
        if (p === foldersManifestPath) invalidateFolders();
      });
    },
  };
}

export async function loadUserConfig(userCwd: string): Promise<OpenSlideConfig> {
  const file = path.join(userCwd, CONFIG_FILE);
  if (!existsSync(file)) return {};
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    file,
    userCwd,
    'silent',
  );
  return (loaded?.config ?? {}) as OpenSlideConfig;
}
