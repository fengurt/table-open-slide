/**
 * Remove duplicate outer <motion.div class="slide-container"> wrappers in bilingual .md files.
 * Run: node apps/kind-viewer/scripts/fix-md-slide-wrappers.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deckRoot = path.join(__dirname, '../../../slides/kind-bp01/kind_presentation');

function unwrapSlideContainerOnce(fragment) {
  const trimmed = fragment.trim();
  const open = trimmed.match(/^<div\s+class="slide-container"[^>]*>/i);
  if (!open) return trimmed;
  const start = open[0].length;
  const slice = trimmed.slice(start);
  let depth = 1;
  let i = 0;
  while (i < slice.length && depth > 0) {
    const nextOpen = slice.indexOf('<div', i);
    const nextClose = slice.indexOf('</div>', i);
    if (nextClose === -1) return trimmed;
    const isDivOpen = nextOpen !== -1 && nextOpen < nextClose;
    if (isDivOpen) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) return slice.slice(0, nextClose).trim();
      i = nextClose + 6;
    }
  }
  return trimmed;
}

function normalizeLocaleBlock(block) {
  let inner = block.trim();
  let prev = '';
  while (inner !== prev) {
    prev = inner;
    inner = unwrapSlideContainerOnce(inner);
  }
  return inner;
}

function rebuildMd(enInner, zhInner) {
  return `<!-- en -->\n<div class="slide-container">\n${enInner}\n</div>\n\n<!-- zh -->\n<div class="slide-container">\n${zhInner}\n</div>\n`;
}

async function main() {
  const files = (await fs.readdir(deckRoot)).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const p = path.join(deckRoot, file);
    const raw = await fs.readFile(p, 'utf8');
    const enMatch = raw.match(/<!--\s*en\s*-->([\s\S]*?)(?=<!--\s*zh\s*-->|$)/i);
    const zhMatch = raw.match(/<!--\s*zh\s*-->([\s\S]*?)$/i);
    if (!enMatch && !zhMatch) continue;
    const enInner = normalizeLocaleBlock(enMatch?.[1] ?? '');
    const zhInner = normalizeLocaleBlock(zhMatch?.[1] ?? enInner);
    const next = rebuildMd(enInner, zhInner);
    if (next !== raw) {
      await fs.writeFile(p, next, 'utf8');
      console.log('fixed', file);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
