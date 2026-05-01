import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        react: path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    preview: {
      host: true,
      allowedHosts: [
        'poker.ai-arcade.xyz',
      ],
    },
  };
});
