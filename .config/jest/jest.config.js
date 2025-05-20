/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  projects: [
    '<rootDir>/../../packages/*/jest.config.js'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__mocks__/**'
  ],
  coverageDirectory: '<rootDir>/../../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.yarn/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/../typescript/tsconfig.base.json'
    }]
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts'
  ],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@agent/(.*)$': '<rootDir>/../../packages/agent/src/$1',
    '^@backend/(.*)$': '<rootDir>/../../packages/backend/src/$1'
  }
};

module.exports = config;
