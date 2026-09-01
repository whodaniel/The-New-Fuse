module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@the-new-fuse/types$': '<rootDir>/../../types/src',
    '^@the-new-fuse/utils$': '<rootDir>/../../utils/src',
    '^@the-new-fuse/infrastructure$': '<rootDir>/../../infrastructure/src',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
