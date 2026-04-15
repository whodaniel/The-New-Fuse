module.exports = {
  extends: ['../eslint-config-custom'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
