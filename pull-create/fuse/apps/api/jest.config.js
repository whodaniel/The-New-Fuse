/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true,
      },
    ],
  },
  // Transform ESM packages that Jest cannot handle natively
  transformIgnorePatterns: ['node_modules/(?!(uuid|nanoid|@the-new-fuse)/)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@the-new-fuse/a2a-core/(.*)$': '<rootDir>/../../packages/a2a-core/src/$1',
    '^@the-new-fuse/database/(.*)$': '<rootDir>/../../packages/database/src/$1',
    '^@the-new-fuse/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', 'tsconfig-paths/register'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts'],
  globals: {
    TextEncoder: require('util').TextEncoder,
    TextDecoder: require('util').TextDecoder,
  },
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePaths: ['<rootDir>', '<rootDir>/../../packages'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
