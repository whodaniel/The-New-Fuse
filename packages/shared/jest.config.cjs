/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  displayName: 'shared',
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Using jsdom since this package contains UI components
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)', '**/?(*.)+(spec|test).(ts|tsx|js|jsx)'],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
    // Add mappings for CSS and other assets if needed
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@the-new-fuse)/)'
  ],
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts'
  ],
  
  // Updated coverage configuration
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Root directory
  rootDir: '.'
};
