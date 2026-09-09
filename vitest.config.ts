import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/.claude/worktrees/**',
      '**/.tnf/worktrees/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**'
    ],
    include: ['**/*.test.ts', '**/*.spec.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000
  }
})
