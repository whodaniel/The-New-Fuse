import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files based on the current mode.
  // The third parameter '' loads all variables, not just those prefixed with VITE_.
  const env = loadEnv(mode, process.cwd(), '');

  // Define backend URLs with fallbacks to default development ports.
  const API_URL = env.API_URL || 'http://localhost:3001';
  const BACKEND_URL = env.BACKEND_URL || 'http://localhost:3004';

  return {
    plugins: [react()],
    server: {
      host: 'localhost', // Ensure this is accessible
      port: 3000, // Frontend should run on port 3000 as per documentation
      proxy: {
        // Proxy requests to the main API server (running on port 3001)
        '/api': {
          target: API_URL,
          changeOrigin: true,
        },
        // Proxy requests to the secondary backend service (running on port 3004)
        '/backend-api': {
          target: BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});