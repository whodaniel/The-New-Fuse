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

// Fix all remaining quote issues
function fixQuoteIssues(content) {
  let fixed = content;
  
  // Fix double quotes in imports
  fixed = fixed.replace(/from\s+''([^']+)''/g, "from '$1'");
  fixed = fixed.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+''([^']+)''/g, "import { $1 } from '$2'");
  
  // Fix missing opening quotes - patterns like: from xyz' or require(xyz')
  fixed = fixed.replace(/from\s+([a-zA-Z0-9@./\-_]+)'/g, "from '$1'");
  fixed = fixed.replace(/require\(([a-zA-Z0-9@./\-_]+)'\)/g, "require('$1')");
  
  // Fix missing opening quotes in generic/type parameters
  fixed = fixed.replace(/Omit<([^,]+),\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*')*>/g, (match, type, ...rest) => {
    // Handle Omit<Type, 'key1' | 'key2'> patterns
    const keys = match.match(/([a-zA-Z_][a-zA-Z0-9_]*)'(?:\s*\|\s*([a-zA-Z_][a-zA-Z0-9_]*)')?/g);
    if (keys) {
      const fixedKeys = keys.map(key => {
        const cleaned = key.replace(/([a-zA-Z_][a-zA-Z0-9_]*)'/, "'$1'");
        return cleaned;
      }).join(' | ');
      return `Omit<${type}, ${fixedKeys}>`;
    }
    return match;
  });
  
  // Fix missing opening quotes in assignments and comparisons
  fixed = fixed.replace(/=\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,;}\]\)])/g, "= '$1'");
  fixed = fixed.replace(/(===|!==|==|!=)\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,;}\]\)])/g, "$1 '$2'");
  
  // Fix missing opening quotes in object properties
  fixed = fixed.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,}])/g, ": '$1'");
  
  // Fix ternary operator patterns
  fixed = fixed.replace(/\?\s*([a-zA-Z_][a-zA-Z0-9_]*)'(\s*:\s*)([a-zA-Z_][a-zA-Z0-9_]*)'(?=\s*[,;}\]\)])/g, "? '$1'$2'$3'");
  
  // Fix template literal and string concatenation issues
  fixed = fixed.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, (match, before, variable, after) => {
    // Make sure template literals are properly formed
    return `\`${before}\${${variable}}${after}\``;
  });
  
  return fixed;
}

// Process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.trim().length < 10) {
      return false;
    }
    
    const fixedContent = fixQuoteIssues(content);
    
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
    execSync('cd packages/core && pnpm run build', { stdio: 'pipe' });
    console.log('Build successful!');
  } catch (error) {
    console.log('Build still has errors. Checking error count...');
    
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    console.log(`${errorLines.length} TypeScript errors remaining.`);
    
    if (errorLines.length < 30) {
      console.log('\nRemaining errors:');
      errorLines.forEach(line => console.log(line));
    } else {
      console.log('\nFirst 10 errors:');
      errorLines.slice(0, 10).forEach(line => console.log(line));
    }
  }
}

if (require.main === module) {
  main();
}