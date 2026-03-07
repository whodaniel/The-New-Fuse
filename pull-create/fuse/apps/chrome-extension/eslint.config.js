import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'dist-v5/**',
      'dist-v6/**',
      'dist-v7/**',
      'node_modules/**',
      'coverage/**',
      '**/*.d.ts',
      'scripts/**',
      'webpack.config.cjs',
      'webpack.v5.config.cjs',
      'webpack.v6.config.cjs',
      'webpack.v7.config.cjs',
      'eslint.config.js',
      'src/_legacy/**',
      'src/v5/**',
    ],
  },
  {
    files: [
      'src/v6/**/*.ts',
      'src/v6/**/*.tsx',
      'src/v6/**/*.js',
      'src/v6/**/*.jsx',
      '*.js',
      '*.cjs',
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        chrome: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'no-case-declarations': 'off', // Temporarily disable to move faster, will fix critical ones
      '@typescript-eslint/no-require-imports': 'off', // Common in Node scripts/native host
    },
  },
];
