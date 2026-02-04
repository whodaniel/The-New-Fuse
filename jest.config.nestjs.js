/**
 * Jest Configuration for NestJS Applications
 *
 * Extends the base configuration with NestJS-specific settings.
 */

const baseConfig = require('./jest.preset.cjs');

module.exports = {
  ...baseConfig,

  // NestJS uses Node environment
  testEnvironment: 'node',

  // Additional test patterns for NestJS
  testMatch: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],

  // Coverage specific to NestJS
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/test/**',
  ],

  // Module name mapper for NestJS path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@the-new-fuse/(.*)$': '<rootDir>/packages/$1/src',
    '^@tnf/(.*)$': '<rootDir>/packages/$1/src',
  },

  // Setup files for NestJS
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage thresholds for backend services
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
