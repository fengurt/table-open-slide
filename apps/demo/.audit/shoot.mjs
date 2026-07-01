import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [, , deckId, totalArg, outDir] = process.argv;
const total = Number(totalArg);
const BASE = process.env.BASE || 'http://localhost:5173';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
// Oversized viewport so the fit-to-stage scale is generous → canvas renders large & crisp.
// We screenshot the largest [data-osd-canvas] element directly (no transform mutation),
// which yields a clean, complete 16:9 slide free of inspector chrome.
const page = await browser.newPage({
  viewport: { width: 2560, height: 1600 },
  deviceScaleFactor: 1,
});

for (let p = 1; p <= total; p++) {
  await page.goto(`${BASE}/s/${deckId}?p=${p}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-inspector-root] [data-osd-canvas]', { timeout: 15000 });
  await page.waitForTimeout(420);
  const canvas = await page.evaluateHandle(() =>
    [...document.querySelectorAll('[data-osd-canvas]')].sort(
      (a, z) => z.getBoundingClientRect().width - a.getBoundingClientRect().width,
    )[0],
  );
  await canvas
    .asElement()
    .screenshot({ path: `${outDir}/${String(p).padStart(2, '0')}.png` });
  console.log(`shot ${deckId} p${p}`);
}

await browser.close();
