/**
 * Polish kind-bp01 deck HTML spacing only. Does NOT rewrite .md (use fix-md-slide-wrappers for MD).
 * Run: node apps/kind-viewer/scripts/polish-kind-deck.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deckRoot = path.join(__dirname, '../../../slides/kind-bp01/kind_presentation');

/** Slides with hand-tuned layout — HTML polish only, never touch their .md via this script. */
const MD_LOCKED = new Set(['title_slide', 'mission_vision', 'problem_gap']);

function polishHtmlCss(css) {
  let out = css;
  if (!/\.slide-container[^}]*height:\s*720px/is.test(out)) {
    out = out.replace(/(\.slide-container\s*\{)/g, '$1\n        height: 720px;');
  }
  out = out.replace(/padding-top:\s*80px/g, 'padding-top: 44px');
  out = out.replace(/padding-top:\s*60px/g, 'padding-top: 48px');
  out = out.replace(/\.pillar-num\s*\{[^}]*font-size:\s*120px/g, (m) =>
    m.replace('120px', '96px'),
  );
  out = out.replace(/\.main-title\s*\{[^}]*font-size:\s*64px/g, (m) =>
    m.replace('64px', '56px'),
  );
  return out;
}

async function polishHtmlFile(filePath) {
  let html = await fs.readFile(filePath, 'utf8');
  html = html.replace(/<style>([\s\S]*?)<\/style>/i, (_, css) => `<style>${polishHtmlCss(css)}</style>`);
  await fs.writeFile(filePath, html, 'utf8');
}

async function main() {
  const files = (await fs.readdir(deckRoot)).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const id = file.replace(/\.html$/, '');
    await polishHtmlFile(path.join(deckRoot, file));
    console.log('polished html', id, MD_LOCKED.has(id) ? '(md locked)' : '');
  }
  console.log('Done. MD unchanged. Run fix-md-slide-wrappers if zh/en wrappers are duplicated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
