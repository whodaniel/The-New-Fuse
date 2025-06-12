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

// Fix more complex syntax errors
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Fix more missing quote patterns
  // Pattern: value' } -> 'value' }
  fixed = fixed.replace(/([a-zA-Z_][a-zA-Z0-9_]*)'(\s*[},\]])/g, '\'$1\'$2');
  
  // Pattern: value', -> 'value',
  fixed = fixed.replace(/([a-zA-Z_][a-zA-Z0-9_]*)',/g, '\'$1\',');
  
  // Pattern: value' ; -> 'value';
  fixed = fixed.replace(/([a-zA-Z_][a-zA-Z0-9_]*)'(\s*;)/g, '\'$1\'$2');
  
  // Fix unterminated string literals at end of lines
  fixed = fixed.replace(/([a-zA-Z_][a-zA-Z0-9_]*)'(\s*)$/gm, '\'$1\'$2');
  
  // Fix import statements with missing opening quotes
  fixed = fixed.replace(/from\s+([a-zA-Z0-9@./\-_]+)';/g, "from '$1';");
  fixed = fixed.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+([a-zA-Z0-9@./\-_]+)';/g, "import { $1 } from '$2';");
  
  // Fix object property patterns
  fixed = fixed.replace(/(\w+):\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,}])/g, '$1: \'$2\'');
  
  // Fix array patterns
  fixed = fixed.replace(/\[\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,\]])/g, '[\'$1\'');
  
  // Fix template literal issues
  fixed = fixed.replace(/([a-zA-Z_][a-zA-Z0-9_]*)'(\s*`)/g, '\'$1\'$2');
  
  // Fix console.log and similar patterns
  fixed = fixed.replace(/console\.(log|error|warn|info)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,)])/g, 'console.$1(\'$2\'');
  
  // Fix throw new Error patterns
  fixed = fixed.replace(/throw\s+new\s+Error\(\s*([a-zA-Z_][a-zA-Z0-9_\s]*)'(?=\s*\))/g, 'throw new Error(\'$1\'');
  
  // Fix function call patterns
  fixed = fixed.replace(/(\w+)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,)])/g, '$1(\'$2\'');
  
  // Fix comparison patterns
  fixed = fixed.replace(/(===|!==|==|!=)\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,;)}\]])/g, '$1 \'$2\'');
  
  // Fix return statement patterns
  fixed = fixed.replace(/return\s+([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[;}])/g, 'return \'$1\'');
  
  // Fix case statement patterns
  fixed = fixed.replace(/case\s+([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*:)/g, 'case \'$1\'');
  
  // Fix destructuring patterns - be more careful
  fixed = fixed.replace(/\{\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,}])/g, '{ \'$1\'');
  
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
  
  // Process files in smaller batches to avoid overwhelming
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
    
    if (errorLines.length < 100) {
      console.log('\nFirst 20 errors:');
      errorLines.slice(0, 20).forEach(line => console.log(line));
    }
  }
}

if (require.main === module) {
  main();
}