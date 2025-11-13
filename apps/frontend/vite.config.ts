import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isProduction = mode === 'production';
  
  // Smart host detection for HMR
  const getHMRConfig = () => {
    // In development, try to detect the actual host
    if (isDev) {
      const host = env.VITE_HOST || env.HOST || 'localhost';
      const port = parseInt(env.VITE_PORT || env.PORT || '3000');
      
      return {
        host,
        port,
        protocol: 'ws' as const,
      };
    }
    return false; // Disable HMR in production
  };

  return {
    plugins: [
      react({
        include: [/\.jsx?$/, /\.tsx?$/]
      }),
      tsconfigPaths({
        ignoreConfigErrors: true,
        projects: [path.resolve(__dirname, 'tsconfig.json')]
      }),
      // Generate bundle analysis report in production
      isProduction && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
      // Compression plugins for better performance
      isProduction && compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      isProduction && compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@the-new-fuse/core': path.resolve(__dirname, '../../packages/core/src'),
        '@the-new-fuse/types': path.resolve(__dirname, '../../packages/types/src'),
        '@the-new-fuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@the-new-fuse/shared': path.resolve(__dirname, '../../packages/shared/src'),
        '@the-new-fuse/feature-suggestions': path.resolve(__dirname, '../../packages/feature-suggestions/src'),
        '@the-new-fuse/ui-consolidated': path.resolve(__dirname, '../../packages/ui-consolidated/dist'),
        '@the-new-fuse/config': path.resolve(__dirname, '../../config'),
        '@the-new-fuse/a2a-react': path.resolve(__dirname, '../../packages/a2a-react/src'),
        '@the-new-fuse/a2a-core': path.resolve(__dirname, '../../packages/a2a-core/src'),
      }
    },
    define: {
      // Inject environment variables at build time
      __DEPLOYMENT_CONFIG__: JSON.stringify({
        mode,
        isDev,
        isProduction,
        apiUrl: env.VITE_API_URL || '/api',
        wsUrl: env.VITE_WS_URL || '/ws',
        cdnUrl: env.VITE_CDN_URL || '',
        basePath: env.VITE_BASE_PATH || '/',
      }),
    },
    base: env.VITE_BASE_PATH || '/',
    publicDir: 'public',
    optimizeDeps: {
      include: [
        'firebase',
        '@firebase/app',
        '@firebase/auth'
      ],
      exclude: [
        '@firebase/app-types',
        '@firebase/app-compat',
        '@types/d3',
        '@types/file-saver'
      ]
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      target: 'es2020',
      // Performance optimizations
      cssMinify: isProduction,
      // Increase chunk size warning limit to identify heavy bundles
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        // External dependencies that shouldn't be bundled
        external: isDev ? [] : [
          // Firebase is large, handle separately
        ],
        output: {
          // Use hash-based filenames for better caching
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
          manualChunks: {
            // Core React runtime and routing
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT || env.PORT || '3000'),
      strictPort: false,
      hmr: getHMRConfig(),
      proxy: isDev ? {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:3001',
          ws: true,
          changeOrigin: true,
        },
        // Allow Electron file:// webview origins by not relying on Origin header
        // Vite will proxy requests regardless of missing/unknown Origin
      } : undefined,
      // Add CORS headers for development and SPA fallback
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for development
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
          if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
          }
          next();
        });
        
        // SPA fallback - serve index.html for all non-API routes
        server.middlewares.use((req, res, next) => {
          if (req.url && 
              !req.url.startsWith('/api') && 
              !req.url.startsWith('/ws') && 
              !req.url.includes('.') && 
              req.method === 'GET') {
            req.url = '/';
          }
          next();
        });
      },
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PREVIEW_PORT || '4173'),
      strictPort: false,
    },
  };
});
