/**
 * Jest config for the Fuse Connect extension.
 *
 * Without this file `npx jest` ran with stock defaults: no TypeScript transform,
 * so every suite died on `Cannot use import statement outside a module`.
 */
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  // `src/__tests__/setup.ts` is a setup file, not a suite — keep it out of testMatch.
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/_legacy/'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
          target: 'ES2020',
          lib: ['ES2020', 'DOM'],
          esModuleInterop: true,
          allowJs: true,
          strict: false,
          noImplicitAny: false,
          types: ['jest', 'node', 'chrome'],
          isolatedModules: true,
        },
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    // Source uses extensionless-friendly `./foo.js` specifiers that resolve to .ts.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  clearMocks: true,
  // SimpleChatBridge send paths can exceed Jest's 5s default under load.
  testTimeout: 15000,
};
