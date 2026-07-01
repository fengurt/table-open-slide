#!/usr/bin/env node
/** Copy entries to dist/ for MCP clients (stdio: index.js, http: http.js). */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
await fs.mkdir(path.join(root, 'dist'), { recursive: true });
const files = ['index.js', 'http.js', 'server-factory.js'];
for (const f of files) {
  await fs.copyFile(path.join(root, 'src', f), path.join(root, 'dist', f));
}
console.log(`✓ docx-mcp-server → dist/{${files.join(', ')}}`);
