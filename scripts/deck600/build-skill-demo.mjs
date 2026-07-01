#!/usr/bin/env node
/** Build guizang-ppt-skill Atelier showcase (12 slides) */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PREMIUM_CSS } from './constants.mjs';
import { renderSlide } from './guizang-layouts.mjs';
import { getSkillDemoSpec, SKILL_DEMO_MODULES, SKILL_DEMO_PAGES } from './skill-demo-pages.mjs';
import { toSlideSpec } from './to-slide-spec.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const outDir = path.join(repoRoot, 'skills/tableai-guizang-ppt-skill/demo/atelier-showcase');
const templatePath = path.join(repoRoot, 'skills/tableai-guizang-ppt-skill/assets/template-atelier.html');
const TOTAL = SKILL_DEMO_PAGES.length;

async function build() {
  const template = await fs.readFile(templatePath, 'utf8');
  await fs.mkdir(outDir, { recursive: true });

  const parts = [];
  for (let p = 1; p <= TOTAL; p++) {
    const raw = getSkillDemoSpec(p);
    const spec = toSlideSpec(raw);
    const html = renderSlide(spec, spec._meta);
    await fs.writeFile(path.join(outDir, `slide-${String(p).padStart(2, '0')}.html`), `${html}\n`, 'utf8');
    parts.push(html);
  }

  let deckHtml = template.replace(
    '<title>[必填] 替换为 PPT 标题 · Atelier Theme</title>',
    `<title>guizang-ppt-skill · Atelier Showcase · ${TOTAL}p</title>`,
  );
  if (!deckHtml.includes('/* atelier-premium */')) {
    deckHtml = deckHtml.replace('</style>', `${PREMIUM_CSS}\n  /* atelier-premium */\n</style>`);
  }
  deckHtml = deckHtml.replace('<!-- SLIDES_HERE -->', parts.join('\n'));

  await fs.writeFile(path.join(outDir, 'index.html'), deckHtml, 'utf8');

  const manifest = {
    id: 'guizang-atelier-demo',
    title: 'guizang · Atelier Showcase',
    subtitle: 'Style C · 12 layouts',
    description: 'guizang-ppt-skill 深空金主题 · 版式演示',
    slideCount: TOTAL,
    deckPath: 'skills/tableai-guizang-ppt-skill/demo/atelier-showcase/index.html',
    skill: 'skills/tableai-guizang-ppt-skill',
    theme: 'atelier',
    modules: SKILL_DEMO_MODULES.map((m) => ({ ...m, act: 'Demo' })),
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`✓ ${TOTAL} demo slides → ${outDir}`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
