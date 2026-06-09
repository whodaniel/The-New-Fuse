/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: [
    '<rootDir>/src/shared',
    '<rootDir>/../../packages/workflow-engine/src/sequencer',
  ],
  testMatch: ['**/__tests__/progressive-self-prompter.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.self-prompter.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  coverageProvider: 'v8',
  collectCoverage: false,
  moduleNameMapper: {
    '^@the-new-fuse/workflow-engine/sequencer$':
      '<rootDir>/../../packages/workflow-engine/src/sequencer/ProgressiveDisclosureSequencer.ts',
  },
};
