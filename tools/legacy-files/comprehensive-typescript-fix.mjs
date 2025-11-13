#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TypeScriptFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  log(message) {
    console.log(`[TS-FIX] ${message}`);
  }

  error(message, error) {
    console.error(`[TS-FIX ERROR] ${message}`, error);
    this.errors.push({ message, error });
  }

  // Fix imports and exports
  fixImportsExports(content) {
    // Fix malformed imports like: import events"; -> import { EventEmitter } from "events";
    content = content.replace(/^import\s+([^"';]+)";$/gm, 'import { $1 } from "$1";');
    content = content.replace(/^import\s+;$/gm, '');
    content = content.replace(/^import\s+([^"';]*)\s*$/gm, '');
    
    // Fix common import patterns
    content = content.replace(/import\s+events"/g, 'import { EventEmitter } from "events"');
    content = content.replace(/import\s+\.\.\/\.\.\/core\/ApiClient\.js"/g, 'import { ApiClient } from "../../core/ApiClient.js"');
    content = content.replace(/import\s+\.\//g, 'import * from "./"');
    
    return content;
  }

  // Fix string literals and quotes
  fixStringLiterals(content) {
    // Fix unterminated strings and missing quotes
    content = content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^",;\}\]]+),/g, '$1: "$2",');
    
    // Fix enum values
    content = content.replace(/=\s*([a-zA-Z_][a-zA-Z0-9_:]*),;/g, '= "$1",');
    content = content.replace(/=\s*([a-zA-Z_][a-zA-Z0-9_:]*);/g, '= "$1";');
    
    // Fix object property assignments
    content = content.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_\-\.]+),;/g, '$1: "$2",');
    
    // Fix template literals
    content = content.replace(/\$\{([^}]+)\}`/g, '${$1}`');
    content = content.replace(/`([^`]*)\$\{([^}]+)\}([^`]*)`/g, '`$1\${$2}$3`');
    
    // Fix specific corrupted patterns
    content = content.replace(/Failed to ([^:]+): \$\{([^}]+)\}/g, '`Failed to $1: \${$2}`');
    content = content.replace(/([a-zA-Z]+) ([a-zA-Z]+): \$\{([^}]+)\}/g, '`$1 $2: \${$3}`');
    
    return content;
  }

  // Fix template literals
  fixTemplateLiterals(content) {
    // Fix common template literal corruptions
    content = content.replace(/(\w+)\s*:\s*`([^`]*)/g, '$1: `$2`');
    content = content.replace(/returnawait/g, 'return await');
    content = content.replace(/returnnew/g, 'return new');
    content = content.replace(/newDate\(/g, 'new Date(');
    content = content.replace(/newPromise\(/g, 'new Promise(');
    
    // Fix URL template literals
    content = content.replace(/\/v2\/([^`]*)\$\{([^}]+)\}/g, '`/v2/$1\${$2}`');
    content = content.replace(/(\w+)=\$\{([^}]+)\}/g, '$1=\${$2}');
    
    return content;
  }

  // Fix object literals and syntax
  fixObjectSyntax(content) {
    // Fix object property syntax
    content = content.replace(/,;/g, ',');
    content = content.replace(/;;/g, ';');
    content = content.replace(/\s*";$/gm, '";');
    
    // Fix function parameters
    content = content.replace(/\(\s*;/g, '(');
    content = content.replace(/,\s*;/g, ',');
    
    // Fix case statements
    content = content.replace(/case([a-zA-Z_][a-zA-Z0-9_]*)":/g, 'case "$1":');
    content = content.replace(/case\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*":/g, 'case "$1":');
    
    // Fix boolean and null values
    content = content.replace(/:\s*true,;/g, ': true,');
    content = content.replace(/:\s*false,;/g, ': false,');
    content = content.replace(/:\s*null,;/g, ': null,');
    
    return content;
  }

  // Fix function declarations and expressions
  fixFunctions(content) {
    // Fix async function syntax
    content = content.replace(/async\s+([a-zA-Z_][a-zA-Z0-9_]*)\(/g, 'async $1(');
    content = content.replace(/\)\s*:\s*Promise<([^>]+)>\s*{/g, '): Promise<$1> {');
    
    // Fix arrow functions
    content = content.replace(/=>\s*\{/g, '=> {');
    content = content.replace(/\}\s*;/g, '}');
    
    return content;
  }

  // Fix class and interface syntax
  fixClassInterface(content) {
    // Fix class constructors
    content = content.replace(/constructor\(\s*;/g, 'constructor(');
    content = content.replace(/private\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^,;]+),;/g, 'private $1: $2,');
    
    // Fix interface properties
    content = content.replace(/\s*\*\/;/g, ' */');
    content = content.replace(/\s*\*\//g, ' */');
    
    return content;
  }

  // Fix common TypeScript patterns
  fixTypeScriptPatterns(content) {
    // Fix type annotations
    content = content.replace(/:\s*([A-Z][a-zA-Z0-9_<>]*)\s*"/g, ': $1');
    content = content.replace(/:\s*string"/g, ': string');
    content = content.replace(/:\s*number"/g, ': number');
    content = content.replace(/:\s*boolean"/g, ': boolean');
    
    // Fix generic types
    content = content.replace(/<([^>]+)>\s*"/g, '<$1>');
    
    return content;
  }

  // Apply all fixes to content
  fixContent(content) {
    let fixed = content;
    
    fixed = this.fixImportsExports(fixed);
    fixed = this.fixStringLiterals(fixed);
    fixed = this.fixTemplateLiterals(fixed);
    fixed = this.fixObjectSyntax(fixed);
    fixed = this.fixFunctions(fixed);
    fixed = this.fixClassInterface(fixed);
    fixed = this.fixTypeScriptPatterns(fixed);
    
    return fixed;
  }

  // Process a single file
  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = this.fixContent(content);
      
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        this.fixedFiles.push(filePath);
        this.log(`Fixed: ${filePath}`);
      }
    } catch (error) {
      this.error(`Failed to process ${filePath}`, error);
    }
  }

  // Find all TypeScript files in a directory
  findTypeScriptFiles(dir, extensions = ['.ts', '.tsx']) {
    const files = [];
    
    function traverse(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and dist directories
          if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
            traverse(fullPath);
          }
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  // Main fix function
  async fixProject(rootDir = '.') {
    this.log('Starting comprehensive TypeScript fix...');
    
    const tsFiles = this.findTypeScriptFiles(rootDir);
    this.log(`Found ${tsFiles.length} TypeScript files`);
    
    for (const file of tsFiles) {
      await this.processFile(file);
    }
    
    this.log(`Fix complete. Fixed ${this.fixedFiles.length} files.`);
    
    if (this.errors.length > 0) {
      this.log(`Encountered ${this.errors.length} errors:`);
      this.errors.forEach(err => console.error(err));
    }
    
    return {
      fixedFiles: this.fixedFiles,
      errors: this.errors
    };
  }
}

// Run the fixer if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new TypeScriptFixer();
  fixer.fixProject().then(result => {
    console.log('\n=== SUMMARY ===');
    console.log(`Fixed files: ${result.fixedFiles.length}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.fixedFiles.length > 0) {
      console.log('\nFixed files:');
      result.fixedFiles.forEach(file => console.log(`  - ${file}`));
    }
    
    process.exit(result.errors.length > 0 ? 1 : 0);
  });
}

export default TypeScriptFixer;