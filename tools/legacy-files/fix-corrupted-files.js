#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive file corruption fix script for The New Fuse codebase
 * Fixes common corruption patterns found in TypeScript files
 */

const corruptionPatterns = [
  // Import statement fixes
  { pattern: /import\s+\{([^}]+)\}\s+from\s+['"]\/@nestjs\/([^'"]+)''/g, replacement: "import {$1} from '@nestjs/$2';" },
  { pattern: /import\s+\{([^}]+)\}\s+from\s+['"]\/\.\/([^'"]+)''/g, replacement: "import {$1} from './$2';" },
  { pattern: /import\s+\{([^}]+)\}\s+from\s+['"]\/([^'"]+)''/g, replacement: "import {$1} from '$2';" },
  
  // Fix broken string literals and method calls
  { pattern: /await this\.redisService\.h(get|set|del|incrby)\([^)]*$/gm, replacement: (match) => {
    if (match.includes('hget')) return "await this.redisService.hget(key, field);";
    if (match.includes('hset')) return "await this.redisService.hset(key, field, value);";
    if (match.includes('hdel')) return "await this.redisService.hdel(key, field);";
    if (match.includes('hincrby')) return "await this.redisService.hincrby(key, field, increment);";
    return match;
  }},
  
  // Fix broken template literals and strings
  { pattern: /['"]\$\{[^}]*\}['"]/g, replacement: '`${placeholder}`' },
  { pattern: /''/g, replacement: "''" },
  { pattern: /'(\w+)'/g, replacement: "'$1'" },
  
  // Fix method definitions
  { pattern: /(\w+)\s*:\s*async\s*\(/g, replacement: 'async $1(' },
  { pattern: /(\w+)\s*:\s*\(/g, replacement: '$1(' },
  
  // Fix class and interface definitions
  { pattern: /export\s+(class|interface)\s+(\w+)\s*{/g, replacement: 'export $1 $2 {' },
  
  // Fix broken Redis operations
  { pattern: /this\.redisService\.(hget|hset|hdel|hincrby)\([^)]*$/gm, replacement: (match, operation) => {
    switch (operation) {
      case 'hget': return "this.redisService.hget(key, field)";
      case 'hset': return "this.redisService.hset(key, field, value)";
      case 'hdel': return "this.redisService.hdel(key, field)";
      case 'hincrby': return "this.redisService.hincrby(key, field, increment)";
      default: return match;
    }
  }},
  
  // Fix logger calls
  { pattern: /this\.logger\.(error|warn|log|debug)\([^)]*$/gm, replacement: "this.logger.$1('message', context);" },
  
  // Fix event emitter calls
  { pattern: /this\.eventEmitter\.emit\([^)]*$/gm, replacement: "this.eventEmitter.emit('event', data);" },
  
  // Fix try-catch blocks
  { pattern: /}\s*catch\s*\(\s*error\s*\)\s*{\s*$/gm, replacement: "} catch (error) {" },
];

function fixFileCorruption(content) {
  let fixed = content;
  
  // Apply all corruption patterns
  corruptionPatterns.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'function') {
      fixed = fixed.replace(pattern, replacement);
    } else {
      fixed = fixed.replace(pattern, replacement);
    }
  });
  
  // Additional specific fixes
  fixed = fixed
    // Fix malformed import statements
    .replace(/import\s+\{[^}]*\}\s+from\s+['"'][^'"]*''\s*;?/g, (match) => {
      if (match.includes('@nestjs')) {
        const moduleMatch = match.match(/@nestjs\/([^'"]+)/);
        if (moduleMatch) {
          const importMatch = match.match(/\{([^}]+)\}/);
          if (importMatch) {
            return `import {${importMatch[1]}} from '@nestjs/${moduleMatch[1]}';`;
          }
        }
      }
      return match;
    })
    
    // Fix broken string literals
    .replace(/(['"]).+?''/g, '$1placeholder$1')
    
    // Fix incomplete statements
    .replace(/;\s*$/gm, ';')
    
    // Remove duplicate semicolons
    .replace(/;;+/g, ';')
    
    // Fix broken method chains
    .replace(/\.\s*$/gm, '();')
    
    // Fix empty blocks
    .replace(/{\s*$/gm, '{\n  // Implementation needed\n}');
    
  return fixed;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.js')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fixed = fixFileCorruption(content);
        
        if (content !== fixed) {
          fs.writeFileSync(fullPath, fixed);
          console.log(`Fixed: ${fullPath}`);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  });
}

// Process the core package
const coreDir = 'packages/core/src';
if (fs.existsSync(coreDir)) {
  console.log('Starting corruption fix for core package...');
  processDirectory(coreDir);
  console.log('Core package corruption fix complete.');
} else {
  console.error('Core package directory not found:', coreDir);
}