module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/../../packages/mcp-core/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@the-new-fuse/mcp-core/(.*)$': '<rootDir>/../../packages/mcp-core/src/$1',
    '^@the-new-fuse/mcp-core$': '<rootDir>/../../packages/mcp-core/src',
    '^@the-new-fuse/database/(.*)$': '<rootDir>/../../packages/database/src/$1',
    '^@the-new-fuse/database$': '<rootDir>/../../packages/database/src',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [],
};
