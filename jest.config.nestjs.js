/**
 * Jest Configuration for NestJS Applications
 *
 * Extends the base configuration with NestJS-specific settings.
 */

const baseConfig = require('./jest.config.base');

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
  },

  // Setup files for NestJS
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Coverage thresholds for backend services
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
