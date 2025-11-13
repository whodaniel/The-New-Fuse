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

// Fix comprehensive syntax errors
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Fix double quotes in imports and requires
  fixed = fixed.replace(/from\s+''([^']+)''/g, "from '$1'");
  fixed = fixed.replace(/require\(''([^']+)''\)/g, "require('$1')");
  fixed = fixed.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+''([^']+)''/g, "import { $1 } from '$2'");
  
  // Fix triple quotes patterns
  fixed = fixed.replace(/'''([^']+)'/g, "'$1'");
  fixed = fixed.replace(/'([^']+)'''/g, "'$1'");
  fixed = fixed.replace(/'''([^']+)'''/g, "'$1'");
  
  // Fix malformed import paths ending with .js but missing filename
  fixed = fixed.replace(/from\s+'([^']+)\.'js'/g, "from '$1.js'");
  fixed = fixed.replace(/from\s+'([^']+)\.tsx'/g, "from '$1.tsx'");
  fixed = fixed.replace(/from\s+'([^']+)\.ts'/g, "from '$1.ts'");
  
  // Fix event patterns like 'task: '''completed' 
  fixed = fixed.replace(/'([^']+):\s*'''([^']+)'/g, "'$1:$2'");
  
  // Fix status assignments like status = ''pending'
  fixed = fixed.replace(/=\s*''([^']+)'/g, "= '$1'");
  
  // Fix comparison patterns like === ''value'
  fixed = fixed.replace(/(===|!==|==|!=)\s*''([^']+)'/g, "$1 '$2'");
  
  // Fix remaining unterminated strings - look for single quote followed by word then single quote
  fixed = fixed.replace(/'([a-zA-Z_][a-zA-Z0-9_]*)'(\s*[,;}\]\)])/g, "'$1'$2");
  
  // Fix cases where there are extra quotes
  fixed = fixed.replace(/'([^']+)'\s*'/g, "'$1'");
  
  // Fix type declarations and method signatures
  fixed = fixed.replace(/:\s*''([^']+)'/g, ": '$1'");
  
  // Fix array and object literals
  fixed = fixed.replace(/\[\s*''([^']+)'/g, "['$1'");
  fixed = fixed.replace(/\{\s*''([^']+)'/g, "{'$1'");
  
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
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    console.log(`\nProcessing batch ${Math.floor(i/50) + 1}/${Math.ceil(files.length/50)}...`);
    
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
      console.log('\nFirst 20 errors:');
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