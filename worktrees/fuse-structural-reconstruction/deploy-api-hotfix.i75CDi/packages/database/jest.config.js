/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/drizzle/repositories/**/*.ts',
    '!src/drizzle/repositories/index.ts',
  ],
  coverageThresholds: {
    global: {
      lines: 90,
      branches: 85,
      functions: 100,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  globalTeardown: '<rootDir>/__tests__/teardown.ts',
  testTimeout: 30000, // 30 seconds for integration tests
  verbose: true,
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
};
