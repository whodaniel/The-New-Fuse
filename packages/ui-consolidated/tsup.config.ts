import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@the-new-fuse/api-client',
    '@the-new-fuse/hooks',
    '@the-new-fuse/types',
    '@the-new-fuse/utils',
  ],
  treeshake: true,
  minify: true,
  esbuildOptions(options) {
    options.loader = options.loader || {}; // Ensure loader object exists
    options.loader['.css'] = 'copy'; // Use 'copy' loader for CSS files
  },
});
