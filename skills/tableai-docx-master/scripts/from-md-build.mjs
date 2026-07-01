#!/usr/bin/env node
/** md → generate → validate → preview → document set folder */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { parseArgs, repoRoot } from './args.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const md = flags.md;
  const brand = flags.brand ?? 'modules/kind-brand/design.md';
  const root = repoRoot();

  if (!md) {
    console.error(
      'Usage: pnpm docx:from-md:build -- --md <file.md> [--brand design.md] [--slug id] [--client name] [--tag a,b]',
    );
    process.exit(1);
  }

  const mdAbs = path.resolve(md.startsWith('/') ? md : path.join(root, md));
  const pipelineUrl = pathToFileURL(path.join(__dirname, '../lib/pipeline.mjs')).href;
  const { buildFromMarkdown } = await import(pipelineUrl);
  const fs = await import('node:fs/promises');
  const markdown = await fs.readFile(mdAbs, 'utf8');

  const tags = flags.tag ? flags.tag.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

  const result = await buildFromMarkdown({
    markdown,
    brandPath: brand,
    pages: flags.pages ? Number.parseInt(flags.pages, 10) : 24,
    slug: flags.slug,
    client: flags.client,
    tags,
    documentSet: flags['no-set'] ? false : true,
  });

  console.log(`✓ ${result.docxPath}`);
  console.log(`  brand: ${brand}`);
  console.log(`  md:    ${mdAbs}`);
  if (result.documentMeta) {
    console.log(`  set:   out/documents/${result.documentMeta.slug}/`);
  }
  if (result.preview?.pages?.length) {
    console.log(`  preview: ${result.preview.pages.length} PNG(s)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
