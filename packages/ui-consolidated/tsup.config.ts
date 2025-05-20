import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: true,
  esbuildOptions(options) {
    options.loader = options.loader || {}; // Ensure loader object exists
    options.loader['.css'] = 'copy'; // Use 'copy' loader for CSS files
  },
});
