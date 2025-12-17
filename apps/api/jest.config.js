/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: true,
      },
    ],
  },
  // Transform ESM packages that Jest cannot handle natively
  transformIgnorePatterns: ['node_modules/(?!(uuid|nanoid|@the-new-fuse)/)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      isolatedModules: true,
      useESM: true,
    },
  },
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Enable ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
