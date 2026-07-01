#!/usr/bin/env node
/** Validate .docx OOXML parts with xmllint */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs, repoRoot } from './args.mjs';

const REQUIRED_PARTS = [
  '[Content_Types].xml',
  '_rels/.rels',
  'word/document.xml',
  'word/styles.xml',
];

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const docxPath = flags.docx;

  if (!docxPath) {
    console.error('Usage: pnpm docx:validate -- --docx out/file.docx');
    process.exit(1);
  }

  const abs = path.resolve(repoRoot(), docxPath);
  await fs.access(abs);

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'docx-validate-'));
  try {
    execFileSync('unzip', ['-q', abs, '-d', tmp], { stdio: 'pipe' });

    for (const part of REQUIRED_PARTS) {
      const p = path.join(tmp, part);
      try {
        await fs.access(p);
      } catch {
        throw new Error(`Missing required part: ${part}`);
      }
    }

    const xmlParts = ['word/document.xml', 'word/styles.xml', '[Content_Types].xml'];
    for (const part of xmlParts) {
      const p = path.join(tmp, part);
      execFileSync('xmllint', ['--noout', p], { stdio: 'pipe' });
    }

    console.log(`✓ Valid OOXML: ${abs}`);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('✗', e.message ?? e);
  process.exit(1);
});
