import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/integration/test-setup.ts'],
    includeSource: ['src/**/*.{js,ts}'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000, // 30 seconds for setup/teardown
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/integration/test-setup.ts',
      ],
    },
    // Separate integration tests from unit tests
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // Run integration tests separately
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Run integration tests in single thread for stability
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
//# sourceMappingURL=vitest.config.js.map
