#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting TypeScript issue fixes...');

// Track fixes applied
let fixCount = 0;

// Function to safely read file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log(`⚠️  Could not read file: ${filePath}`);
    return null;
  }
}

// Function to safely write file
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    fixCount++;
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.log(`❌ Could not write file: ${filePath}`);
  }
}

// Function to recursively find files
function findFiles(dir, extensions = ['.ts', '.tsx'], exclude = ['node_modules', '.git']) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !exclude.some(ex => fullPath.includes(ex))) {
          traverse(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

// Fix functions for different issue types
const fixes = {
  // Fix import paths that reference .js extensions but point to .tsx files
  fixJsImportsToTsx: function(content, filePath) {
    let modified = false;
    
    // Fix imports ending with .js that should be .tsx
    content = content.replace(/from\s+['"](\.\.?\/[^'"]*?)\.js['"]/g, (match, importPath) => {
      // Check if a .tsx file exists for this import
      const currentDir = path.dirname(filePath);
      const resolvedPath = path.resolve(currentDir, importPath + '.tsx');
      
      if (fs.existsSync(resolvedPath)) {
        modified = true;
        return match.replace('.js', '.tsx');
      }
      return match;
    });
    
    return { content, modified };
  },

  // Fix missing quotes in import statements
  fixImportQuotes: function(content) {
    let modified = false;
    
    // Fix cases like: from 'socket.'io'
    content = content.replace(/from\s+['"]([^'"]*?)\.'([^'"]*?)['"]/, (match, part1, part2) => {
      modified = true;
      return `from '${part1}.${part2}'`;
    });
    
    return { content, modified };
  },

  // Fix Redis import issues
  fixRedisImports: function(content) {
    let modified = false;
    
    // Fix Redis namespace usage
    if (content.includes("private redis: Redis;")) {
      content = content.replace("private redis: Redis;", "private redis: any;");
      modified = true;
    }
    
    // Fix Redis constructor calls
    if (content.includes("new Redis(")) {
      content = content.replace(/new Redis\(/g, "new (Redis as any)(");
      modified = true;
    }
    
    return { content, modified };
  },

  // Add missing property initializers for DTOs
  fixDTOProperties: function(content, filePath) {
    let modified = false;
    
    if (filePath.includes('.dto.ts')) {
      // Add definite assignment assertions for DTO properties
      content = content.replace(/(\s+)([a-zA-Z][a-zA-Z0-9]*)\s*:\s*([^;=\n]+);/g, (match, indent, propName, propType) => {
        // Skip if already has initializer or assertion
        if (match.includes('=') || match.includes('!')) {
          return match;
        }
        modified = true;
        return `${indent}${propName}!: ${propType};`;
      });
    }
    
    return { content, modified };
  },

  // Fix JSX resolution issues
  fixJsxExtensions: function(content) {
    let modified = false;
    
    // Fix imports that resolve to .tsx files when JSX is not set
    content = content.replace(/from\s+['"](\.\.?\/[^'"]*?)\.js['"]/g, (match, importPath) => {
      if (importPath.includes('entities/')) {
        // Assume these should be .ts not .tsx for entities
        modified = true;
        return match.replace('.js', '');
      }
      return match;
    });
    
    return { content, modified };
  },

  // Fix module resolution for @the-new-fuse packages
  fixModuleResolution: function(content) {
    let modified = false;
    
    // Fix common module resolution issues
    const moduleReplacements = {
      '@the-new-fuse/database/src/prisma.service': '@the-new-fuse/database',
      '@the-new-fuse/core/types': '@the-new-fuse/types',
      '@the-new-fuse/database/client': '@the-new-fuse/database'
    };
    
    for (const [oldModule, newModule] of Object.entries(moduleReplacements)) {
      if (content.includes(oldModule)) {
        content = content.replace(new RegExp(oldModule, 'g'), newModule);
        modified = true;
      }
    }
    
    return { content, modified };
  },

  // Fix supertest usage
  fixSupertestUsage: function(content) {
    let modified = false;
    
    if (content.includes('supertest') && content.includes('request(')) {
      // Fix supertest import and usage
      if (!content.includes('import * as request from \'supertest\'')) {
        content = content.replace(
          /import supertest from ['"]supertest['"];?/,
          'import * as request from \'supertest\';'
        );
        modified = true;
      }
    }
    
    return { content, modified };
  },

  // Fix error handling with unknown types
  fixErrorHandling: function(content) {
    let modified = false;
    
    // Fix error handling where error is unknown
    content = content.replace(/} catch \(error\) \{[\s\S]*?error\.message/g, (match) => {
      if (!match.includes('Error') && !match.includes('unknown')) {
        modified = true;
        return match.replace('} catch (error) {', '} catch (error: unknown) {')
                   .replace('error.message', '(error as Error).message');
      }
      return match;
    });
    
    return { content, modified };
  }
};

// Process all TypeScript files
function processFiles() {
  const rootDir = process.cwd();
  const files = findFiles(rootDir);
  
  console.log(`📁 Found ${files.length} TypeScript files to process...`);
  
  for (const filePath of files) {
    const content = readFile(filePath);
    if (!content) continue;
    
    let currentContent = content;
    let fileModified = false;
    
    // Apply all fixes
    for (const [fixName, fixFunction] of Object.entries(fixes)) {
      const result = fixFunction(currentContent, filePath);
      if (result.modified) {
        currentContent = result.content;
        fileModified = true;
      }
    }
    
    // Write back if modified
    if (fileModified) {
      writeFile(filePath, currentContent);
    }
  }
}

// Specific file fixes for known issues
function fixSpecificFiles() {
  // Fix cache.service.ts Redis issues
  const cacheServicePath = 'apps/api/src/cache/cache.service.ts';
  const cacheContent = readFile(cacheServicePath);
  if (cacheContent) {
    let newContent = cacheContent;
    
    // Fix Redis import and usage
    newContent = newContent.replace(
      'import Redis from \'ioredis\';',
      'import * as Redis from \'ioredis\';'
    );
    
    newContent = newContent.replace(
      'private redis: Redis;',
      'private redis: any;'
    );
    
    newContent = newContent.replace(
      'this.redis = new Redis(',
      'this.redis = new (Redis as any)('
    );
    
    if (newContent !== cacheContent) {
      writeFile(cacheServicePath, newContent);
    }
  }
  
  // Fix agent controller tsx issues
  const agentControllerPath = 'apps/api/src/controllers/agent.controller.tsx';
  const agentContent = readFile(agentControllerPath);
  if (agentContent) {
    let newContent = agentContent;
    
    // Fix Agent import to be type-only
    newContent = newContent.replace(
      'import { Agent } from',
      'import type { Agent } from'
    );
    
    // Fix usage of Agent as value
    newContent = newContent.replace(
      /Agent\.findMany/g,
      'prisma.agent.findMany'
    );
    
    newContent = newContent.replace(
      /Agent\.findUnique/g,
      'prisma.agent.findUnique'
    );
    
    newContent = newContent.replace(
      /Agent\.create/g,
      'prisma.agent.create'
    );
    
    newContent = newContent.replace(
      /Agent\.update/g,
      'prisma.agent.update'
    );
    
    newContent = newContent.replace(
      /Agent\.delete/g,
      'prisma.agent.delete'
    );
    
    if (newContent !== agentContent) {
      writeFile(agentControllerPath, newContent);
    }
  }
}

// Main execution
console.log('🚀 Starting comprehensive TypeScript fixes...\n');

// First run general fixes
processFiles();

// Then run specific file fixes
fixSpecificFiles();

console.log(`\n✨ Completed! Applied ${fixCount} fixes.`);
console.log('🔍 Run "npx tsc --noEmit --skipLibCheck" to verify fixes.');