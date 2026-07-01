#!/usr/bin/env node
/**
 * H5 captures: one full-page PNG, then **seamless** vertical tiles (no overlap / no duplicate rows)
 * for social uploads — tiles are cut in **pixel space** from the full-page bitmap.
 *
 * Usage:
 *   pnpm exec playwright install chromium   # once per machine
 *   node scripts/capture-h5-viewport-slices.mjs --html landing01/page.html --out landing01/my-h5-cuts
 *
 *  H5 落地页不含 RSVP 区块（示例）：
 *   node scripts/capture-h5-viewport-slices.mjs --html landing01/20260513-load-page-optimize-layout/index.html --out landing01/20260513-load-page-optimize-layout --hide section.cta
 *
 * Options:
 *   --html <path>     Required. HTML file (cwd-relative or absolute).
 *   --out <dir>       Required. Output folder (created if missing).
 *   --width <px>      Viewport width (default: 390).
 *   --height <px>     Tile height in CSS px (default: 844). Last tile may be shorter.
 *   --dpr <n>         deviceScaleFactor (default: 2).
 *   --wait <ms>       Wait after load for fonts/layout (default: 2200).
 *   --hide <sel,...>  Comma-separated CSS selectors to `display:none` before capture (e.g. hide RSVP: `--hide section.cta`).
 */
import { mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import sharp from 'sharp';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const cliArgs = process.argv.slice(2).filter((t) => t !== '--');
const { values } = parseArgs({
  args: cliArgs,
  options: {
    html: { type: 'string' },
    out: { type: 'string' },
    width: { type: 'string', default: '390' },
    height: { type: 'string', default: '844' },
    dpr: { type: 'string', default: '2' },
    wait: { type: 'string', default: '2200' },
    hide: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: false,
});

if (values.help || !values.html || !values.out) {
  console.error(
    `Usage: node scripts/capture-h5-viewport-slices.mjs --html <file.html> --out <dir> [options]`,
  );
  process.exit(values.html && values.out ? 0 : 1);
}

const htmlPath = resolve(process.cwd(), values.html);
if (extname(htmlPath).toLowerCase() !== '.html') {
  console.error('Not an .html file:', htmlPath);
  process.exit(1);
}

const outDir = resolve(process.cwd(), values.out);
const width = Number.parseInt(values.width, 10) || 390;
const tileCssH = Number.parseInt(values.height, 10) || 844;
const dpr = Number.parseFloat(values.dpr) || 2;
const waitMs = Number.parseInt(values.wait, 10) || 2200;

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  if (name.endsWith('.png')) {
    unlinkSync(join(outDir, name));
  }
}

const fileUrl = pathToFileURL(htmlPath).href;
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width, height: tileCssH },
  deviceScaleFactor: dpr,
});

await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  if (!document.fonts) {
    return;
  }
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
});
await sleep(waitMs);

const hideSelectors = (values.hide ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (hideSelectors.length > 0) {
  const css = `${hideSelectors.join(',')}{display:none!important}`;
  await page.addStyleTag({ content: css });
  await sleep(120);
}

async function readScrollHeight() {
  return page.evaluate(() =>
    Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
      document.documentElement.offsetHeight,
      document.body?.offsetHeight ?? 0,
    ),
  );
}

async function settleLayout() {
  const h0 = await readScrollHeight();
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await sleep(350);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(250);
  const h1 = await readScrollHeight();
  return Math.max(h0, h1);
}

await settleLayout();
await sleep(200);

const fullPath = join(outDir, '00-full-page.png');
await page.screenshot({
  path: fullPath,
  fullPage: true,
  animations: 'disabled',
});

await browser.close();

const fullBuf = await sharp(fullPath).toBuffer();
const meta = await sharp(fullBuf).metadata();
const imgW = meta.width ?? 0;
const imgH = meta.height ?? 0;
if (imgW < 1 || imgH < 1) {
  console.error('Full-page image has invalid dimensions:', imgW, imgH);
  process.exit(1);
}

const stepPx = Math.max(1, Math.round(tileCssH * dpr));
let topPx = 0;
let i = 1;
const maxTiles = 200;
while (topPx < imgH && i <= maxTiles) {
  const sliceH = Math.min(stepPx, imgH - topPx);
  await sharp(fullBuf)
    .extract({ left: 0, top: topPx, width: imgW, height: sliceH })
    .png()
    .toFile(join(outDir, `tile-${String(i).padStart(2, '0')}.png`));
  topPx += sliceH;
  i += 1;
}

const tileCount = i - 1;
const hideNote = hideSelectors.length ? `\n  hidden for capture: ${hideSelectors.join(', ')}` : '';
console.log(
  `H5 capture → ${outDir}\n  full-page: 00-full-page.png (${imgW}×${imgH}px)\n  seamless tiles: ${tileCount} × width ${imgW}px, step ${stepPx}px (last tile may be shorter)\n  css tile height≈${tileCssH}px  dpr=${dpr}${hideNote}`,
);
