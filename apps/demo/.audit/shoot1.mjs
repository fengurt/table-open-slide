import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [, , deckId, listArg, outDir] = process.argv;
const BASE = process.env.BASE || 'http://localhost:5173';
mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
// Oversized viewport so the fit-to-stage scale caps at 1.0 → canvas renders at native 1920x1080.
const page = await b.newPage({ viewport: { width: 2560, height: 1600 }, deviceScaleFactor: 1 });
for (const p of listArg.split(',')) {
  await page.goto(`${BASE}/s/${deckId}?p=${p}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-inspector-root] [data-osd-canvas]', { timeout: 15000 });
  await page.waitForTimeout(450);
  const canvas = await page.evaluateHandle(() =>
    [...document.querySelectorAll('[data-osd-canvas]')].sort(
      (a, z) => z.getBoundingClientRect().width - a.getBoundingClientRect().width,
    )[0],
  );
  await canvas.asElement().screenshot({ path: `${outDir}/${String(p).padStart(2, '0')}.png` });
  console.log('shot', p);
}
await b.close();
