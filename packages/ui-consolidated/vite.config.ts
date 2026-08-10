import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UIConsolidated',
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
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
        '@radix-ui/react-slot'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: true,
    emptyOutDir: true,
  }
});
