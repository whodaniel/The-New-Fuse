/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testEnvironment: 'node',
  
  transform: {
    '^.+\.[tj]sx?$': ['ts-jest', {
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
  
  testTimeout: process.env.CI ? 60000 : 30000,
  
  reporters: process.env.CI 
    ? [
        'default',
        ['jest-junit', {
          outputDirectory: '<rootDir>/test-results',
          outputName: 'junit.xml',
          classNameTemplate: '{classname}',
          titleTemplate: '{title}'
        }]
      ]
    : ['default'],
  
  testMatch: [
    '**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).(ts|tsx|js|jsx)',
    '**/tests/**/*.(spec|test).(ts|tsx|js|jsx)'
  ],
  
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/packages/$1/src',
    '^@tnf/(.*)$': '<rootDir>/packages/$1/src',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/mocks/fileMock.js'
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/index.{js,ts}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
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
  
  errorOnDeprecated: false,
  bail: process.env.CI ? 1 : 0
};
