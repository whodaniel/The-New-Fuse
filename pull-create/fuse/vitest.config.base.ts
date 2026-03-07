/**
 * Base Vitest Configuration for The New Fuse Monorepo
 *
 * This configuration is designed to be extended by individual packages.
 * Vitest is recommended for frontend/React packages and modern ESM packages.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Global test settings
    globals: true,

    // Default environment (override in specific packages)
    environment: 'node',

    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      '.turbo',
      '**/*.d.ts',
      '**/*.config.ts',
      '**/test-results/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      enabled: false, // Enable with --coverage flag
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.tsx',
        '**/dist/**',
        '**/build/**',
      ],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },

    // Setup files
    setupFiles: [],

    // Reporter configuration
    reporters: ['verbose'],

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Retry failed tests
    retry: 0,

    // Run tests in parallel
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test'),
    },
  },
});
