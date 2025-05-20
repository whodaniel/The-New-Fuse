import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  // Add any other necessary tsup options here based on project needs
  // For example, if you have CSS or other assets to bundle:
  // assets: ['src/**/*.css'],
});