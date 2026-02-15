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
    '@the-new-fuse/a2a-core',
    '@the-new-fuse/api-types',
    '@the-new-fuse/core',
    '@the-new-fuse/database',
    '@the-new-fuse/features',
    '@radix-ui/react-avatar',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-progress',
    '@radix-ui/react-slider',
    '@radix-ui/react-dialog',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-slot',
  ],
  treeshake: true,
  minify: true,
  esbuildOptions(options) {
    options.loader = options.loader || {}; // Ensure loader object exists
    options.loader['.css'] = 'copy'; // Use 'copy' loader for CSS files
  },
});
