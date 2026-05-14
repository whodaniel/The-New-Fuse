const fs = require('fs');
const { globSync } = require('glob');

// Use the production CloudRuntime URL as the new default
const PROD_REDIS_URL =
  'redis://localhost:6379';

const files = globSync('**/*.{ts,tsx,js,cjs,sh,md,json,yml,example,template}', {
  ignore: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '.turbo/**',
    'packages/*/dist/**',
    'apps/*/dist/**',
  ],
});

let count = 0;
for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('redis://localhost:6379')) {
      content = content.replace(/redis:\/\/localhost:6379/g, PROD_REDIS_URL);
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
      count++;
    }
  } catch (err) {
    // Ignore files that can't be read/written
  }
}

console.log(`Replaced in ${count} files.`);
