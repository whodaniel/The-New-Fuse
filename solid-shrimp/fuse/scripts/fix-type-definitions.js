#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

// Directories to scan for type definition files
const DIRS_TO_SCAN = [
  'src/types',
  'src/utils'
];

// Function to fix 'as any' syntax in type definition files
function fixAsAnySyntax(filePath) {
  try {
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix filepath comments with 'as any'
    content = content.replace(/\/\/ filepath: ([^\(]+)\(([^\)]+) as any\)([^\n]+)/g, '// filepath: $1$2$3');
    
    // Fix type casts with 'as any'
    content = content.replace(/\(([\w\.]+) as any\)\./g, '$1.');
    
    // Fix parameter type annotations with ': any'
    content = content.replace(/([\w\)]+): any(\s*[\{\)])/g, '$1$2');
    
    // Fix variable declarations with ': any'
    content = content.replace(/for \(const ([\w]+) of ([\w]+): any\)/g, 'for (const $1 of $2)');
    
    // Fix if statements with ': any'
    content = content.replace(/if \(([\w]+): any\)/g, 'if ($1)');
    
    // Fix method calls with '.()' syntax
    content = content.replace(/\.\(([\w]+) as any\)/g, '.$1');
    
    // Check if content was modified
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      
      modified = true;
    }
    
    return modified;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Function to scan directories for type definition files
function scanDirectories() {
  let modifiedFiles = 0;
  
  for (const dir of DIRS_TO_SCAN) {
    const fullPath = path.join(process.cwd(), dir);

    try {
      const files = fs.readdirSync(fullPath, { recursive: true });
      
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        
        if (fs.statSync(filePath).isFile() && 
            (filePath.endsWith('.d.ts') || 
             filePath.endsWith('.ts'))) {
          const modified = fixAsAnySyntax(filePath);
          if (modified) modifiedFiles++;
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${fullPath}:`, error);
    }
  }
  
  return modifiedFiles;
}

// Main execution
const modifiedFiles = scanDirectories();

// Try to run TypeScript compiler to check if errors were fixed
try {
  
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  
} catch (error) {
  
}