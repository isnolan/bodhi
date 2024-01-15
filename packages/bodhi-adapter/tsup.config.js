import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    outDir: 'dist',
    target: 'node19',
    platform: 'node',
    format: ['esm'],
    splitting: false,
    sourcemap: true,
    minify: false,
    shims: true,
    dts: true,
  },
]);
