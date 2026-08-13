export default [
  {
    ignores: ['**/*.d.ts', 'node_modules/**'],
  },
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
  },
];
