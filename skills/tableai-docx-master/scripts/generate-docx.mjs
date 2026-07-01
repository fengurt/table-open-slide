#!/usr/bin/env node
/** Generate .docx from content spec + brand design.md */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Packer } from 'docx';

import { loadBrand } from '../lib/brand.mjs';
import * as helpers from '../lib/docx-helpers.mjs';
import { parseArgs, repoRoot } from './args.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = repoRoot();

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const specPath = flags.spec;
  const brandPath = flags.brand ?? path.join(root, 'modules/atelier-brand/design.md');
  const outDir = path.resolve(root, flags.out ?? 'out');

  if (!specPath) {
    console.error('Usage: pnpm docx:generate -- --spec <spec.mjs> [--brand design.md] [--out out/]');
    process.exit(1);
  }

  const specAbs = path.resolve(root, specPath);
  const brand = await loadBrand(path.resolve(root, brandPath));
  const specMod = await import(pathToFileURL(specAbs).href);

  if (typeof specMod.build !== 'function') {
    throw new Error(`${specPath} must export build(helpers, brand, contentWidthDxa)`);
  }

  const meta = specMod.meta ?? { title: 'Document', filename: 'document' };
  const pageWidth = brand.pageSize === 'letter' ? helpers.LETTER_WIDTH : helpers.A4_WIDTH;
  const margin = brand.marginsDxa ?? { top: 1440, right: 1440, bottom: 1440, left: 1440 };
  const contentWidthDxa = pageWidth - margin.left - margin.right;
  const children = specMod.build(helpers, brand, contentWidthDxa);
  const { doc: finalDoc } = helpers.buildDocument({
    brand,
    title: meta.title,
    children,
  });

  await fs.mkdir(outDir, { recursive: true });
  const filename = `${meta.filename ?? 'document'}.docx`;
  const outPath = path.join(outDir, filename);
  const buffer = await Packer.toBuffer(finalDoc);
  await fs.writeFile(outPath, buffer);

  console.log(`✓ ${outPath}`);
  console.log(`  brand: ${brandPath}`);
  console.log(`  spec:  ${specPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
