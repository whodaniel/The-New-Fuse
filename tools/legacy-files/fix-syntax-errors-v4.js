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

// Fix remaining syntax errors
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Fix remaining double quotes in imports/requires
  fixed = fixed.replace(/from\s+''([^']+)''/g, "from '$1'");
  fixed = fixed.replace(/require\(''([^']+)''\)/g, "require('$1')");
  
  // Fix malformed event patterns like 'task: 'completed'
  fixed = fixed.replace(/'([^']+):\s*'([^']+)'/g, "'$1:$2'");
  
  // Fix patterns like this.emit('task: 'added', ...)
  fixed = fixed.replace(/this\.emit\(\s*'([^']+):\s*'([^']+)'/g, "this.emit('$1:$2'");
  fixed = fixed.replace(/this\.once\(\s*'([^']+):\s*'([^']+)'/g, "this.once('$1:$2'");
  
  // Fix any remaining triple quote patterns
  fixed = fixed.replace(/'''([^']*)/g, "'$1");
  fixed = fixed.replace(/([^']*)'''/g, "$1'");
  
  // Fix patterns where quotes are split across words
  fixed = fixed.replace(/'([^']*)\s+'([^']*)/g, "'$1 $2");
  
  // Fix case where there are extra quotes in middle of strings
  fixed = fixed.replace(/'([^']*)'\s*'([^']*)'(?=[\s,;)}])/g, "'$1$2'");
  
  return fixed;
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if file is very small or empty
    if (content.trim().length < 10) {
      return false;
    }
    
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
  
  // Process files in smaller batches
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);
    console.log(`\nProcessing batch ${Math.floor(i/100) + 1}/${Math.ceil(files.length/100)}...`);
    
    for (const file of batch) {
      if (processFile(file)) {
        fixedCount++;
      }
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
    
    // Count remaining errors
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    console.log(`${errorLines.length} TypeScript errors remaining.`);
    
    if (errorLines.length < 50) {
      console.log('\nRemaining errors:');
      errorLines.slice(0, 20).forEach(line => console.log(line));
    } else if (errorLines.length < 200) {
      console.log('\nFirst 10 errors:');
      errorLines.slice(0, 10).forEach(line => console.log(line));
    }
  }
}

if (require.main === module) {
  main();
}