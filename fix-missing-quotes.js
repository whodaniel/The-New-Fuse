#!/usr/bin/env node

const fs = require('fs');
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

// Fix missing closing quotes in import statements
function fixMissingQuotes(content) {
  let fixed = content;
  
  // Fix imports ending with semicolon but missing closing quote
  // Pattern: from 'some-package; -> from 'some-package';
  fixed = fixed.replace(/from\s+'([^']+);/g, "from '$1';");
  fixed = fixed.replace(/from\s+"([^"]+);/g, 'from "$1";');
  
  // Fix require statements missing closing quotes
  fixed = fixed.replace(/require\('([^']+);/g, "require('$1');");
  fixed = fixed.replace(/require\("([^"]+);/g, 'require("$1");');
  
  // Fix import destructuring with missing quotes
  fixed = fixed.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+'([^']+);/g, "import { $1 } from '$2';");
  fixed = fixed.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+"([^"]+);/g, 'import { $1 } from "$2";');
  
  // Fix default imports with missing quotes  
  fixed = fixed.replace(/import\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+from\s+'([^']+);/g, "import $1 from '$2';");
  fixed = fixed.replace(/import\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+from\s+"([^"]+);/g, 'import $1 from "$2";');
  
  return fixed;
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.trim().length < 10) {
      return false;
    }
    
    const fixedContent = fixMissingQuotes(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Fixed quotes: ${filePath}`);
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
    execSync('cd packages/core && npm run build', { stdio: 'pipe' });
    console.log('Build successful!');
  } catch (error) {
    console.log('Build still has errors. Checking error count...');
    
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    console.log(`${errorLines.length} TypeScript errors remaining.`);
    
    if (errorLines.length < 100) {
      console.log('\nRemaining errors:');
      errorLines.slice(0, 20).forEach(line => console.log(line));
    } else {
      console.log('\nFirst 20 errors:');
      errorLines.slice(0, 20).forEach(line => console.log(line));
    }
  }
}

if (require.main === module) {
  main();
}