/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resolver: '<rootDir>/jest.resolver.cjs',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@the-new-fuse/types$': '<rootDir>/../types/src/index.ts',
    '^@the-new-fuse/relay-core$': '<rootDir>/../relay-core/src/protocol/tnf-envelope.ts',
    '^@the-new-fuse/database$': '<rootDir>/../database/src/index.ts',
    '^@the-new-fuse/infrastructure$': '<rootDir>/../infrastructure/src/index.ts',
    '^@the-new-fuse/agent$': '<rootDir>/../agent/src/index.ts',
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
  },
};
