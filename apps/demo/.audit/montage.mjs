import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

// args: outfile dir n1,n2,n3...
const [, , outfile, dir, listArg] = process.argv;
const nums = listArg.split(',').map((s) => s.trim());
const cells = nums
  .map((n) => {
    const p = `${dir}/${String(n).padStart(2, '0')}.png`;
    const b64 = readFileSync(p).toString('base64');
    return `<figure><img src="data:image/png;base64,${b64}"/><figcaption>p${n}</figcaption></figure>`;
  })
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#0c0a07;font-family:sans-serif}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:10px}
  figure{margin:0}
  img{width:100%;display:block;border:1px solid #333}
  figcaption{color:#e0a85e;font-size:22px;padding:4px 2px}
</style></head><body><div class="grid">${cells}</div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: 'load' });
await p.waitForTimeout(300);
await p.screenshot({ path: outfile, fullPage: true });
await b.close();
console.log('montage ->', outfile);
