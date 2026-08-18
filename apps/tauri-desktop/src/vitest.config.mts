import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
  },
  resolve: {
    alias: {
      react: 'node_modules/react/dist/react.cjs',
      'react-dom/test-utils': 'node_modules/react-dom/test-utils.js',
    },
  },
});
