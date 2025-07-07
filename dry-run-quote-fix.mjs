#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import diff from 'diff';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix quotes in a file
function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Store the original content for comparison
    const originalContent = content;
    
    // Fix common quote corruption patterns
    const fixes = [
      // Fix smart quotes to regular quotes
      /[“”]/g, '"'],
      [/[“”]/g, '"'],
      [/[‘’]/g, "'"],
      
      // Fix import statements with corrupted quotes
      [/import\s+([^'"]*?)['"]([^'"]*?)$/gm, "import $1'$2';"],
      [/from\s+['"]([^'"]*?)$/gm, "from '$1';"],
      
      // Fix export statements
      [/export\s+([^'"]*?)['"]([^'"]*?)$/gm, "export $1'$2';"],
      
      // Fix string literals that are missing closing quotes
      [/=\s*['"]([^'"]*?)$/gm, "= '$1';"],
      [/:\s*['"]([^'"]*?)$/gm, ": '$1'"],
      
      // Fix template literals
      [/`([^`]*?)$/gm, '`$1`'],
      
      // Fix object property quotes
      [/(['"])([^'"]*?)\1\s*:/g, '"$2":'],
      
      // Fix console.log and similar statements
      [/console\.(log|error|warn|info)\s*\(\s*['"]([^'"]*?)$/gm, "console.$1('$2');"],
      
      // Fix throw statements
      [/throw\s+new\s+Error\s*\(\s*['"]([^'"]*?)$/gm, "throw new Error('$1');"],
      
      // Fix return statements with strings
      [/return\s+['"]([^'"]*?)$/gm, "return '$1';"],
      
      // Fix assignment with strings
      [/=\s*['"]([^'"]*?)([^;,})\]]*)$/gm, "= '$1'$2"],
      
      // Fix function calls with string parameters
      [/\(\s*['"]([^'"]*?)$/gm, "('$1')"],
      
      // Fix array elements
      [/\s*\[['"]([^'"]*?)$/gm, "['$1']"],
      
      // Fix template string expressions
      [/\$\{([^}]*?)['"]([^'"]*?)$/gm, "${$1'$2}'}"],
      
      // Fix JSX props
      [/=\s*\{\s*['"]([^'"]*?)$/gm, "={'$1'}"],
      
      // Fix incomplete string concatenation
      [/\+\s*['"]([^'"]*?)$/gm, "+ '$1'"],
      
      // Fix ternary operator strings
      [/\?\s*['"]([^'"]*?)$/gm, "? '$1'"],
      [/:\s*['"]([^'"]*?)$/gm, ": '$1'"],
      
      // Fix interface/type definitions
      [/:\s*['"]([^'"]*?)$/gm, ": '$1'"],
      
      // Fix decorator strings
      [/@[A-Za-z]+\s*\(\s*['"]([^'"]*?)$/gm, "@$1('$2')"],
    ];
    
    // Apply all fixes
    for (const [pattern, replacement] of fixes) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }
    
    // Additional comprehensive fixes for specific patterns
    
    // Fix lines that end with just a quote
    content = content.replace(/^(.*)['"]$/gm, (match, line) => {
      if (line.includes('import') || line.includes('from')) {
        return line + "';";
      }
      if (line.includes('=')) {
        return line + "';";
      }
      return match;
    });
    
    // Fix incomplete template literals
    content = content.replace(/`([^`]*?)$/gm, '`$1`;');
    
    // Fix JSX attribute strings
    content = content.replace(/=\s*[""]([^"']*?)$/gm, '="$1"');
    
    // Fix object key-value pairs
    content = content.replace(/[""]([^"']*?)[""]\s*:\s*[""]([^"']*?)$/gm, '"$1": "$2"');
    
    // Fix array of strings
    content = content.replace(/,\s*[""]([^"']*?)$/gm, ', "$1"');
    
    // Fix function parameter defaults
    content = content.replace(/=\s*[""]([^"']*?)$/gm, '= "$1"');
    
    if (content !== originalContent) {
      changed = true;
    }
    
    // Print the diff instead of writing to the file
    if (changed) {
      console.log(`--- ${filePath}`);
      console.log(`+++ ${filePath} (dry-run)`);
      const diffs = diff.createPatch(filePath, originalContent, content);
      console.log(diffs);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to process directory recursively
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let totalFixed = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(item)) {
          totalFixed += processDirectory(fullPath, extensions);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          if (fixQuotesInFile(fullPath)) {
            totalFixed++;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
  
  return totalFixed;
}

// Main execution
console.log('Starting comprehensive quote fixing (dry-run)...');

const projectRoot = process.cwd();
const directories = [
  'packages/core/src',
  'packages/ui-components/src',
  'packages/api-client/src',
  'packages/types/src',
  'apps/api/src',
  'apps/frontend/src'
];

let totalFilesFixed = 0;

for (const dir of directories) {
  const fullDirPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullDirPath)) {
    console.log(`Processing directory: ${dir}`);
    const fixed = processDirectory(fullDirPath);
    totalFilesFixed += fixed;
    console.log(`Found ${fixed} files with potential issues in ${dir}`);
  } else {
    console.log(`Directory not found: ${dir}`);
  }
}

console.log(`\nTotal files with potential issues: ${totalFilesFixed}`);
console.log('Dry-run complete!');
