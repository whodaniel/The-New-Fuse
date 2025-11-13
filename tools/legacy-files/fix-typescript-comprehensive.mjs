#!/usr/bin/env node

/**
 * Comprehensive TypeScript Error Fix Script
 * Fixes remaining issues in the backend application
 */

import { readFile, writeFile, access } from 'fs/promises';
import globPkg from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const { glob } = globPkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_DIR = path.join(__dirname, 'apps');
const PACKAGES_DIR = path.join(__dirname, 'packages');

// Fix patterns for common TypeScript issues
const fixes = [
  // Fix relative imports to include .js extension (ESM modules)
  {
    name: 'Add .js extensions to relative imports',
    pattern: /from ['"](\.\.[\/\\][^'"]*(?<!\.js|\.json))['"];?/g,
    replacement: "from '$1.js';"
  },
  {
    name: 'Add .js extensions to current directory imports',
    pattern: /from ['"](\.[\/\\][^'"]*(?<!\.js|\.json))['"];?/g,
    replacement: "from '$1.js';"
  },
  
  // Fix Redis imports
  {
    name: 'Fix Redis named imports',
    pattern: /import Redis from ['"]ioredis['"];?/g,
    replacement: "import { Redis } from 'ioredis';"
  },
  
  // Fix JWT SignOptions
  {
    name: 'Fix JWT sign options',
    pattern: /jwt\.sign\(([^,]+),\s*([^,]+),\s*\{\s*expiresIn:\s*([^}]+)\s*\}/g,
    replacement: "jwt.sign($1, $2, { expiresIn: $3 } as jwt.SignOptions"
  },
  
  // Fix express route handlers
  {
    name: 'Fix async route handler typing',
    pattern: /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"],\s*(async\s*\([^)]*\)\s*=>\s*\{)/g,
    replacement: "router.$1('$2', asyncHandler($3"
  },
  
  // Fix error handling
  {
    name: 'Fix error type handling in catch blocks',
    pattern: /catch\s*\(\s*([^)]+)\s*\)\s*\{([^}]*)\1\.message/g,
    replacement: function(match, errorVar, content) {
      return match.replace(
        `${errorVar}.message`,
        `(${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar}))`
      );
    }
  },
  
  // Fix async function return types
  {
    name: 'Fix async function return types',
    pattern: /async\s+function\s+([^(]+)\([^)]*\):\s*any/g,
    replacement: "async function $1(): Promise<any>"
  },
  
  // Fix module declarations
  {
    name: 'Add explicit return types to exported functions',
    pattern: /export\s+async\s+function\s+([^(]+)\([^)]*\)\s*\{/g,
    replacement: function(match, funcName) {
      return match.replace('async function', 'async function').replace(') {', '): Promise<any> {');
    }
  }
];

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fixFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    let changeLog = [];
    
    for (const fix of fixes) {
      const originalContent = content;
      
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      if (content !== originalContent) {
        modified = true;
        changeLog.push(fix.name);
      }
    }
    
    // Additional manual fixes for specific issues
    
    // Fix missing imports for commonly used types
    if (content.includes('SignOptions') && !content.includes('import { SignOptions }')) {
      content = content.replace(
        /import jwt.*from ['"]jsonwebtoken['"];?/,
        "import jwt, { SignOptions } from 'jsonwebtoken';"
      );
      modified = true;
      changeLog.push('Added SignOptions import');
    }
    
    // Fix Express handler types
    if (content.includes('Request, Response') && !content.includes('NextFunction')) {
      content = content.replace(
        /import.*\{([^}]*Request[^}]*Response[^}]*)\}.*from ['"]express['"];?/,
        "import { $1, NextFunction } from 'express';"
      );
      modified = true;
      changeLog.push('Added NextFunction import');
    }
    
    // Add asyncHandler utility if missing
    if (content.includes('asyncHandler') && !content.includes('const asyncHandler')) {
      const asyncHandlerCode = `
// Async handler wrapper for Express routes
const asyncHandler = (fn: (req: any, res: any, next?: any) => Promise<any>) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

`;
      content = content.replace(
        /(import.*;\n\n)/,
        `$1${asyncHandlerCode}`
      );
      modified = true;
      changeLog.push('Added asyncHandler utility');
    }
    
    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      console.log(`   Applied: ${changeLog.join(', ')}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting comprehensive TypeScript error fix...\n');
  
  try {
    // Find all TypeScript files in apps and packages
    const patterns = [
      path.join(APPS_DIR, '**/*.ts').replace(/\\/g, '/'),
      path.join(PACKAGES_DIR, '**/*.ts').replace(/\\/g, '/')
    ];
    
    let allFiles = [];
    for (const pattern of patterns) {
      if (await fileExists(path.dirname(pattern))) {
        const files = await glob(pattern);
        allFiles = allFiles.concat(files);
      }
    }
    
    // Filter out declaration files and node_modules
    const tsFiles = allFiles.filter(file => 
      !file.includes('node_modules') && 
      !file.includes('.d.ts') &&
      !file.includes('dist/')
    );
    
    console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`);
    
    let fixedCount = 0;
    let processedCount = 0;
    
    for (const file of tsFiles) {
      const wasFixed = await fixFile(file);
      if (wasFixed) {
        fixedCount++;
      }
      processedCount++;
      
      // Progress indicator
      if (processedCount % 10 === 0) {
        console.log(`📊 Progress: ${processedCount}/${tsFiles.length} files processed`);
      }
    }
    
    console.log(`\n🎉 Fix completed!`);
    console.log(`📈 Statistics:`);
    console.log(`   - Files processed: ${processedCount}`);
    console.log(`   - Files modified: ${fixedCount}`);
    console.log(`   - Success rate: ${((fixedCount / processedCount) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runFixes };
