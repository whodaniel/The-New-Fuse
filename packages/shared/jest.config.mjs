// @ts-check
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  displayName: 'shared',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|mts)$': 'ts-jest',
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mts', 'mjs'],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx|mts|mjs)', '**/?(*.)+(spec|test).(ts|tsx|js|jsx|mts|mjs)'],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse)/)'
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

export default config;
