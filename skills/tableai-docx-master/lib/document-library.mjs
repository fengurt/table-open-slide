/**
 * Document sets live under out/documents/<slug>/ with source.md + meta.json + exports.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { metaFromMarkdown } from './md-to-docx.mjs';

/** @param {string} title */
export function slugFromTitle(title) {
  const slug = title
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || 'document';
}

/**
 * @param {string} repoRoot
 * @param {string} slug
 */
export function documentSetDir(repoRoot, slug) {
  return path.join(repoRoot, 'out', 'documents', slug);
}

/**
 * @param {string} repoRoot
 * @param {string} slug
 */
export async function readDocumentMeta(repoRoot, slug) {
  const metaPath = path.join(documentSetDir(repoRoot, slug), 'meta.json');
  const raw = await fs.readFile(metaPath, 'utf8');
  return /** @type {DocumentSetMeta} */ (JSON.parse(raw));
}

/**
 * @typedef {Object} DocumentSetMeta
 * @property {string} slug
 * @property {string} title
 * @property {string} brandPath
 * @property {string} brandId
 * @property {string[]} tags
 * @property {string} [client]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} filename
 * @property {string} docxRel
 * @property {string} [pdfRel]
 * @property {string} [thumbRel]
 * @property {number} [pageCount]
 */

/**
 * @param {string} repoRoot
 * @param {{
 *   markdown: string;
 *   brandPath: string;
 *   slug?: string;
 *   tags?: string[];
 *   client?: string;
 *   build: { title: string; filename: string; docxRel: string; preview?: { pdfRel?: string; pages?: Array<{ rel: string }> } };
 * }} opts
 */
export async function writeDocumentSetMeta(repoRoot, opts) {
  const metaFromMd = metaFromMarkdown(opts.markdown);
  const slug = opts.slug ?? slugFromTitle(metaFromMd.title);
  const setDir = documentSetDir(repoRoot, slug);
  await fs.mkdir(setDir, { recursive: true });

  const sourcePath = path.join(setDir, 'source.md');
  await fs.writeFile(sourcePath, opts.markdown, 'utf8');

  let createdAt = new Date().toISOString();
  const metaPath = path.join(setDir, 'meta.json');
  try {
    const prev = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    if (prev.createdAt) createdAt = prev.createdAt;
  } catch {
    /* first write */
  }

  const brandId = path.basename(path.dirname(opts.brandPath));
  const pdfRel = opts.build.preview?.pdfRel;
  const thumbRel = opts.build.preview?.pages?.[0]?.rel;
  const pageCount = opts.build.preview?.pages?.length;

  /** @type {DocumentSetMeta} */
  const meta = {
    slug,
    title: opts.build.title ?? metaFromMd.title,
    brandPath: opts.brandPath,
    brandId,
    tags: opts.tags ?? [],
    client: opts.client,
    createdAt,
    updatedAt: new Date().toISOString(),
    filename: opts.build.filename,
    docxRel: opts.build.docxRel,
    pdfRel,
    thumbRel,
    pageCount,
  };

  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  return meta;
}

/**
 * @param {string} repoRoot
 * @param {{ q?: string; brand?: string }} [filter]
 */
export async function listDocumentSets(repoRoot, filter = {}) {
  const root = path.join(repoRoot, 'out', 'documents');
  /** @type {DocumentSetMeta[]} */
  const sets = [];

  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return sets;
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try {
      const meta = await readDocumentMeta(repoRoot, e.name);
      sets.push(meta);
    } catch {
      /* skip incomplete folders */
    }
  }

  sets.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  const q = filter.q?.trim().toLowerCase();
  const brand = filter.brand?.trim();

  return sets.filter((s) => {
    if (brand && s.brandId !== brand && s.brandPath !== brand) return false;
    if (!q) return true;
    const hay = [s.title, s.client, s.slug, ...(s.tags ?? []), s.brandId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
