import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Bundle chalk because v5 is ESM-only and we need CJS compatibility
  noExternal: ['chalk'],
  target: 'node18',
});
