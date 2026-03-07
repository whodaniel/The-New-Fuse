/**
 * Vitest Configuration for React Applications
 *
 * Extends the base Vitest configuration with React-specific settings.
 */

import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import baseConfig from './vitest.config.base';

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react(), tsconfigPaths()],

    test: {
      // Use jsdom for React testing
      environment: 'jsdom',

      // Setup files for React
      setupFiles: ['./src/test/setup.ts'],

      // Coverage configuration for React
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/*.stories.tsx',
          '**/dist/**',
          '**/build/**',
          'src/main.tsx',
          'src/App.tsx',
          'src/vite-env.d.ts',
        ],
        thresholds: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },

      // Globals for React Testing Library
      globals: true,
    },
  })
);
