#!/usr/bin/env node
/**
 * Capture PNG screenshots of logical sections from a static HTML file (Playwright).
 *
 * Defaults: mobile-width viewport (390px), 2× DPR, outputs next to the HTML unless --out is set.
 *
 * Usage:
 *   pnpm exec playwright install chromium   # once per machine
 *   pnpm export-html-sections -- --html landing01/boss-new-abacus-ai-survival.html
 *   node scripts/export-html-sections.mjs --html landing01/page.html --width 430
 *
 * Options:
 *   --html <path>      Required. HTML file (relative to cwd or absolute).
 *   --config <path>    Section spec JSON. If omitted, looks for <basename>-sections.config.json beside the HTML.
 *   --out <dir>        Output directory (default: same folder as --html).
 *   --width <px>       Viewport width (default: 390, typical mobile).
 *   --height <px>      Viewport height (default: 1200; only affects initial window; element shots include full height).
 *   --dpr <n>          deviceScaleFactor (default: 2).
 *   --wait <ms>        Extra wait after load for fonts (default: 800).
 *
 * Config JSON shape:
 *   { "sections": [ { "file": "out.png", "selector": ".hero" }, { "file": "x.png", "union": [".a", ".b"] } ] }
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

function usage() {
  console.error(`Usage: node scripts/export-html-sections.mjs --html <file.html> [options]

Options:
  --config <path>   Sections JSON (default: <html-dir>/<html-basename>-sections.config.json if it exists)
  --out <dir>       Output folder (default: directory of HTML file)
  --width <px>      Viewport width (default: 390)
  --height <px>     Viewport height (default: 1200)
  --dpr <n>         Device pixel ratio (default: 2)
  --wait <ms>       Post-navigation wait (default: 800)
`);
}

/** @param {import('playwright').Page} page */
async function clipUnion(page, selectors) {
  const box = await page.evaluate((sels) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    }
    if (minX === Infinity) return null;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, selectors);
  return box;
}

/** @param {import('playwright').Page} page */
async function shotClip(page, clip, outPath) {
  if (!clip || clip.width < 1 || clip.height < 1) {
    console.warn('skip (empty clip):', outPath);
    return;
  }
  await page.screenshot({
    path: outPath,
    clip: {
      x: Math.max(0, clip.x),
      y: Math.max(0, clip.y),
      width: clip.width,
      height: clip.height,
    },
  });
}

/** @param {import('playwright').Page} page */
async function shotElement(page, selector, outPath) {
  const loc = page.locator(selector).first();
  if ((await loc.count()) === 0) {
    console.warn('missing selector:', selector, '→', outPath);
    return;
  }
  await loc.screenshot({ path: outPath });
}

/** pnpm/npm may inject a lone `--` before forwarded flags; strip it for parseArgs. */
const cliArgs = process.argv.slice(2).filter((t) => t !== '--');

const { values } = parseArgs({
  args: cliArgs,
  options: {
    html: { type: 'string' },
    config: { type: 'string' },
    out: { type: 'string' },
    width: { type: 'string', default: '390' },
    height: { type: 'string', default: '1200' },
    dpr: { type: 'string', default: '2' },
    wait: { type: 'string', default: '800' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: false,
});

if (values.help || !values.html) {
  usage();
  process.exit(values.html ? 0 : 1);
}

const htmlPath = resolve(process.cwd(), values.html);
if (!existsSync(htmlPath) || extname(htmlPath).toLowerCase() !== '.html') {
  console.error('Not found or not .html:', htmlPath);
  process.exit(1);
}

const htmlDir = dirname(htmlPath);
const base = basename(htmlPath, '.html');
const defaultConfigPath = join(htmlDir, `${base}-sections.config.json`);
const configPath = values.config ? resolve(process.cwd(), values.config) : defaultConfigPath;

if (!existsSync(configPath)) {
  console.error(
    'No --config and default config missing:\n  ',
    defaultConfigPath,
    '\nCreate a JSON file with { "sections": [ { "file": "a.png", "selector": ".x" } | { "file": "b.png", "union": [".a",".b"] } ] }',
  );
  process.exit(1);
}

/** @type {{ sections: Array<{ file: string, selector?: string, union?: string[] }> }} */
const spec = JSON.parse(readFileSync(configPath, 'utf8'));
if (!Array.isArray(spec.sections) || spec.sections.length === 0) {
  console.error('Config must include a non-empty "sections" array:', configPath);
  process.exit(1);
}

const outDir = values.out ? resolve(process.cwd(), values.out) : htmlDir;
mkdirSync(outDir, { recursive: true });

const width = Number.parseInt(values.width, 10) || 390;
const height = Number.parseInt(values.height, 10) || 1200;
const dpr = Number.parseFloat(values.dpr) || 2;
const waitMs = Number.parseInt(values.wait, 10) || 800;

const fileUrl = pathToFileURL(htmlPath).href;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: dpr,
});
await page.goto(fileUrl, { waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(waitMs);

for (const sec of spec.sections) {
  const dest = join(outDir, sec.file);
  if (sec.union && Array.isArray(sec.union)) {
    await shotClip(page, await clipUnion(page, sec.union), dest);
  } else if (sec.selector && typeof sec.selector === 'string') {
    await shotElement(page, sec.selector, dest);
  } else {
    console.warn('skip invalid section (need selector or union):', sec);
  }
}

await browser.close();
console.log(
  `Wrote ${spec.sections.length} PNG(s) → ${outDir} (viewport ${width}×${height}, dpr ${dpr})`,
);
