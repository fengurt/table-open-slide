#!/usr/bin/env node
/**
 * Retention cleanup for generated docx artifacts.
 *
 * Removes document sets under `out/documents/<slug>/` (and stray top-level
 * preview/pdf/docx files in `out/`) older than the retention window. Intended to
 * run on a timer inside the container or host cron.
 *
 * Usage:
 *   node scripts/cleanup-out.mjs                 # uses DOCX_RETENTION_DAYS or 14
 *   node scripts/cleanup-out.mjs --days 7        # override window
 *   node scripts/cleanup-out.mjs --dry-run       # report only, delete nothing
 *
 * Env:
 *   DOCX_RETENTION_DAYS   retention window in days (default 14)
 *   DOCX_OUT_DIR          out dir (default <repo>/out)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const daysArgIdx = args.indexOf('--days');
const days =
  daysArgIdx >= 0 && args[daysArgIdx + 1]
    ? Number(args[daysArgIdx + 1])
    : Number(process.env.DOCX_RETENTION_DAYS ?? 14);

if (!Number.isFinite(days) || days <= 0) {
  console.error(`Invalid retention days: ${days}`);
  process.exit(1);
}

const outDir = process.env.DOCX_OUT_DIR
  ? path.resolve(process.env.DOCX_OUT_DIR)
  : path.join(repoRoot, 'out');
const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

async function newestMtime(target) {
  const st = await fs.stat(target);
  if (!st.isDirectory()) return st.mtimeMs;
  let newest = st.mtimeMs;
  const entries = await fs.readdir(target, { withFileTypes: true });
  for (const e of entries) {
    const child = path.join(target, e.name);
    try {
      newest = Math.max(newest, await newestMtime(child));
    } catch {
      /* skip unreadable */
    }
  }
  return newest;
}

async function sweep(dir, label) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return { removed: 0, kept: 0 };
  }
  let removed = 0;
  let kept = 0;
  for (const e of entries) {
    const target = path.join(dir, e.name);
    let mtime;
    try {
      mtime = await newestMtime(target);
    } catch {
      continue;
    }
    if (mtime < cutoff) {
      const ageDays = ((Date.now() - mtime) / 86_400_000).toFixed(1);
      if (dryRun) {
        console.log(`[dry-run] would remove ${label}/${e.name} (age ${ageDays}d)`);
      } else {
        await fs.rm(target, { recursive: true, force: true });
        console.log(`removed ${label}/${e.name} (age ${ageDays}d)`);
      }
      removed += 1;
    } else {
      kept += 1;
    }
  }
  return { removed, kept };
}

async function main() {
  console.log(
    `cleanup-out: window=${days}d cutoff=${new Date(cutoff).toISOString()} out=${outDir}${dryRun ? ' (dry-run)' : ''}`,
  );
  const documents = await sweep(path.join(outDir, 'documents'), 'documents');
  console.log(`done: removed=${documents.removed} kept=${documents.kept}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
