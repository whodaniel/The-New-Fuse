#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files in the core package
function findTSFiles() {
  try {
    const output = execSync('find packages/core/src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding TypeScript files:', error);
    return [];
  }
}

// Fix common syntax errors
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Fix missing quotes around string literals (common pattern from the errors)
  // Pattern: key: value' -> key: 'value'
  fixed = fixed.replace(/(\w+):\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=,|\s*})/g, '$1: \'$2\'');
  
  // Pattern: key: value', -> key: 'value',
  fixed = fixed.replace(/(\w+):\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=,)/g, '$1: \'$2\'');
  
  // Fix decorator method signatures like @Get(): -> @Get()
  fixed = fixed.replace(/@(\w+)\(\):\s*(\w+)\s*\{/g, '@$1()\n  $2(): ');
  
  // Fix import statements with missing quotes
  fixed = fixed.replace(/from\s+([a-zA-Z0-9@./\-_]+)';/g, "from '$1';");
  fixed = fixed.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+([a-zA-Z0-9@./\-_]+)';/g, "import { $1 } from '$2';");
  
  // Fix object property assignments with missing quotes
  fixed = fixed.replace(/(\w+):\s*([a-zA-Z][a-zA-Z0-9_]*)',/g, '$1: \'$2\',');
  
  // Fix array elements with missing quotes
  fixed = fixed.replace(/\[\s*([a-zA-Z][a-zA-Z0-9_]*)',/g, '[\'$1\',');
  
  return fixed;
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fixedContent = fixSyntaxErrors(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('Finding TypeScript files...');
  const files = findTSFiles();
  console.log(`Found ${files.length} TypeScript files`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\nProcessed ${files.length} files`);
  console.log(`Fixed ${fixedCount} files`);
  
  // Try to compile after fixes
  console.log('\nTrying to compile...');
  try {
    execSync('cd packages/core && npm run build', { stdio: 'inherit' });
    console.log('Build successful!');
  } catch (error) {
    console.log('Build still has errors. Manual fixes may be needed.');
  }
}

if (require.main === module) {
  main();
}