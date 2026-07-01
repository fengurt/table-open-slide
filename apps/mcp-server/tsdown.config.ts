import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: 'esm',
  target: 'node20',
  platform: 'node',
  clean: true,
  dts: false,
  shims: false,
});
