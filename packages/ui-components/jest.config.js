/** @type {import('jest').Config} */
module.exports = {
  displayName: 'ui-components',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true,
    }],
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/../../test/mocks/fileMock.js',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@the-new-fuse/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)+(spec|test).(ts|tsx|js|jsx)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  rootDir: '.'
};
