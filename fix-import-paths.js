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

// Fix malformed import paths
function fixImportPaths(content) {
  let fixed = content;
  
  // Fix package imports with quotes in wrong places - @nestjs/'common' -> @nestjs/common
  fixed = fixed.replace(/@([a-zA-Z0-9\-_]+)\/\'([a-zA-Z0-9\-_]+)\'/g, "@$1/$2");
  fixed = fixed.replace(/@([a-zA-Z0-9\-_]+)\/([a-zA-Z0-9\-_]+)\-\'([a-zA-Z0-9\-_]+)\'/g, "@$1/$2-$3");
  
  // Fix imports where quotes are split across dashes - event-'emitter' -> event-emitter
  fixed = fixed.replace(/([a-zA-Z0-9\-_]+)\-\'([a-zA-Z0-9\-_]+)\'/g, "$1-$2");
  
  // Fix relative imports with split quotes - ../some-'path' -> ../some-path
  fixed = fixed.replace(/([\.\/]+[a-zA-Z0-9\-_\/]+)\-\'([a-zA-Z0-9\-_]+)\'/g, "$1-$2");
  
  // Fix any remaining malformed quotes in imports
  fixed = fixed.replace(/from\s+([\'\"]+)([^\'\"]+)\/\'([^\'\"]+)([\'\"]+)/g, "from '$2/$3'");
  fixed = fixed.replace(/import\s*\{([^}]+)\}\s*from\s+([\'\"]+)([^\'\"]+)\/\'([^\'\"]+)([\'\"]+)/g, "import {$1} from '$3/$4'");
  
  return fixed;
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.trim().length < 10) {
      return false;
    }
    
    const fixedContent = fixImportPaths(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Fixed imports: ${filePath}`);
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
    execSync('cd packages/core && pnpm run build', { stdio: 'pipe' });
    console.log('Build successful!');
  } catch (error) {
    console.log('Build still has errors. Checking error count...');
    
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    console.log(`${errorLines.length} TypeScript errors remaining.`);
    
    if (errorLines.length < 50) {
      console.log('\nRemaining errors:');
      errorLines.forEach(line => console.log(line));
    } else {
      console.log('\nFirst 15 errors:');
      errorLines.slice(0, 15).forEach(line => console.log(line));
    }
  }
}

if (require.main === module) {
  main();
}