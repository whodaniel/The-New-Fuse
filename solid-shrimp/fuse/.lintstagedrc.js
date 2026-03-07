module.exports = {
  // For pre-commit: Skip ESLint entirely, only run Prettier
  // Run full ESLint manually or in CI where there's more memory/time
  '*.{ts,tsx,js,jsx}': ['prettier --write'],

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],

  // YAML files
  '*.{yml,yaml}': ['prettier --write'],

  // CSS and styling files
  '*.{css,scss,less}': ['prettier --write'],

  // Package.json specific handling
  'package.json': ['prettier --write'],
};
