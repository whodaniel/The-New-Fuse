/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'node',
  
  // Optimized transform configuration for pnpm workspaces
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
      useESM: false,
      diagnostics: {
        warnOnly: true,
        ignoreCodes: ['TS2571', 'TS151', 'TS2339']
      }
    }]
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Optimized test timeout for different environments
  testTimeout: process.env.CI ? 60000 : 30000,
  
  // Enhanced reporters for better feedback
  reporters: process.env.CI 
    ? [
        'default',
        ['jest-junit', {
          outputDirectory: '<rootDir>/../../test-results',
          outputName: 'junit.xml',
          classNameTemplate: '{classname}',
          titleTemplate: '{title}'
        }]
      ]
    : ['default'],
  
  // Enhanced test matching patterns
  testMatch: [
    '**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)',
    '**/tests/**/*.(spec|test).(ts|tsx|js|jsx)'
  ],
  
  // Optimized module name mapping for pnpm workspaces
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
    '^@tnf/(.*)$': '<rootDir>/../$1/src',
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/../../test/mocks/fileMock.cjs'
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
  // Performance optimizations
  maxWorkers: process.env.CI ? 1 : '50%',
  workerIdleMemoryLimit: '256MB',
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/index.{js,ts}'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  
  // Cache configuration
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Transform ignore patterns optimized for pnpm
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse|@tnf)/|lodash-es|@modelcontextprotocol)'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/lib/',
    '/build/',
    '/.pnpm/',
    '/coverage/'
  ],
  
  verbose: process.env.JEST_VERBOSE === 'true',
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  
  // Error handling
  errorOnDeprecated: false,
  bail: process.env.CI ? 1 : 0
};