#!/usr/bin/env node
/**
 * Script to fix broken TypeScript syntax in files with malformed function signatures
 * For The New Fuse project
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

// Specific files we know have issues
function getFilesWithErrors() {
  return [
    'src/core/database/repositories/user.repository.tsx',
    'src/core/di/types.tsx',
    'src/core/logging/logging.service.tsx',
    'src/core/middleware/rate-limit.middleware.tsx',
    'src/core/database/subscribers/user.subscriber.tsx',
    'src/core/docs/swagger.ts',
    'src/agent/services/QueueManager.tsx',
    'src/components/core/CoreModule.tsx',
    'src/components/features/auth/AuthenticationModule.tsx',
    'src/components/features/data/DataModule.tsx',
    'src/components/features/marketplace/MarketplaceModule.tsx',
    'src/components/theme/ThemeModule.tsx',
    'src/components/features/settings/LLMConfigProvider.tsx',
    'apps/frontend/src/providers/ThemeProvider.tsx'
  ];
}

// Fix common syntax errors in TypeScript files
function fixSyntaxErrors(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix 1: Fix function declarations with ") => Promise<void> {"
    content = content.replace(/async\s+(\w+)\(\)\s*=>\s*Promise<[^>]+>\s*{([^:]+):\s*/g, 
                             'async $1($2: ');
    
    // Fix 2: Fix weird Symbol.for() syntax in type declarations
    content = content.replace(/const\s+TYPES:\s+Symbol\.for\("([^"]+)"\):/g, 
                             'const TYPES = {\n  $1: Symbol.for("$1"),');
    
    // Fix 3: Fix subscribe<T> function signatures
    content = content.replace(/subscribe<T>\(eventName: string, handler: \(payload: T\)\s+= {/g, 
                             'subscribe<T>(eventName: string, handler: (payload: T) => void): () => void {');
  
    // Fix 4: Fix malformed interface property types
    content = content.replace(/(\w+):\s+Symbol\.for\("([^"]+)"\),/g,
                             '$1: Symbol.for("$2"),');
    
    // Fix 5: Fix broken Promise type declarations
    content = content.replace(/Promise\s*<\s*void\s*>\s*{([^:]+):/g,
                             'Promise<void> ($1:');

    // Fix 6: Fix broken if statements with type annotations
    content = content.replace(/if\(([^:]+):\s+unknown\)\s*{/g,
                             'if($1) {');
    
    // Fix 7: Fix broken switch statements
    content = content.replace(/switch\(([^:]+):\s+unknown\)\s*{/g, 
                             'switch($1) {');
    
    // Fix 8: Fix case statements
    content = content.replace(/(case\s+['"][^'"]+['"]):/g, 
                             '$1: {');
                             
    // Fix 9: Fix typeof checks
    content = content.replace(/if\(typeof\s+(\w+)\s+===\s+['"][^'"]+['"]:\s+unknown\)\s*{/g,
                             'if(typeof $1 === "string") {');
                             
    // Fix 10: Fix broken class properties and methods
    content = content.replace(/this\.([^.]+)\.\(([^)]+)\)/g,
                             'this.$1.$2');
    
    // Write fixed content back to file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed file: ${filePath}`);
    } else {
      console.log(`ℹ️ No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}: ${error.message}`);
  }
}

// Main execution
console.log('🔍 Finding TypeScript files with syntax errors...');
const filesToFix = getFilesWithErrors();

console.log(`Found ${filesToFix.length} files to fix`);
filesToFix.forEach(fixSyntaxErrors);

console.log('✅ All files have been processed');
