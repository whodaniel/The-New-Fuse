module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'playwright'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/recommended',
    'prettier'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'playwright/no-conditional-in-test': 'warn',
    'playwright/valid-title': 'error',
    'playwright/no-focused-test': 'error',
    'playwright/no-skipped-test': 'warn',
    'playwright/expect-expect': [
      'error',
      {
        'assertFunctionNames': ['expect', 'expectLoaded', 'expectVisible']
      }
    ],
    'playwright/prefer-web-first-assertions': 'warn',
    'playwright/no-force-option': 'warn',
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/require-top-level-describe': 'error'
  },
};