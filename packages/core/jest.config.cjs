/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        ignoreCodes: [151001]
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }]
      ]
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(spec|test).(ts|tsx|js|jsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/backup/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|uuid)/)',
  ],
  moduleNameMapper: {
    '^@the-new-fuse/(.*)$': '<rootDir>/../$1/src'
  }
};