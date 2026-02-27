import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: true,
    target: 'node18',
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    splitting: true,
    target: 'node18',
  },
]);
