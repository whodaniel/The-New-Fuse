/* eslint-env node */

module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:node/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'node'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true
      }
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-redeclare': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true
      }
    ],
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off'
  },
  overrides: [
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['.eslintrc.js'],
      rules: {
        'node/no-unpublished-require': 'off',
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-require': 'off'
      }
    }
  ],
  settings: {
    react: {
      version: 'detect'
    }
  }
};