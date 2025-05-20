/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: './jest.preset.cjs',
  resolver: './jest.resolver.cjs',
  projects: [
    '<rootDir>/packages/*/jest.config.cjs',
    '<rootDir>/apps/*/jest.config.js'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  globalSetup: '<rootDir>/jest.global-setup.cjs',
  globalTeardown: '<rootDir>/jest.global-teardown.cjs',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      diagnostics: {
        warnOnly: true,
        ignoreCodes: ['TS2571', 'TS151', 'TS2339'],
        exclude: ['**/__tests__/**']
      }
    }],
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.svg$': '<rootDir>/test/transformers/svgTransformer.cjs'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)', '**/?(*.)+(spec|test).(ts|tsx|js|jsx)'],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/packages/$1/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/mocks/fileMock.cjs'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse)/|lodash-es)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.yarn/',
    '/coverage/',
    '/storybook-static/'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
    'jest-runner-eslint/watch-fix'
  ],
  globals: {
    'ts-jest': {
      diagnostics: true,
      isolatedModules: true
    }
  },
  verbose: true,
  clearMocks: true,
  maxWorkers: '50%',
  rootDir: '.'
};
