
const fs = require('fs');
const path = require('path');

const targetApps = ['apps/api', 'apps/api-gateway', 'apps/backend'];

function getFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Improved patterns to avoid matching comments
  // Matches: from './file.js', import './file.js', import('./file.js')
  const patterns = [
    {
      regex: /(from\s+)(['"])([^'"]+)\/index\.js\2/g,
      replace: '$1$2$3$2'
    },
    {
      regex: /(from\s+)(['"])([^'"]+)\.js\2/g,
      replace: '$1$2$3$2'
    },
    {
      regex: /(import\s+)(['"])([^'"]+)\/index\.js\2/g,
      replace: '$1$2$3$2'
    },
    {
      regex: /(import\s+)(['"])([^'"]+)\.js\2/g,
      replace: '$1$2$3$2'
    },
    {
      regex: /(import\()(['"])([^'"]+)\/index\.js\2(\))/g,
      replace: '$1$2$3$2$4'
    },
    {
      regex: /(import\()(['"])([^'"]+)\.js\2(\))/g,
      replace: '$1$2$3$2$4'
    }
  ];

  for (const p of patterns) {
    if (p.regex.test(content)) {
      content = content.replace(p.regex, p.replace);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
  }
}

for (const app of targetApps) {
  const srcDir = path.join(process.cwd(), app, 'src');
  if (fs.existsSync(srcDir)) {
    console.log(`Searching in ${srcDir}...`);
    const files = getFiles(srcDir);
    for (const file of files) {
      processFile(file);
    }
  }
}
