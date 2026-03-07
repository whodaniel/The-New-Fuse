/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        ignoreCodes: [151001]
      }
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/backup/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|uuid|@the-new-fuse|@tnf)/)',
  ],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src'
  }
};