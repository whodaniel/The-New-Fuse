import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/test/e2e/setup.ts',
    '@testing-library/jest-dom'
  ],
  testTimeout: 60000,
  transform: {
    '^.+\.(t|j)sx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      jsx: 'react'
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!pixelmatch|pngjs).+\.js$'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ]
};

export default config;
