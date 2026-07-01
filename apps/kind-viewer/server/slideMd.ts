import fs from 'node:fs/promises';
import path from 'node:path';
import {
  applyBlockEditableToSlideHtml,
  blockFragmentToEditable,
  extractBlockFragment,
} from './slideBlockEdit.js';
import { stripKindBlockAttrs, tagSlideBlocks } from './slideBlockTag.js';
import { applyEditableToHtml, htmlToEditable } from './slideMdEdit.js';
import { type SlideLang, splitLocaleMd } from './slideRender.js';

export function slideIdFromRel(rel: string): string {
  return path.basename(rel, '.html');
}

function mdPathFor(deckRoot: string, rel: string): string {
  const id = slideIdFromRel(rel);
  return path.join(deckRoot, `${id}.md`);
}

function extractSlideContainerInner(html: string): string {
  const open = html.match(/<div class="slide-container"[^>]*>/i);
  if (!open) return '';
  const start = html.indexOf(open[0]) + open[0].length;
  const closeIdx = html.lastIndexOf('</div>');
  const bodyEnd = html.indexOf('</body>');
  const end = bodyEnd > start ? html.lastIndexOf('</motion.div>', bodyEnd) : -1;
  if (end > start) return html.slice(start, end).trim();
  if (closeIdx > start) {
    const slice = html.slice(start);
    const depth = 1;
    let i = 0;
    let d = depth;
    while (i < slice.length && d > 0) {
      const nextOpen = slice.indexOf('<div', i);
      const nextClose = slice.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        d += 1;
        i = nextOpen + 4;
      } else {
        d -= 1;
        if (d === 0) return slice.slice(0, nextClose).trim();
        i = nextClose + 6;
      }
    }
  }
  return html.slice(start, closeIdx > start ? closeIdx : html.length).trim();
}

export function composeLocaleMd(parts: { en: string; zh: string }): string {
  return `<!-- en -->\n${parts.en.trim()}\n\n<!-- zh -->\n${parts.zh.trim()}\n`;
}

export async function readSlideMd(
  deckRoot: string,
  rel: string,
): Promise<{ md: string; relPath: string; fromDisk: boolean }> {
  const relPath = `${slideIdFromRel(rel)}.md`;
  const abs = mdPathFor(deckRoot, rel);
  try {
    const md = await fs.readFile(abs, 'utf8');
    return { md, relPath, fromDisk: true };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }

  const htmlPath = path.join(deckRoot, `${slideIdFromRel(rel)}.html`);
  const html = await fs.readFile(htmlPath, 'utf8');
  const inner = extractSlideContainerInner(html);
  const en = `<div class="slide-container">\n${inner}\n</div>`;
  const md = composeLocaleMd({ en, zh: en });
  return { md, relPath, fromDisk: false };
}

export async function writeSlideMd(deckRoot: string, rel: string, md: string): Promise<void> {
  splitLocaleMd(md);
  const abs = mdPathFor(deckRoot, rel);
  await fs.writeFile(abs, md.endsWith('\n') ? md : `${md}\n`, 'utf8');
}

async function loadLocaleParts(
  deckRoot: string,
  rel: string,
): Promise<{ parts: Record<SlideLang, string>; relPath: string }> {
  const { md, relPath } = await readSlideMd(deckRoot, rel);
  return { parts: splitLocaleMd(md), relPath };
}

export async function readSlideEditable(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
): Promise<{ editable: string; lang: SlideLang; relPath: string }> {
  const { parts, relPath } = await loadLocaleParts(deckRoot, rel);
  const html = parts[lang] || parts.en;
  return { editable: htmlToEditable(html), lang, relPath };
}

export async function writeSlideEditable(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
  editable: string,
): Promise<void> {
  const { parts } = await loadLocaleParts(deckRoot, rel);
  const updated = applyEditableToHtml(parts[lang] || parts.en, editable);
  parts[lang] = updated;
  if (lang === 'en' && !parts.zh?.trim()) parts.zh = updated;
  if (lang === 'zh' && !parts.en?.trim()) parts.en = updated;
  await writeSlideMd(deckRoot, rel, composeLocaleMd(parts));
}

export async function readSlideBlockEditable(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
  blockId: string,
): Promise<{ editable: string; blockId: string; label: string } | null> {
  const { parts } = await loadLocaleParts(deckRoot, rel);
  const html = parts[lang] || parts.en;
  const { html: tagged, labels } = tagSlideBlocks(html);
  const fragment = extractBlockFragment(tagged, blockId);
  if (!fragment) return null;
  return {
    blockId,
    label: labels[blockId] ?? blockId,
    editable: blockFragmentToEditable(fragment),
  };
}

export async function writeSlideBlockEditable(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
  blockId: string,
  editable: string,
): Promise<boolean> {
  const { parts } = await loadLocaleParts(deckRoot, rel);
  const html = parts[lang] || parts.en;
  const { html: tagged } = tagSlideBlocks(html);
  const updated = applyBlockEditableToSlideHtml(tagged, blockId, editable);
  if (!updated) return false;
  parts[lang] = stripKindBlockAttrs(updated);
  await writeSlideMd(deckRoot, rel, composeLocaleMd(parts));
  return true;
}

export async function writeSlideBlockField(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
  blockId: string,
  fieldClass: string,
  plainText: string,
): Promise<boolean> {
  const { parts } = await loadLocaleParts(deckRoot, rel);
  const html = parts[lang] || parts.en;
  const { html: tagged } = tagSlideBlocks(html);
  const { patchBlockFieldInSlideHtml } = await import('./slideBlockEdit.js');
  const updated = patchBlockFieldInSlideHtml(tagged, blockId, fieldClass, plainText);
  if (!updated) return false;
  parts[lang] = stripKindBlockAttrs(updated);
  await writeSlideMd(deckRoot, rel, composeLocaleMd(parts));
  return true;
}
