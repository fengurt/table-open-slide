#!/usr/bin/env node
/**
 * guizang-ppt-skill · 风格 C Atelier
 * 逐页生成 600 张中文 slide → pages/slide-NNN.html → 组装 deck/index.html
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DECK_TITLE, MODULES, PREMIUM_CSS, TOTAL, VISUAL_STREAMS } from './constants.mjs';
import { renderSlide } from './guizang-layouts.mjs';
import { getPageSpec, initPageSpecs } from './teaching-pages.mjs';
import { toSlideSpec } from './to-slide-spec.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const skillRoot = path.join(repoRoot, 'skills/tableai-guizang-ppt-skill');
const projectDir = path.join(repoRoot, 'slides/projects/2day_FB_Profit2chain');
const templatePath = path.join(skillRoot, 'assets/template-atelier.html');
const pagesDir = path.join(projectDir, 'pages');
const outDeck = path.join(projectDir, 'deck/index.html');
const outManifest = path.join(projectDir, 'manifest.json');

async function buildDeck() {
  // 写入 canonical 600p_slides.md
  await import('./export-md.mjs');
  await initPageSpecs();

  const template = await fs.readFile(templatePath, 'utf8');
  await fs.mkdir(pagesDir, { recursive: true });
  await fs.mkdir(path.dirname(outDeck), { recursive: true });

  const parts = [];
  for (let p = 1; p <= TOTAL; p++) {
    const spec = toSlideSpec(getPageSpec(p));
    const meta = spec._meta;
    const html = renderSlide(spec, meta);
    const fname = `slide-${String(p).padStart(3, '0')}.html`;
    await fs.writeFile(path.join(pagesDir, fname), `${html}\n`, 'utf8');
    parts.push(html);
    if (p % 100 === 0) console.log(`  · ${p}/${TOTAL} slides written`);
  }

  let deckHtml = template.replace(
    '<title>[必填] 替换为 PPT 标题 · Atelier Theme</title>',
    `<title>${DECK_TITLE} · ${TOTAL}p · Atelier</title>`,
  );

  if (!deckHtml.includes('/* atelier-premium */')) {
    deckHtml = deckHtml.replace('</style>', `${PREMIUM_CSS}\n  /* atelier-premium */\n</style>`);
  }

  deckHtml = deckHtml.replace('<!-- SLIDES_HERE -->', parts.join('\n'));

  await fs.writeFile(outDeck, deckHtml, 'utf8');

  const manifest = {
    id: '2day-fb-profit2chain',
    title: DECK_TITLE,
    subtitle: '从活下去到可复制',
    description: 'guizang-ppt-skill Atelier 主题 · 600 页中文互动旅程',
    slideCount: TOTAL,
    deckPath: 'slides/projects/2day_FB_Profit2chain/deck/index.html',
    pagesDir: 'slides/projects/2day_FB_Profit2chain/pages',
    skillTemplate: 'skills/tableai-guizang-ppt-skill/assets/template-atelier.html',
    theme: 'atelier',
    modules: MODULES,
    visualStreams: VISUAL_STREAMS,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(outManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`\n✓ ${TOTAL} slides → ${pagesDir}`);
  console.log(`✓ deck → ${outDeck}`);
  console.log(`✓ manifest → ${outManifest}`);
}

buildDeck().catch((e) => {
  console.error(e);
  process.exit(1);
});
