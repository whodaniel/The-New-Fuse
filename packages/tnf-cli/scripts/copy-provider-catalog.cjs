const fs = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(packageRoot, '..', '..', 'data', 'providers');
const destinationRoot = path.join(packageRoot, 'dist', 'catalog');
const files = ['catalog.json', 'nvidia-models.json'];

fs.mkdirSync(destinationRoot, { recursive: true });
for (const file of files) {
  const source = path.join(sourceRoot, file);
  if (!fs.existsSync(source)) throw new Error(`Required provider catalog is missing: ${source}`);
  fs.copyFileSync(source, path.join(destinationRoot, file));
}

console.log(`Bundled ${files.length} provider catalog files in dist/catalog`);
