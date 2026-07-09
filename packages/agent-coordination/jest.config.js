module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  resolver: '<rootDir>/jest.resolver.cjs',
  moduleNameMapper: {
    '^@the-new-fuse/a2a-core$': '<rootDir>/../a2a-core/src/index.ts',
    '^@the-new-fuse/ap2-protocol$': '<rootDir>/../ap2-protocol/src/index.ts',
    '^@the-new-fuse/core-vector-db$': '<rootDir>/../core-vector-db/src/index.ts',
    '^@the-new-fuse/infrastructure$': '<rootDir>/../infrastructure/src/index.ts',
    '^@the-new-fuse/security$': '<rootDir>/../security/src/index.ts',
    '^@the-new-fuse/utils$': '<rootDir>/../utils/src/index.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.test.json' }],
  },
  globalSetup: '<rootDir>/globalSetup.ts',
  globalTeardown: '<rootDir>/globalTeardown.ts',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
};
