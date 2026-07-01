/**
 * docx-master programmatic API — shared by CLI, MCP, and docx-lab GUI.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Packer } from 'docx';

import { loadBrand } from './brand.mjs';
import { documentSetDir, slugFromTitle, writeDocumentSetMeta } from './document-library.mjs';
import * as helpers from './docx-helpers.mjs';
import { markdownToBlocks, metaFromMarkdown } from './md-to-docx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_PARTS = [
  '[Content_Types].xml',
  '_rels/.rels',
  'word/document.xml',
  'word/styles.xml',
];

const XML_PARTS = ['word/document.xml', 'word/styles.xml', '[Content_Types].xml'];

// --- Render reliability knobs (env-tunable) ---
const MAX_CONCURRENT_RENDERS = Math.max(1, Number(process.env.DOCX_BUILD_CONCURRENCY ?? 1) || 1);
const SOFFICE_TIMEOUT_MS = Number(process.env.DOCX_SOFFICE_TIMEOUT_MS ?? 120_000) || 120_000;
const PDFTOPPM_TIMEOUT_MS = Number(process.env.DOCX_PDFTOPPM_TIMEOUT_MS ?? 60_000) || 60_000;

/**
 * Tiny FIFO semaphore so concurrent build requests don't thrash LibreOffice
 * (which is memory-heavy and lock-prone). Slots transfer directly to waiters.
 */
let activeRenders = 0;
/** @type {Array<() => void>} */
const renderQueue = [];
function acquireRenderSlot() {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => renderQueue.push(resolve));
}
function releaseRenderSlot() {
  const next = renderQueue.shift();
  if (next) next();
  else activeRenders -= 1;
}

/** Monorepo root (table-slides01) */
export function repoRoot() {
  return path.resolve(__dirname, '../../..');
}

function resolveRepoPath(p) {
  if (path.isAbsolute(p)) return p;
  return path.join(repoRoot(), p);
}

function findSoffice() {
  const candidates = [
    process.env.SOFFICE_PATH,
    '/opt/homebrew/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    'soffice',
  ].filter(Boolean);
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  throw new Error('LibreOffice (soffice) not found. Install LibreOffice or set SOFFICE_PATH.');
}

function findPdftoppm() {
  const candidates = ['/opt/homebrew/bin/pdftoppm', 'pdftoppm'];
  for (const c of candidates) {
    const r = spawnSync(c, ['-v'], { encoding: 'utf8' });
    if (r.status === 0 || r.stderr?.includes('pdftoppm')) return c;
  }
  throw new Error('pdftoppm not found. Run: brew install poppler');
}

/**
 * Parsed brand tokens for UI theming (preview chrome only).
 * @param {string} brandPath
 */
export async function getBrandTokens(brandPath) {
  const brand = await loadBrand(resolveRepoPath(brandPath));
  return {
    name: brand.name,
    path: brandPath,
    pageSize: brand.pageSize,
    colors: brand.colors,
    fonts: brand.fonts,
    headingSizes: brand.headingSizes,
    bodySize: brand.bodySize,
    headerText: brand.headerText ?? '',
    footerConfidential: brand.footerConfidential ?? '',
    headingRule: brand.headingRule,
  };
}

export async function listBrands() {
  const root = repoRoot();
  const modulesDir = path.join(root, 'modules');
  /** @type {Array<{ id: string, path: string, name: string }>} */
  const brands = [];
  let entries;
  try {
    entries = await fs.readdir(modulesDir, { withFileTypes: true });
  } catch {
    return brands;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const rel = `modules/${e.name}/design.md`;
    try {
      await fs.access(path.join(root, rel));
      brands.push({ id: e.name, path: rel, name: e.name });
    } catch {
      /* no design.md */
    }
  }
  return brands;
}

/**
 * @param {{ markdown: string, brandPath: string, outDir?: string, filename?: string }} opts
 */
export async function generateFromMarkdown({ markdown, brandPath, outDir = 'out', filename }) {
  const brand = await loadBrand(resolveRepoPath(brandPath));
  const meta = metaFromMarkdown(markdown);
  const pageWidth = brand.pageSize === 'letter' ? helpers.LETTER_WIDTH : helpers.A4_WIDTH;
  const margin = brand.marginsDxa ?? { top: 1440, right: 1440, bottom: 1440, left: 1440 };
  const contentWidthDxa = pageWidth - margin.left - margin.right;

  const children = markdownToBlocks(markdown, helpers, brand, contentWidthDxa);
  const { doc: finalDoc } = helpers.buildDocument({
    brand,
    title: meta.title,
    children,
  });

  const outAbs = resolveRepoPath(outDir);
  await fs.mkdir(outAbs, { recursive: true });
  const base = filename ?? meta.filename;
  const docxPath = path.join(outAbs, `${base}.docx`);
  await fs.writeFile(docxPath, await Packer.toBuffer(finalDoc));

  return {
    ok: true,
    title: meta.title,
    filename: base,
    docxPath,
    docxRel: path.relative(repoRoot(), docxPath),
    brandPath,
  };
}

/**
 * @param {string} docxPath absolute or repo-relative
 */
export async function validateDocx(docxPath) {
  const abs = resolveRepoPath(docxPath);
  await fs.access(abs);

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'docx-validate-'));
  try {
    execFileSync('unzip', ['-q', abs, '-d', tmp], { stdio: 'pipe' });
    for (const part of REQUIRED_PARTS) {
      try {
        await fs.access(path.join(tmp, part));
      } catch {
        throw new Error(`Missing required part: ${part}`);
      }
    }
    for (const part of XML_PARTS) {
      execFileSync('xmllint', ['--noout', path.join(tmp, part)], { stdio: 'pipe' });
    }
    return { ok: true, docxPath: abs, docxRel: path.relative(repoRoot(), abs) };
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

/**
 * @param {string} docxPath
 * @param {number} [pages=8]
 */
export async function previewDocx(docxPath, pages = 8) {
  const abs = resolveRepoPath(docxPath);
  await fs.access(abs);

  const outDir = path.dirname(abs);
  const base = path.basename(abs, '.docx');
  const pdfPath = path.join(outDir, `${base}.pdf`);
  const previewDir = path.join(outDir, `${base}-preview`);

  // Per-render isolated LibreOffice profile: avoids the shared ~/.config lock
  // that makes concurrent soffice invocations fail. Recycled in finally.
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'soffice-profile-'));
  const userInstallation = pathToFileURL(profileDir).href;

  await acquireRenderSlot();
  try {
    const soffice = findSoffice();
    execFileSync(
      soffice,
      [
        `-env:UserInstallation=${userInstallation}`,
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        outDir,
        abs,
      ],
      { stdio: 'pipe', timeout: SOFFICE_TIMEOUT_MS, killSignal: 'SIGKILL' },
    );
    await fs.access(pdfPath);

    await fs.mkdir(previewDir, { recursive: true });
    const pdftoppm = findPdftoppm();
    execFileSync(
      pdftoppm,
      ['-png', '-f', '1', '-l', String(pages), pdfPath, path.join(previewDir, 'page')],
      { stdio: 'pipe', timeout: PDFTOPPM_TIMEOUT_MS, killSignal: 'SIGKILL' },
    );
  } finally {
    releaseRenderSlot();
    await fs.rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }

  const pngs = (await fs.readdir(previewDir))
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => ({
      name: f,
      path: path.join(previewDir, f),
      rel: path.relative(repoRoot(), path.join(previewDir, f)),
    }));

  return {
    ok: true,
    pdfPath,
    pdfRel: path.relative(repoRoot(), pdfPath),
    previewDir,
    previewRel: path.relative(repoRoot(), previewDir),
    pages: pngs,
  };
}

/**
 * Full pipeline: generate → validate → preview.
 * @param {{ markdown: string, brandPath: string, outDir?: string, pages?: number, filename?: string, slug?: string, tags?: string[], client?: string, documentSet?: boolean }} opts
 */
export async function buildFromMarkdown(opts) {
  const useSet = opts.documentSet !== false;
  const meta = metaFromMarkdown(opts.markdown);
  let outDir = opts.outDir ?? 'out';

  if (useSet) {
    const slug = opts.slug ?? slugFromTitle(meta.title);
    outDir = path.relative(repoRoot(), documentSetDir(repoRoot(), slug));
  }

  const generated = await generateFromMarkdown({ ...opts, outDir });
  const validated = await validateDocx(generated.docxRel);
  const preview = await previewDocx(generated.docxRel, opts.pages ?? 8);

  let documentMeta;
  if (useSet) {
    documentMeta = await writeDocumentSetMeta(repoRoot(), {
      markdown: opts.markdown,
      brandPath: opts.brandPath,
      slug: opts.slug,
      tags: opts.tags,
      client: opts.client,
      build: { ...generated, preview },
    });
  }

  return { ...generated, validated, preview, documentMeta };
}

/**
 * Read markdown from file then build.
 * @param {{ mdPath: string, brandPath: string, outDir?: string, pages?: number }} opts
 */
export async function buildFromMarkdownFile(opts) {
  const mdAbs = resolveRepoPath(opts.mdPath.startsWith('/') ? opts.mdPath : opts.mdPath);
  const markdown = await fs.readFile(mdAbs, 'utf8');
  return buildFromMarkdown({ ...opts, markdown });
}

/**
 * Raw paste → LLM markdown → full build pipeline.
 * @param {{ raw: string, brandPath: string, hint?: string, locale?: string, outDir?: string, pages?: number }} opts
 */
export async function formatAndBuild(opts) {
  const { formatRawToMarkdown } = await import('./format-markdown.mjs');
  const formatted = await formatRawToMarkdown({
    raw: opts.raw,
    brandPath: opts.brandPath,
    hint: opts.hint,
    locale: opts.locale,
  });
  if (!formatted.ok) {
    return { ok: false, error: formatted.error, format: formatted };
  }
  const built = await buildFromMarkdown({
    markdown: formatted.markdown,
    brandPath: opts.brandPath,
    outDir: opts.outDir ?? 'out',
    pages: opts.pages ?? 12,
  });
  return {
    ...built,
    format: { source: formatted.source, model: formatted.model },
    markdown: formatted.markdown,
  };
}
