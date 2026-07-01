#!/usr/bin/env node
/** Preview .docx: LibreOffice → PDF → PNG pages */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { parseArgs, repoRoot } from './args.mjs';

function findSoffice() {
  const candidates = [
    process.env.SOFFICE_PATH,
    '/opt/homebrew/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    'soffice',
  ].filter(Boolean);
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  throw new Error('LibreOffice (soffice) not found. Install LibreOffice or set SOFFICE_PATH.');
}

function findPdftoppm() {
  const candidates = ['/opt/homebrew/bin/pdftoppm', 'pdftoppm'];
  for (const c of candidates) {
    const r = spawnSync(c, ['-v'], { encoding: 'utf8' });
    if (r.status === 0 || r.stderr?.includes('pdftoppm')) return c;
  }
  throw new Error('pdftoppm not found. Run: brew install poppler');
}

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const docxPath = flags.docx;
  const pages = flags.pages ? Number.parseInt(flags.pages, 10) : 5;

  if (!docxPath) {
    console.error('Usage: pnpm docx:preview -- --docx out/file.docx [--pages 5]');
    process.exit(1);
  }

  const abs = path.resolve(repoRoot(), docxPath);
  await fs.access(abs);

  const outDir = path.dirname(abs);
  const base = path.basename(abs, '.docx');
  const pdfPath = path.join(outDir, `${base}.pdf`);
  const previewDir = path.join(outDir, `${base}-preview`);

  const soffice = findSoffice();
  execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', outDir, abs], {
    stdio: 'inherit',
  });

  await fs.access(pdfPath);

  await fs.mkdir(previewDir, { recursive: true });
  const pdftoppm = findPdftoppm();
  execFileSync(pdftoppm, ['-png', '-f', '1', '-l', String(pages), pdfPath, path.join(previewDir, 'page')], {
    stdio: 'inherit',
  });

  const pngs = (await fs.readdir(previewDir)).filter((f) => f.endsWith('.png')).sort();
  console.log(`✓ PDF: ${pdfPath}`);
  console.log(`✓ Preview PNGs (${pngs.length}): ${previewDir}/`);
  for (const p of pngs) console.log(`  · ${p}`);
}

main().catch((e) => {
  console.error('✗', e.message ?? e);
  process.exit(1);
});
