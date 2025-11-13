#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix imports ending with .tsx
  const fixedContent = content.replace(
    /from\s+['"]([^'"]+)\.tsx['"]/g,
    (match, importPath) => {
      modified = true;
      return `from '${importPath}'`;
    }
  );
  
  if (modified) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed imports in: ${filePath}`);
  }
  
  return modified;
}

// Main execution
const testingDir = path.join(__dirname, 'packages', 'testing');

if (!fs.existsSync(testingDir)) {
  console.error('Testing package directory not found!');
  process.exit(1);
}

console.log('Fixing import paths in testing package...');

const tsFiles = findTsFiles(testingDir);
let totalFixed = 0;

for (const file of tsFiles) {
  if (fixImportsInFile(file)) {
    totalFixed++;
  }
}

console.log(`\nFixed imports in ${totalFixed} files.`);

// Also check if utils.ts exists alongside utils.tsx
const utilsDir = path.join(testingDir, 'src', 'generators');
const utilsTsPath = path.join(utilsDir, 'utils.ts');
const utilsTsxPath = path.join(utilsDir, 'utils.tsx');

if (fs.existsSync(utilsTsPath) && fs.existsSync(utilsTsxPath)) {
  console.log('\nBoth utils.ts and utils.tsx exist. Checking content...');
  
  const utilsTsContent = fs.readFileSync(utilsTsPath, 'utf8');
  const utilsTsxContent = fs.readFileSync(utilsTsxPath, 'utf8');
  
  if (utilsTsContent.trim() === utilsTsxContent.trim()) {
    console.log('Files are identical. Removing utils.tsx...');
    fs.unlinkSync(utilsTsxPath);
  } else {
    console.log('Files are different. Manual review needed.');
  }
}

console.log('\nImport fixes completed!');