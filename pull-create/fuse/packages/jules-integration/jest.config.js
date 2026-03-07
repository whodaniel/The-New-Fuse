/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
  },
};
