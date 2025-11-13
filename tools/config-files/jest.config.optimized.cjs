/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: './jest.preset.cjs',
  resolver: './jest.resolver.cjs',
  
  // Optimized project discovery for pnpm workspaces
  projects: [
    '<rootDir>/packages/*/jest.config.{cjs,js,ts}',
    '<rootDir>/apps/*/jest.config.{cjs,js,ts}',
    '<rootDir>/tools/*/jest.config.{cjs,js,ts}'
  ],
  
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  globalSetup: '<rootDir>/jest.global-setup.cjs',
  globalTeardown: '<rootDir>/jest.global-teardown.cjs',
  
  // Optimized transforms for better performance
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      useESM: false,
      diagnostics: {
        warnOnly: true,
        ignoreCodes: ['TS2571', 'TS151', 'TS2339'],
        exclude: ['**/__tests__/**', '**/node_modules/**']
      }
    }],
    '^.+\\.jsx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { 
          targets: { node: 'current' },
          modules: 'commonjs'
        }],
        '@babel/preset-typescript'
      ]
    }],
    '^.+\\.svg$': '<rootDir>/test/transformers/svgTransformer.cjs'
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Enhanced test matching patterns
  testMatch: [
    '**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)',
    '**/tests/**/*.(spec|test).(ts|tsx|js|jsx)'
  ],
  
  // Optimized module name mapping for pnpm workspaces
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/packages/$1/src',
    '^@tnf/(.*)$': '<rootDir>/packages/$1/src',
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/mocks/fileMock.cjs'
  },
  
  // Optimized transform ignore patterns for pnpm
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse|@tnf)/|lodash-es|@modelcontextprotocol)'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/lib/',
    '/build/',
    '/.pnpm/',
    '/coverage/',
    '/storybook-static/',
    '/playwright-report/',
    '/test-results/'
  ],
  
  // Enhanced watch plugins for better development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
    'jest-runner-eslint/watch-fix'
  ],
  
  // Performance optimizations
  maxWorkers: process.env.CI ? '50%' : '75%',
  workerIdleMemoryLimit: '512MB',
  
  // Coverage configuration optimized for monorepo
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx,js,jsx}',
    'apps/*/src/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/*.stories.{js,ts,tsx}'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Cache configuration for better performance
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Global configuration
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true
      },
      isolatedModules: true
    }
  },
  
  verbose: process.env.JEST_VERBOSE === 'true',
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  
  // Test timeout configuration
  testTimeout: process.env.CI ? 60000 : 30000,
  
  // Reporter configuration for CI/CD
  reporters: process.env.CI 
    ? [
        'default',
        ['jest-junit', {
          outputDirectory: 'test-results',
          outputName: 'junit.xml'
        }]
      ]
    : ['default'],
  
  rootDir: '.',
  
  // Error handling
  errorOnDeprecated: false,
  bail: process.env.CI ? 1 : 0,
  
  // Snapshot configuration
  updateSnapshot: process.env.UPDATE_SNAPSHOTS === 'true'
};