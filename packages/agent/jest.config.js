module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@the-new-fuse/types$': '<rootDir>/../../types/src',
    '^@the-new-fuse/utils$': '<rootDir>/../../utils/src',
    '^@the-new-fuse/infrastructure$': '<rootDir>/../../infrastructure/src',
  },
};
