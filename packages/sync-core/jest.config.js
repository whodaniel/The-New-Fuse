module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@the-new-fuse/database$': '<rootDir>/../database/src/index.ts',
    '^@the-new-fuse/database/(.*)$': '<rootDir>/../database/src/$1',
    '^@the-new-fuse/core-error-handling$': '<rootDir>/../core-error-handling/src/index.ts',
    '^@the-new-fuse/infrastructure$': '<rootDir>/../infrastructure/src/index.ts',
    '^@the-new-fuse/prompt-templating$': '<rootDir>/../prompt-templating/src/index.ts',
    '^@the-new-fuse/relay-core$': '<rootDir>/../relay-core/src/index.ts',
    '^@the-new-fuse/([^/]+)$': '<rootDir>/../$1/src/index.ts',
  },
  testTimeout: 30000,
  maxWorkers: '50%',
};
