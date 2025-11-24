module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write', () => 'tsc --noEmit --pretty'],

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
