/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: './jest.preset.cjs',
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    'apps/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__mocks__/**',
    '!**/*.stories.{ts,tsx}',
    '!**/test/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  }
};
