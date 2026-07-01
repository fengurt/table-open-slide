import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildTuneCss, injectLabPreview } from '../src/htmlTune.js';
import { matchTemplate } from '../src/templateRegistry.js';

export type ExportVariant = 'original' | 'hd' | 'web';

const VARIANTS: Record<
  ExportVariant,
  { width: number; height: number; dpr: number; format: 'png' | 'jpeg'; quality?: number; compress?: boolean }
> = {
  original: { width: 1280, height: 720, dpr: 2, format: 'png' },
  hd: { width: 1920, height: 1080, dpr: 2, format: 'png', compress: true },
  web: { width: 960, height: 540, dpr: 1, format: 'jpeg', quality: 88 },
};

const SLIDE_SELECTORS = ['.slide', 'article.slide', '.slide-wrap .slide', 'main', 'body'];

export async function captureHtmlPng(
  absHtmlPath: string,
  variant: ExportVariant,
  relPath: string,
  tuneParams?: Record<string, number>,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const spec = VARIANTS[variant] ?? VARIANTS.original;
  let html = await fs.readFile(absHtmlPath, 'utf8');
  const template = matchTemplate(relPath);
  if (template && tuneParams) {
    const css = buildTuneCss(template, tuneParams);
    html = injectLabPreview(html, css, template.components);
  }

  const tmpDir = path.join(path.dirname(absHtmlPath), '.atelier-export-tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpHtml = path.join(tmpDir, `export-${Date.now()}.html`);
  await fs.writeFile(tmpHtml, html, 'utf8');

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: spec.width, height: spec.height },
        deviceScaleFactor: spec.dpr,
      });
      await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(600);

      let selector: string | null = null;
      for (const sel of SLIDE_SELECTORS) {
        if ((await page.locator(sel).count()) > 0) {
          selector = sel;
          break;
        }
      }

      let buffer: Buffer;
      if (selector) {
        buffer = await page.locator(selector).first().screenshot({ type: spec.format === 'jpeg' ? 'jpeg' : 'png' });
      } else {
        buffer = await page.screenshot({ type: spec.format === 'jpeg' ? 'jpeg' : 'png', fullPage: true });
      }

      if (spec.compress && spec.format === 'png') {
        try {
          const sharp = (await import('sharp')).default;
          buffer = await sharp(buffer).png({ compressionLevel: 9, palette: false }).toBuffer();
        } catch {
          /* sharp optional */
        }
      }

      if (spec.format === 'jpeg') {
        try {
          const sharp = (await import('sharp')).default;
          buffer = await sharp(buffer).jpeg({ quality: spec.quality ?? 88, mozjpeg: true }).toBuffer();
        } catch {
          /* keep playwright jpeg if sharp missing */
        }
      }

      const contentType = spec.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      return { buffer, contentType, ext: spec.format === 'jpeg' ? 'jpg' : 'png' };
    } finally {
      await browser.close();
    }
  } finally {
    await fs.unlink(tmpHtml).catch(() => {});
  }
}
