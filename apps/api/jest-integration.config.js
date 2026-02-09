module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup-integration.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
  coverageDirectory: 'coverage/integration',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};