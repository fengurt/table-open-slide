#!/usr/bin/env node
/** Generate .docx from Markdown + brand design.md */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Packer } from 'docx';

import { loadBrand } from '../lib/brand.mjs';
import * as helpers from '../lib/docx-helpers.mjs';
import { markdownToBlocks, metaFromMarkdown } from '../lib/md-to-docx.mjs';
import { parseArgs, repoRoot } from './args.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const mdPath = flags.md;
  const brandPath = flags.brand ?? path.join(repoRoot(), 'modules/kind-brand/design.md');
  const outDir = path.resolve(repoRoot(), flags.out ?? 'out');

  if (!mdPath) {
    console.error('Usage: pnpm docx:from-md -- --md <file.md> [--brand design.md] [--out out/]');
    process.exit(1);
  }

  const mdAbs = path.resolve(mdPath.startsWith('/') ? mdPath : path.join(repoRoot(), mdPath));
  const raw = await fs.readFile(mdAbs, 'utf8');
  const brand = await loadBrand(path.resolve(repoRoot(), brandPath));
  const meta = metaFromMarkdown(raw);

  const pageWidth = brand.pageSize === 'letter' ? helpers.LETTER_WIDTH : helpers.A4_WIDTH;
  const margin = brand.marginsDxa ?? { top: 1440, right: 1440, bottom: 1440, left: 1440 };
  const contentWidthDxa = pageWidth - margin.left - margin.right;

  const children = markdownToBlocks(raw, helpers, brand, contentWidthDxa);
  const { doc: finalDoc } = helpers.buildDocument({
    brand,
    title: meta.title,
    children,
  });

  await fs.mkdir(outDir, { recursive: true });
  const filename = `${meta.filename}.docx`;
  const outPath = path.join(outDir, filename);
  await fs.writeFile(outPath, await Packer.toBuffer(finalDoc));

  console.log(`✓ ${outPath}`);
  console.log(`  brand: ${brandPath}`);
  console.log(`  md:    ${mdAbs}`);
  console.log(`  pages: (run pnpm docx:preview -- --docx ${path.relative(repoRoot(), outPath)})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
