import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SLIDE_RE = /<section\b[\s\S]*?<\/section>/gi;

function repoFileUrl(repoRoot: string, encodedPath: string): string {
  const decoded = decodeURIComponent(encodedPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.resolve(repoRoot, normalized);
  if (!abs.startsWith(repoRoot)) {
    throw new Error('asset path outside repo');
  }
  return pathToFileURL(abs).href;
}

function inlineRepoAssets(html: string, repoRoot: string): string {
  return html
    .replace(/url\((['"]?)\/api\/asset\?path=([^'")]+)\1\)/g, (_match, quote, encoded) => {
      const q = quote || "'";
      return `url(${q}${repoFileUrl(repoRoot, encoded)}${q})`;
    })
    .replace(/(src|href)=(['"])\/api\/asset\?path=([^'"]+)\2/g, (_match, attr, quote, encoded) => {
      return `${attr}=${quote}${repoFileUrl(repoRoot, encoded)}${quote}`;
    });
}

function selectSlides(html: string, slide?: number): string {
  if (!slide) return html;
  const slides = [...html.matchAll(SLIDE_RE)].map((m) => m[0]);
  const selected = slides[slide - 1];
  if (!selected) {
    throw new Error(`slide ${slide} not found`);
  }
  return html
    .replace(SLIDE_RE, () => '')
    .replace(/<div id="deck">\s*/i, `<div id="deck">\n${selected}\n`);
}

function injectPdfCss(html: string): string {
  const css = `
<style id="atelier-pdf-export">
  @page { size: 16in 9in; margin: 0; }
  html, body { width: 100%; height: 100%; margin: 0; background: #050b13; }
  body { overflow: visible !important; }
  #deck {
    position: static !important;
    inset: auto !important;
    display: block !important;
    width: 100vw !important;
    height: auto !important;
    transform: none !important;
    transition: none !important;
  }
  #deck > .slide {
    position: relative !important;
    display: flex !important;
    flex: none !important;
    width: 100vw !important;
    height: 100vh !important;
    break-after: page;
    page-break-after: always;
    content-visibility: visible !important;
  }
  #deck > .slide:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  #nav, #hint, #overview, canvas.bg { display: none !important; }
</style>`;
  return html.replace(/<\/head>/i, `${css}\n</head>`);
}

export async function captureHtmlPdf(
  absHtmlPath: string,
  repoRoot: string,
  options: { slide?: number } = {},
): Promise<Buffer> {
  let html = await fs.readFile(absHtmlPath, 'utf8');
  html = selectSlides(html, options.slide);
  html = inlineRepoAssets(html, repoRoot);
  html = injectPdfCss(html);

  const tmpDir = path.join(path.dirname(absHtmlPath), '.atelier-export-tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpHtml = path.join(tmpDir, `export-pdf-${Date.now()}.html`);
  await fs.writeFile(tmpHtml, html, 'utf8');

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 1600, height: 900 },
        deviceScaleFactor: 1,
      });
      await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(300);
      return await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        width: '16in',
        height: '9in',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } finally {
      await browser.close();
    }
  } finally {
    await fs.unlink(tmpHtml).catch(() => {});
  }
}
