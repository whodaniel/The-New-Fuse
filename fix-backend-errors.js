#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.join(__dirname, 'apps/backend/src');

// Fixes to apply
const fixes = [
  // Fix Redis imports
  {
    pattern: /import Redis from 'ioredis'/g,
    replacement: "import { Redis } from 'ioredis'"
  },
  
  // Fix relative imports to include .js extension
  {
    pattern: /from '(\.\.[\/\\][^']*(?<!\.js|\.json))'/g, // Unnecessary escape character: \/.
 replacement: "from '$1.js'"
  },
  {
 pattern: /from '(\.[\/\\][^']*(?<!\.js|\.json))'/g, // Unnecessary escape character: \/.
 replacement: "from '$1.js'"
  },
  
  // Fix JWT imports and usage
  {
    pattern: /jwt\.sign\(([^,]+),\s*([^,]+),\s*\{\s*expiresIn:\s*([^}]+)\s*\}\)/g,
    replacement: "jwt.sign($1, $2, { expiresIn: $3 } as jwt.SignOptions)"
  },
  
  // Fix async function return types
  {
    pattern: /async function ([^(]+)\([^)]*\):\s*any/g,
    replacement: "async function $1(): Promise<any>"
  },
  
  // Fix error handling in catch blocks
  {
    pattern: /catch\s*\(\s*([^)]+)\s*\)\s*{\s*[^}]*\.message/g,
    replacement: function(match, errorVar) {
      return match.replace(`.message`, ` && typeof ${errorVar} === 'object' && 'message' in ${errorVar} ? ${errorVar}.message : ${errorVar}`);
    }
  }
];

async function fixFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    
    for (const fix of fixes) {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    const files = await glob(path.join(BACKEND_DIR, '**/*.ts').replace(/\\/g, '/'));
    console.log(`Found ${files.length} TypeScript files to check`);
    
    let fixedCount = 0;
    for (const file of files) {
      const wasFixed = await fixFile(file);
      if (wasFixed) {
        fixedCount++;
      }
    }
    
    console.log(`\nFixed ${fixedCount} files`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
