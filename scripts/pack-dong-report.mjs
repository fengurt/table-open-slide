#!/usr/bin/env node
/**
 * Pack dong report HTML for Tencent COS / static host upload.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const src = path.join(repoRoot, 'landing01/dong/dongreport20260525.html');
const outDir = path.join(repoRoot, 'landing01/dong/dist');
const outFile = path.join(outDir, 'dongreport20260525.html');

await fs.mkdir(outDir, { recursive: true });
await fs.copyFile(src, outFile);
const st = await fs.stat(outFile);
console.log(`Packed ${outFile} (${st.size} bytes)`);
