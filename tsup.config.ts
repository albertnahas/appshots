import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  splitting: true,
  clean: true,
  target: 'node18',
  banner: ({ format }) => {
    if (format === 'esm') {
      return { js: '' };
    }
    return {};
  },
});
