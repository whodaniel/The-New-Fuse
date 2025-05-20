// eslint.config.js in packages/ui-components
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  {
    // Apply to all JS, TS, JSX, and TSX files (excluding d.ts)
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['src/**/*.d.ts'], // Explicitly ignore d.ts files
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'], // Point to the package's tsconfig as an array
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing if needed
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly', // Add React global if used
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      // Add react plugin if needed: import reactPlugin from 'eslint-plugin-react';
      // react: reactPlugin,
    },
    rules: {
      // Inherit recommended rules (or specify explicitly)
      ...tsPlugin.configs.recommended.rules,
      // Add React specific rules if needed
      // ...reactPlugin.configs.recommended.rules,

      // Override or add specific rules for this package
      '@typescript-eslint/no-explicit-any': 'off',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off', // Disable rule causing many errors
      // Add other rules as needed
    },
    settings: {
      // Add React version if using React plugin
      // react: {
      //   version: 'detect',
      // },
    },
  },
  {
    // Configuration for Jest test files
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    // Add Jest plugin and rules if needed
    // plugins: { jest: jestPlugin },
    // rules: { ...jestPlugin.configs.recommended.rules },
  },
  {
    // Ignore specific files or directories if necessary
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
];