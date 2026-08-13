import tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['**/*.js', '**/*.cjs', '**/*.mjs'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: false,
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
