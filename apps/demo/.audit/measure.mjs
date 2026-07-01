import { chromium } from 'playwright';
const [, , deckId, p] = process.argv;
const BASE = process.env.BASE || 'http://localhost:5173';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/s/${deckId}?p=${p}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-inspector-root] [data-osd-canvas]', { timeout: 15000 });
await page.waitForTimeout(400);
const data = await page.evaluate(() => {
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), right: Math.round(b.right) }; };
  const canvases = [...document.querySelectorAll('[data-osd-canvas]')].map((c, i) => ({ i, sel: c.getAttribute('data-osd-canvas'), ...r(c), transform: getComputedStyle(c).transform }));
  // biggest canvas = main stage
  const main = [...document.querySelectorAll('[data-osd-canvas]')].sort((a,bb)=>bb.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  const grids = main ? [...main.querySelectorAll('div')].filter(d => getComputedStyle(d).display === 'grid').map(g => ({ ...r(g), gtc: getComputedStyle(g).gridTemplateColumns, kids: g.children.length })) : [];
  return { canvases, mainRect: main ? r(main) : null, grids };
});
console.log(JSON.stringify(data, null, 2));
await b.close();
