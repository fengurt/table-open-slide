/**
 * Measure natural block positions (1280×720) and write layouts/{slideId}.json for en + zh.
 * Run from repo root: node apps/kind-viewer/scripts/bootstrap-slide-layouts.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const deckRoot = path.join(repoRoot, 'slides/kind-bp01/kind_presentation');
const layoutsDir = path.join(deckRoot, 'layouts');

function round2(n) {
  return Math.round(n * 100) / 100;
}

function clampBox(box) {
  const w = Math.max(4, Math.min(100, box.w));
  const h = Math.max(4, Math.min(100, box.h));
  const x = Math.max(0, Math.min(100 - w, box.x));
  const y = Math.max(0, Math.min(100 - h, box.y));
  return { x: round2(x), y: round2(y), w: round2(w), h: round2(h) };
}

async function measureBlocks(page) {
  return page.evaluate(() => {
    const slide = document.querySelector('.slide-container');
    if (!slide) return [];
    const sr = slide.getBoundingClientRect();
    const out = [];
    slide.querySelectorAll(':scope > [data-kind-block]').forEach((el) => {
      const r = el.getBoundingClientRect();
      out.push({
        id: el.getAttribute('data-kind-block'),
        label: (el.className || '').split(/\s+/)[0] || 'block',
        x: ((r.left - sr.left) / sr.width) * 100,
        y: ((r.top - sr.top) / sr.height) * 100,
        w: (r.width / sr.width) * 100,
        h: (r.height / sr.height) * 100,
      });
    });
    return out;
  });
}

async function main() {
  execSync('pnpm --filter kind-viewer build', { cwd: repoRoot, stdio: 'inherit' });
  const { resolveSlideHtml } = await import('../dist-server/slideRender.js');

  await fs.mkdir(layoutsDir, { recursive: true });
  const entries = await fs.readdir(deckRoot);
  const slideIds = entries
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  for (const id of slideIds) {
    const rel = `${id}.html`;
    const labels = {};
    const en = {};
    const zh = {};

    for (const lang of ['en', 'zh']) {
      const html = await resolveSlideHtml(deckRoot, rel, lang, { layoutProbe: true });
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForTimeout(400);
      const measured = await measureBlocks(page);
      for (const b of measured) {
        if (!b.id) continue;
        labels[b.id] = b.label;
        const box = clampBox({ x: b.x, y: b.y, w: b.w, h: b.h });
        if (lang === 'en') en[b.id] = box;
        else zh[b.id] = box;
      }
      console.log(`${id} [${lang}]: ${measured.length} blocks`);
    }

    if (Object.keys(en).length === 0 && Object.keys(zh).length === 0) continue;

    const out = {
      version: 1,
      labels,
      en,
      zh,
    };
    await fs.writeFile(
      path.join(layoutsDir, `${id}.json`),
      `${JSON.stringify(out, null, 2)}\n`,
      'utf8',
    );
  }

  await browser.close();
  console.log(`Wrote ${slideIds.length} layout files to ${layoutsDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
