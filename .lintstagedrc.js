module.exports = {
  // TypeScript and JavaScript files - ESLint temporarily disabled due to memory issues
  '*.{ts,tsx,js,jsx}': [
    // TODO: Re-enable ESLint after fixing memory issues
    // 'eslint --fix',
    'prettier --write',
  ],

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
