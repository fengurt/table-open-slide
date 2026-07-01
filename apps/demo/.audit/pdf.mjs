import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';

// args: dir outfile
const [, , dir, outfile] = process.argv;
const files = readdirSync(dir)
  .filter((f) => /^\d+\.png$/.test(f))
  .sort((a, b) => Number(a.replace('.png', '')) - Number(b.replace('.png', '')));

const pages = files
  .map((f) => {
    const b64 = readFileSync(`${dir}/${f}`).toString('base64');
    return `<div class="page"><img src="data:image/png;base64,${b64}"/></div>`;
  })
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  .page{width:1280px;height:720px;overflow:hidden;page-break-after:always;background:#0c0a07}
  .page:last-child{page-break-after:auto}
  img{width:1280px;height:720px;display:block;object-fit:cover}
</style></head><body>${pages}</body></html>`;

const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.pdf({
  path: outfile,
  width: '1280px',
  height: '720px',
  printBackground: true,
  pageRanges: `1-${files.length}`,
});
await b.close();
console.log('pdf ->', outfile, `(${files.length} pages)`);
