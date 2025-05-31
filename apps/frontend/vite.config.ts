import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@the-new-fuse/core': path.resolve(__dirname, '../../packages/core/src'),
      '@the-new-fuse/types': path.resolve(__dirname, '../../packages/types/src'),
      '@the-new-fuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@the-new-fuse/feature-suggestions': path.resolve(__dirname, '../../packages/feature-suggestions/src'),
      // Removed '@the-new-fuse/api-client' alias to let Vite resolve to built package
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 3000,
      protocol: 'ws',
    }
  },
});
