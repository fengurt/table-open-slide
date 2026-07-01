/** Shared CLI flag parser for docx-master scripts */
export function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') continue;
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = 'true';
      }
    } else {
      rest.push(a);
    }
  }
  return { flags: out, rest };
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}
