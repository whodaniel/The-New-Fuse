module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'node --max_old_space_size=12288 ./node_modules/.bin/eslint --fix',
    'prettier --write',
    () => 'tsc --noEmit --pretty',
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
