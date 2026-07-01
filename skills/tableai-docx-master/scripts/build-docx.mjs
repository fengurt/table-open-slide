#!/usr/bin/env node
/** generate → validate → preview */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { parseArgs, repoRoot } from './args.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = __dirname;

function run(nodeArgs) {
  const r = spawnSync(process.execPath, nodeArgs, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const spec = flags.spec ?? 'skills/tableai-docx-master/examples/deck-spec.example.mjs';
  const brand = flags.brand ?? 'modules/atelier-brand/design.md';
  const out = flags.out ?? 'out';
  const root = repoRoot();

  run([path.join(scriptsDir, 'generate-docx.mjs'), '--spec', spec, '--brand', brand, '--out', out]);

  const specMod = await import(pathToFileURL(path.resolve(root, spec)).href);
  const filename = `${specMod.meta?.filename ?? 'document'}.docx`;
  const docx = path.join(out, filename);

  run([path.join(scriptsDir, 'validate-docx.mjs'), '--docx', docx]);
  run([path.join(scriptsDir, 'preview-docx.mjs'), '--docx', docx, ...(flags.pages ? ['--pages', flags.pages] : [])]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
