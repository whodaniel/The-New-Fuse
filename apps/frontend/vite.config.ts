import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

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
      react(),
      tsconfigPaths({
        ignoreConfigErrors: true,
        projects: [path.resolve(__dirname, 'tsconfig.json')]
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@the-new-fuse/core': path.resolve(__dirname, '../../packages/core/src'),
        '@the-new-fuse/types': path.resolve(__dirname, '../../packages/types/src'),
        '@the-new-fuse/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@the-new-fuse/feature-suggestions': path.resolve(__dirname, '../../packages/feature-suggestions/src'),
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
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction,
      target: 'es2020',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            // Core React runtime
            vendor: ['react', 'react-dom', 'react-router-dom'],
            
            // UI Libraries (multiple in use - preserve all)
            ui: ['@mui/material', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            
            // Utilities
            utils: ['lodash', 'date-fns', 'axios'],
            
            // Powerful features - separate chunks for efficiency
            workflow: ['reactflow'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            monaco: ['@monaco-editor/react', 'monaco-editor'],
            
            // A2A and MCP protocols
            protocols: ['@the-new-fuse/a2a-react', '@the-new-fuse/a2a-core'],
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
