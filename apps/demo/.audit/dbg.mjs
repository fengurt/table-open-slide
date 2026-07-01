import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const url of ['/', '/s/restaurant-profit-breakthrough-day1?p=1']) {
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => ({
    url: location.href,
    title: document.title,
    canvas: document.querySelectorAll('[data-osd-canvas]').length,
    inspCanvas: document.querySelectorAll('[data-inspector-root] [data-osd-canvas]').length,
    inspectorRoot: document.querySelectorAll('[data-inspector-root]').length,
    links: Array.from(document.querySelectorAll('a')).slice(0, 12).map((a) => a.getAttribute('href')),
    bodyStart: document.body.innerText.slice(0, 200),
  }));
  console.log(JSON.stringify(info, null, 2));
}
await b.close();
