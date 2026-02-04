/** @type {import('jest').Config} */
module.exports = {
  // Use the optimized preset
  preset: '../../tools/config-files/jest.preset.optimized.cjs',

  // Package-specific display name (replace with actual package name)
  displayName: {
    name: 'PACKAGE_NAME',
    color: 'blue',
  },

  // Test environment (override if needed)
  testEnvironment: 'node', // or 'jsdom' for frontend packages

  // Package-specific root directory
  rootDir: '.',

  // Test file patterns specific to this package
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)+(spec|test).(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.(spec|test).(ts|tsx|js|jsx)',
  ],

  // Package-specific module name mapping
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
    '^@tnf/(.*)$': '<rootDir>/../$1/src',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/../../test/mocks/fileMock.cjs',
  },

  // Package-specific setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],

  // Transform configuration optimized for this package
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
        diagnostics: {
          warnOnly: true,
          ignoreCodes: ['TS2571', 'TS151', 'TS2339'],
        },
      },
    ],
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: { node: 'current' },
              modules: 'commonjs',
            },
          ],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // Coverage configuration for this package
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/index.{js,ts}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds (adjust as needed)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Performance settings
  maxWorkers: process.env.CI ? 1 : '50%',
  workerIdleMemoryLimit: '256MB',

  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',

  // Test timeout
  testTimeout: process.env.CI ? 60000 : 30000,

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse|@tnf)/|lodash-es|@modelcontextprotocol)',
  ],

  // Test path ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/', '/build/', '/.pnpm/', '/coverage/'],

  // Global settings
  verbose: process.env.JEST_VERBOSE === 'true',
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,

  // Error handling
  errorOnDeprecated: false,
  bail: process.env.CI ? 1 : 0,
};
