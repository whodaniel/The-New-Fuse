import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tnfRoot = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..');
const root = path.join(tnfRoot, 'packages');

const dirsToFix = [
  'types',
  'interfaces',
  'validation',
  'handlers',
  'server',
  'client',
  'broker',
  'integrations',
  'monitoring',
  'performance',
  'auth',
  'audit',
  'middleware',
  'errors',
  'utils',
  'services'
];

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  }
}

walk(root, (filePath) => {
  // Skip database package for 'types' because it has both types.ts and types/ folder
  const isDatabase = filePath.includes('/packages/database/');
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const targetDir of dirsToFix) {
    if (isDatabase && targetDir === 'types') continue;

    // Pattern: from './[targetDir].js'
    const relPattern = new RegExp(`from '\\.\\/${targetDir}\\.js'`, 'g');
    if (relPattern.test(content)) {
      const dir = path.dirname(filePath);
      if (fs.existsSync(path.join(dir, targetDir)) && fs.statSync(path.join(dir, targetDir)).isDirectory()) {
        content = content.replace(relPattern, `from './${targetDir}/index.js'`);
        changed = true;
      }
    }

    // Pattern: from '../[targetDir].js'
    const upPattern = new RegExp(`from '\\.\\.\\/${targetDir}\\.js'`, 'g');
    if (upPattern.test(content)) {
      const dir = path.dirname(path.dirname(filePath));
      if (fs.existsSync(path.join(dir, targetDir)) && fs.statSync(path.join(dir, targetDir)).isDirectory()) {
        content = content.replace(upPattern, `from '../${targetDir}/index.js'`);
        changed = true;
      }
    }
  }

  if (changed) {
    console.log(`Fixed: ${filePath}`);
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
