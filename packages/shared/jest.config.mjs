// @ts-check
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  displayName: 'shared',
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Using jsdom since this package contains UI components
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  transform: {
    '^.+\\.(ts|tsx|mts)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      useESM: true
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mts', 'mjs'],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx|mts|mjs)', '**/?(*.)+(spec|test).(ts|tsx|js|jsx|mts|mjs)'],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
    // Add mappings for CSS and other assets if needed
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse)/)'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};

export default config;
