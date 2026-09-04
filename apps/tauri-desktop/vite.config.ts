import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import compression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';
import { safariMontereyCompatPlugin } from './vite-plugins/safariMontereyCompat';
import { tnfBrowserBridgePlugin } from './vite-plugins/tnfBrowserBridge';
import {
  defaultVisualizationsRoot,
  tnfStaticSurfacesPlugin,
} from './vite-plugins/tnfStaticSurfaces';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isProduction = mode === 'production';

  // Ship-time extras that belong to web deploys, not to the desktop bundle.
  //
  // Tauri loads assets off the local filesystem, so precompressed .gz/.br are never
  // content-negotiated — they added 74 files / ~1.1MB of dead weight to the .app.
  // Worse, vite-plugin-compression@0.5.1 intermittently aborted the whole build with
  // `ENOENT ... .js.gz` on its own output, which failed DMG packaging outright.
  // The visualizer likewise emitted a ~1.5MB bundle-analysis.html into the shipped app.
  //
  // Opt in for web builds that actually serve precompressed assets:
  //   TNF_PRECOMPRESS=1 pnpm build      TNF_BUNDLE_ANALYZE=1 pnpm build
  const precompressAssets = process.env.TNF_PRECOMPRESS === '1';
  const emitBundleAnalysis = process.env.TNF_BUNDLE_ANALYZE === '1';

  // Vite injects `crossorigin` on module/preload tags. Under Tauri's asset /
  // tauri.localhost protocol that triggers a CORS failure so the main module
  // never runs and index.html's splash spinner stays mounted forever.
  const stripModuleCrossOrigin = {
    name: 'tnf-strip-module-crossorigin',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html
        .replace(/<script([^>]*?)\s+crossorigin(?:="[^"]*")?/g, '<script$1')
        .replace(/<link([^>]*?)\s+crossorigin(?:="[^"]*")?/g, '<link$1');
    },
  };

  // Keep in sync with package.json `dev` (`--host 127.0.0.1 --port 1420 --strictPort`).
  // Do NOT default HMR to localhost:3000 — that opens a second WS listener on
  // [::1]:3000 and collides with relay-core (supervisor then sees HTTP 426).
  // strictPort: if 1420 is taken, fail instead of silently binding 1421 (browser-control).
  const defaultDevHost = '127.0.0.1';
  const defaultDevPort = 1420;
  const serverHost = env.VITE_HOST || env.HOST || defaultDevHost;
  const serverPort = parseInt(env.VITE_PORT || env.PORT || String(defaultDevPort), 10);

  // Omit hmr.port so Vite shares the HTTP server socket (CLI --port still wins).
  const getHMRConfig = () => {
    if (!isDev) return false;
    return {
      host: serverHost,
      protocol: 'ws' as const,
    };
  };

  return {
    plugins: [
      react(),
      tnfStaticSurfacesPlugin(),
      tnfBrowserBridgePlugin(),
      safariMontereyCompatPlugin(),
      tsconfigPaths({
        ignoreConfigErrors: true,
        projects: [path.resolve(import.meta.dirname, 'tsconfig.json')],
      }),
      isProduction && stripModuleCrossOrigin,
      // Generate bundle analysis report (opt-in; see TNF_BUNDLE_ANALYZE above)
      isProduction &&
        emitBundleAnalysis &&
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      // Precompression (opt-in; see TNF_PRECOMPRESS above)
      isProduction &&
        precompressAssets &&
        compression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
      isProduction &&
        precompressAssets &&
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        // Ensure single React instance to prevent "Invalid hook call" errors
        react: path.resolve(import.meta.dirname, '../../node_modules/react'),
        'react-dom': path.resolve(import.meta.dirname, '../../node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(
          import.meta.dirname,
          '../../node_modules/react/jsx-runtime'
        ),
        'react/jsx-dev-runtime': path.resolve(
          import.meta.dirname,
          '../../node_modules/react/jsx-dev-runtime'
        ),
        // Note: @the-new-fuse/core is NOT aliased because it contains Node.js-only code
        // @the-new-fuse/utils is aliased to a browser-safe shim
        '@the-new-fuse/utils': path.resolve(import.meta.dirname, 'src/stubs/utils-shim.ts'),
        '@the-new-fuse/types': path.resolve(import.meta.dirname, '../../packages/types/src'),
        '@the-new-fuse/shared': path.resolve(import.meta.dirname, '../../packages/shared/src'),
        // Pin to source barrels/files — package exports point at CJS dist/, which breaks
        // named ESM imports in the Vite browser graph (splash forever).
        '@the-new-fuse/shared/federation': path.resolve(
          import.meta.dirname,
          '../../packages/shared/src/federation/index.ts'
        ),
        '@the-new-fuse/shared/federation/FederationNodeClient': path.resolve(
          import.meta.dirname,
          '../../packages/shared/src/federation/FederationNodeClient.ts'
        ),
        '@the-new-fuse/shared/federation/protocol': path.resolve(
          import.meta.dirname,
          '../../packages/shared/src/federation/protocol.ts'
        ),
        '@the-new-fuse/ui-consolidated': path.resolve(
          import.meta.dirname,
          '../../packages/ui-consolidated/dist'
        ),
        '@the-new-fuse/workflow-builder': path.resolve(
          import.meta.dirname,
          '../../packages/workflow-builder/dist'
        ),
        '@the-new-fuse/config': path.resolve(import.meta.dirname, '../../config'),
        '@the-new-fuse/a2a-react': path.resolve(
          import.meta.dirname,
          '../../packages/a2a-react/src'
        ),
        '@the-new-fuse/a2a-core': path.resolve(import.meta.dirname, '../../packages/a2a-core/src'),
        // Stub Node.js-only modules for browser compatibility
        winston: path.resolve(import.meta.dirname, 'src/stubs/winston.ts'),
        'winston-daily-rotate-file': path.resolve(import.meta.dirname, 'src/stubs/winston.ts'),
        ioredis: path.resolve(import.meta.dirname, 'src/stubs/empty.ts'),
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
        // Relative base is required for packaged Tauri (asset:// / custom protocol).
        // Absolute "/" asset URLs leave the HTML splash mounted forever in the .app/.dmg.
        basePath: env.VITE_BASE_PATH || './',
      }),
      // Fix "process is not defined" error in browser
      'process.env': JSON.stringify({
        NODE_ENV: mode,
        ...env,
      }),
    },
    base: env.VITE_BASE_PATH || './',
    publicDir: 'public',
    optimizeDeps: {
      // firebase/* is optional (peer); do not force-include when not installed —
      // Vite otherwise fails local UI boot with "Failed to resolve dependency".
      include: [
        'framer-motion', // Pre-bundle framer-motion to avoid circular dependency issues
        'react',
        'react-dom',
        'react-router-dom',
      ],
      exclude: [
        'firebase',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        '@firebase/app-types',
        '@firebase/app-compat',
        '@types/d3',
        '@types/file-saver',
        // Keep shared/federation on source aliases — prebundling hits CJS dist.
        '@the-new-fuse/shared',
        '@the-new-fuse/shared/federation',
        '@the-new-fuse/shared/federation/protocol',
        '@the-new-fuse/shared/federation/FederationNodeClient',
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
      minify: isProduction ? 'terser' : false,
      target: 'es2020',
      // Performance optimizations
      cssMinify: isProduction,
      cssCodeSplit: true, // Enable CSS code splitting
      // Reduce chunk size warning limit to catch large bundles earlier
      chunkSizeWarningLimit: 500,
      // Advanced terser options for production
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: false, // Enable console.* calls for debugging
              drop_debugger: true,
              // pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
              passes: 2, // Multiple compression passes for better results
            },
            mangle: {
              safari10: true, // Fix Safari 10+ bugs
            },
            format: {
              comments: false, // Remove all comments
            },
          }
        : undefined,
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, 'index.html'),
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
            const info = assetInfo.name.split('.');
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

            // Firebase - large auth library, separate chunk
            if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
              return 'firebase';
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

            // Supabase auth client
            if (id.includes('node_modules/@supabase/') || id.includes('node_modules/supabase')) {
              return 'supabase-vendor';
            }

            // 3D / WebGL stacks — only loaded by optional pages
            if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) {
              return 'three-vendor';
            }

            // Markdown / syntax highlighting
            if (
              id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/react-syntax-highlighter') ||
              id.includes('node_modules/highlight.js') ||
              id.includes('node_modules/marked') ||
              id.includes('node_modules/rehype-') ||
              id.includes('node_modules/remark-')
            ) {
              return 'markdown-vendor';
            }

            // Terminal emulator
            if (id.includes('node_modules/xterm')) {
              return 'xterm-vendor';
            }

            // Web3 (unused on most routes)
            if (id.includes('node_modules/ethers')) {
              return 'ethers-vendor';
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
            if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/react-redux')) {
              return 'redux-vendor';
            }
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

            // All other node_modules
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
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
      host: serverHost,
      port: serverPort,
      strictPort: true,
      hmr: getHMRConfig(),
      fs: {
        allow: [path.resolve(import.meta.dirname), defaultVisualizationsRoot()],
      },
      // Allow production domain for CloudRuntime deployment
      allowedHosts: ['thenewfuse.com', 'www.thenewfuse.com', '.thenewfuse.com', 'localhost'],
      proxy: isDev
        ? {
            '/api': {
              target: env.VITE_API_URL || 'http://127.0.0.1:3001',
              changeOrigin: true,
              secure: false,
            },
            '/ws': {
              target: env.VITE_WS_URL || 'ws://127.0.0.1:3001',
              ws: true,
              changeOrigin: true,
            },
            // Tauri Vite proxy: do not require Origin (webview / local asset loads)
            // Vite will proxy requests regardless of missing/unknown Origin
          }
        : undefined,
      // Add CORS headers for development and SPA fallback
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for development
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With'
          );
          if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
          }
          next();
        });

        // SPA fallback - serve index.html for all non-API routes
        server.middlewares.use((req, res, next) => {
          if (
            req.url &&
            !req.url.startsWith('/api') &&
            !req.url.startsWith('/ws') &&
            !req.url.startsWith('/__tnf-browser') &&
            !req.url.startsWith('/visualizations') &&
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
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'vite-plugins/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});
