import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv, Plugin } from 'vite';
import compression from 'vite-plugin-compression';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

// Create require for ESM context
const require = createRequire(import.meta.url);

// Plugin to resolve ethers Node.js-only modules to browser-safe local stubs.
function ethersBrowserResolve(): Plugin {
  return {
    name: 'ethers-browser-resolve',
    enforce: 'pre',
    resolveId(source, importer) {
      // Redirect ethers IPC socket provider to a local browser-safe shim.
      if (source === './provider-ipcsocket.js' && importer && importer.includes('ethers')) {
        return path.resolve(__dirname, 'src/stubs/ethers-provider-ipcsocket-browser.js');
      }
      return null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isProduction = mode === 'production';

  // Smart host detection for HMR
  const getHMRConfig = () => {
    // In development, try to detect the actual host
    if (isDev) {
      const host = env.VITE_HOST || env.HOST || 'localhost';
      // HMR should use the same port as the dev server (3000), not a separate port
      const port = parseInt(env.VITE_PORT || env.PORT || '3000');

      return {
        host,
        port,
        protocol: 'ws' as const,
        // Add client configuration to prevent connection errors
        clientPort: port,
      };
    }
    return false; // Disable HMR in production
  };

  return {
    plugins: [
      // Resolve ethers Node.js-only modules to browser versions
      ethersBrowserResolve(),
      react(),
      tsconfigPaths({
        ignoreConfigErrors: true,
        projects: [path.resolve(__dirname, 'tsconfig.json')],
      }),
      // Provide Node.js polyfills for browser (required by ethers.js, @uauth, etc.)
      nodePolyfills({
        include: [
          'buffer',
          'process',
          'stream',
          'util',
          'crypto',
          'http',
          'https',
          'url',
          'net',
          'tls',
          'fs',
          'path',
          'os',
          'dns',
          'http2',
          'child_process',
          'vm',
        ],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Enable protocol imports (node:crypto, node:buffer, etc.)
        protocolImports: true,
      }),
      // Generate bundle analysis report in production
      isProduction &&
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      // Compression plugins for better performance
      isProduction &&
        compression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
      isProduction &&
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
        }),
    ].filter(Boolean),
    resolve: {
      // Force all packages to use the same React instance to prevent
      // "Cannot read properties of null (reading 'useRef')" and createContext errors
      dedupe: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'scheduler',
        '@types/react',
        '@types/react-dom',
      ],
      mainFields: ['module', 'main'],
      conditions: ['import', 'module', 'browser', 'default'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // Note: @the-new-fuse/core is NOT aliased because it contains Node.js-only code
        // @the-new-fuse/utils is aliased to a browser-safe shim
        '@the-new-fuse/utils': path.resolve(__dirname, 'src/stubs/utils-shim.ts'),
        '@the-new-fuse/types': path.resolve(__dirname, '../../packages/types/src'),
        '@the-new-fuse/shared': path.resolve(__dirname, '../../packages/shared/src'),
        '@the-new-fuse/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
        '@the-new-fuse/feature-suggestions': path.resolve(
          __dirname,
          '../../packages/feature-suggestions/src'
        ),
        '@the-new-fuse/ui-consolidated': path.resolve(
          __dirname,
          '../../packages/ui-consolidated/dist'
        ),
        '@the-new-fuse/config': path.resolve(__dirname, '../../config'),
        '@the-new-fuse/a2a-react': path.resolve(__dirname, '../../packages/a2a-react/src'),
        '@the-new-fuse/a2a-core': path.resolve(__dirname, '../../packages/a2a-core/src/types.ts'),
        // Stub Node.js-only modules for browser compatibility
        winston: path.resolve(__dirname, 'src/stubs/winston.ts'),
        'winston-daily-rotate-file': path.resolve(__dirname, 'src/stubs/winston.ts'),
        ioredis: path.resolve(__dirname, 'src/stubs/empty.ts'),
        // Additional Node.js modules that should not be in browser bundles
        'mysql2/promise': path.resolve(__dirname, 'src/stubs/empty.ts'),
        mysql2: path.resolve(__dirname, 'src/stubs/empty.ts'),
        '@nestjs/common': path.resolve(__dirname, 'src/stubs/nestjs-common.ts'),
        '@nestjs/swagger': path.resolve(__dirname, 'src/stubs/nestjs-swagger.ts'),
        'class-validator': path.resolve(__dirname, 'src/stubs/class-validator.ts'),
        // Stub zlib to fix "Cannot read properties of undefined (reading 'Z_SYNC_FLUSH')"
        zlib: path.resolve(__dirname, 'src/stubs/zlib.ts'),
        'node:zlib': path.resolve(__dirname, 'src/stubs/zlib.ts'),
      },
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
      // Fix "process is not defined" error in browser
      'process.env': JSON.stringify({
        NODE_ENV: mode,
        ...env,
      }),
    },
    base: env.VITE_BASE_PATH || '/',
    publicDir: 'public',
    optimizeDeps: {
      include: [
        'framer-motion', // Pre-bundle framer-motion to avoid circular dependency issues
        'react',
        'react-dom',
        'react-router-dom',
        'scheduler', // React's internal scheduler - pre-bundle to ensure proper resolution
        '@emotion/is-prop-valid',
      ],
      exclude: [
        '@types/d3',
        '@types/file-saver',
        // Exclude Node.js-only modules that break browser
        'winston',
        'winston-daily-rotate-file',
        'ioredis',
        'fs',
        'path',
        'os',
        'util',
      ],
      esbuildOptions: {
        target: 'es2020',
        // Ensure proper module resolution for framer-motion
        mainFields: ['module', 'main'],
        conditions: ['import', 'module', 'default'],
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction, // Disable sourcemaps in production for smaller bundles
      minify: isProduction ? 'esbuild' : false,
      target: 'es2020',
      // Performance optimizations
      cssMinify: isProduction,
      cssCodeSplit: true, // Enable CSS code splitting
      // Reduce chunk size warning limit to catch large bundles earlier
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        // Optimize bundle size by eliminating unnecessary code
        treeshake: {
          moduleSideEffects: (id) => {
            // Preserve side effects for framer-motion to prevent initialization errors
            if (id && (id.includes('framer-motion') || id.includes('@motionone'))) {
              return true;
            }
            return false;
          },
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        output: {
          // Use hash-based filenames for better caching
          assetFileNames: (assetInfo) => {
            // Organize assets by type for better caching strategy
            const name = assetInfo.name ?? '';
            const info = name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name].[hash][extname]`;
            } else if (/woff2?|ttf|eot/i.test(ext)) {
              return `assets/fonts/[name].[hash][extname]`;
            }
            return `assets/[name].[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js',
          // Advanced chunk splitting strategy
          // Implement chunk splitting to improve load performance
          manualChunks: (id) => {
            // Core React runtime and routing - loaded on every page
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }

            // Monaco Editor - very large code editor, lazy loaded
            if (
              id.includes('node_modules/monaco-editor/') ||
              id.includes('node_modules/@monaco-editor/')
            ) {
              return 'monaco-editor';
            }

            // D3 - large visualization library
            if (id.includes('node_modules/d3')) {
              return 'd3-vendor';
            }

            // ReactFlow - flow diagram library
            if (id.includes('node_modules/reactflow') || id.includes('node_modules/@reactflow/')) {
              return 'reactflow';
            }

            // Charts - recharts for data visualization
            if (id.includes('node_modules/recharts')) {
              return 'recharts';
            }

            // Three.js / 3D
            if (
              id.includes('node_modules/three') ||
              id.includes('node_modules/@react-three/') ||
              id.includes('node_modules/@react-three/drei') ||
              id.includes('node_modules/@react-three/fiber')
            ) {
              return 'three-vendor';
            }

            // Framer Motion - animation library (isolate completely to prevent circular deps)
            // Bundle it as a single chunk with all its dependencies
            if (id.includes('node_modules/framer-motion')) {
              return 'framer-motion';
            }
            // Keep @motionone separate to avoid mixing with framer-motion
            if (id.includes('node_modules/@motionone/')) {
              return 'framer-motion';
            }

            // UI Component libraries
            if (
              id.includes('node_modules/@radix-ui/') ||
              id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/@heroicons/')
            ) {
              return 'ui-libs';
            }

            // State management - split into separate chunks to avoid conflicts
            if (id.includes('node_modules/zustand')) {
              return 'zustand-vendor';
            }
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'react-query-vendor';
            }

            // Utilities
            if (
              id.includes('node_modules/lodash') ||
              id.includes('node_modules/axios') ||
              id.includes('node_modules/date-fns') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/class-variance-authority')
            ) {
              return 'utils';
            }

            // Note: We don't use a catch-all 'vendor' chunk here because it can become too large.
            // Vite's default splitting will handle the rest.
          },
          // Optimize chunk loading with smart imports
          inlineDynamicImports: false,
          // Better mangling for production
          compact: isProduction,
          // Add source mapping URL only in development
          sourcemapExcludeSources: isProduction,
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT || env.PORT || '3000'),
      strictPort: false,
      hmr: getHMRConfig(),
      // Allow production domain for Railway deployment
      allowedHosts: ['thenewfuse.com', 'www.thenewfuse.com', '.railway.app', 'localhost'],
      proxy: isDev
        ? {
            '/api': {
              target: env.VITE_API_URL || 'http://localhost:3001',
              changeOrigin: true,
              secure: false,
            },
            '/v1': {
              target: env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
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
          }
        : undefined,
      // Add CORS headers for development and SPA fallback
      configureServer: (server: {
        middlewares: { use: (handler: (req: any, res: any, next: () => void) => void) => void };
      }) => {
        server.middlewares.use((req: any, res: any, next: () => void) => {
          res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for development
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With'
          );
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
          if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
          }
          next();
        });

        // SPA fallback - serve index.html for all non-API routes
        server.middlewares.use((req: any, res: any, next: () => void) => {
          if (
            req.url &&
            !req.url.startsWith('/api') &&
            !req.url.startsWith('/ws') &&
            !req.url.includes('.') &&
            req.method === 'GET'
          ) {
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
    ssr: {},
  };
});
