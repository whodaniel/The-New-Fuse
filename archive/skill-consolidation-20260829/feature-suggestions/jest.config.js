/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  displayName: 'feature-suggestions',
  preset: '../../jest.preset.cjs',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  }
};
