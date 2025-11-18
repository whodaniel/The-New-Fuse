#!/usr/bin/env node
/**
 * Script to fix specific TypeScript syntax patterns in files
 * For The New Fuse project
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Process a single file with specific pattern fixes
function fixFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Pattern 1: Fix async functions with malformed signatures
    // Example: "async findById() => Promise<void> {id: string): Promise<User | null> {"
    // Should be: "async findById(id: string): Promise<User | null> {"
    content = content.replace(/async\s+(\w+)\(\)\s*=>\s*Promise<[^>]+>\s*{([^:]+):\s*([^)]+)\):\s*Promise<([^>]+)>\s*{/g, 
                         'async $1($2: $3): Promise<$4> {');
    
    // Pattern 2: Fix simpler async functions with malformed signatures
    // Example: "async findById() => Promise<void> {id: string): "
    content = content.replace(/async\s+(\w+)\(\)\s*=>\s*Promise<[^>]+>\s*{([^:]+):\s*/g, 
                         'async $1($2: ');
    
    // Pattern 3: Fix if statements with type annotations
    // Example: "if(context: unknown) {"
    content = content.replace(/if\s*\(([^:]+):\s*unknown\)\s*{/g, 
                         'if ($1) {');
    
    // Pattern 4: Fix switch statements with type annotations
    // Example: "switch(params.action: unknown) {"
    content = content.replace(/switch\s*\(([^:]+):\s*unknown\)\s*{/g, 
                         'switch($1) {');
    
    // Pattern 5: Fix malformed method calls with parentheses
    // Example: "this.templates.(get) → this.templates.get"
    content = content.replace(/this\.([^.]+)\.\(([^)]+)\)/g, 
                         'this.$1.$2');
    
    // Pattern 6: Fix typeof conditions
    // Example: "if(typeof message === "string": unknown) {"
    content = content.replace(/if\s*\(\s*typeof\s+([^=]+)\s*===\s*(['"])([^'"]+)\2:\s*unknown\)\s*{/g, 
                         'if (typeof $1 === $2$3$2) {');
    
    // Pattern 7: Fix Symbol.for type declarations
    // Example: "const TYPES: Symbol.for("ConfigService"): Symbol.for("DatabaseService"),"
    content = content.replace(/const\s+TYPES:\s+Symbol\.for\(["']([^"']+)["']\):/g, 
                         'const TYPES = {\n  $1: Symbol.for("$1"),');
    
    // Pattern 8: Fix object property definitions
    // Example: "LoggingService: Symbol.for("LoggingService"),"
    content = content.replace(/^\s*(\w+):\s+Symbol\.for\(["']([^"']+)['"]\),$/gm, 
                         '  $1: Symbol.for("$2"),');
    
    // Save changes if the file content was modified
    if (content !== originalContent) {
      // Create backup
      fs.writeFileSync(`${filePath}.bak`, originalContent);
      
      // Write fixed content
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed and saved: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ No patterns matched in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}: ${error.message}`);
    return false;
  }
}

// Files we want to fix
const filesToFix = [
  './src/core/database/repositories/user.repository.tsx',
  './src/core/di/types.tsx',
  './apps/frontend/src/providers/ThemeProvider.tsx'
];

console.log('🔧 Starting syntax pattern fixes...');
let fixedCount = 0;

filesToFix.forEach(filePath => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`✅ Fixed ${fixedCount} out of ${filesToFix.length} files`);
