#!/usr/bin/env node
/**
 * This script will identify specific syntax issues in TypeScript files
 */
import fs from 'fs';

// Files we know have issues
const files = [
  'src/core/database/subscribers/user.subscriber.tsx',
  'src/core/middleware/rate-limit.middleware.tsx',
  'src/core/logging/logging.service.tsx',
];

console.log('Analyzing TypeScript files for specific syntax patterns...\n');

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== ${filePath} ===\n`);
  
  // Find malformed async functions
  const asyncFuncPattern = /async\s+(\w+)\(\)\s*=>\s*Promise<[^>]+>\s*{([^:]+):\s*/g;
  let match;
  while ((match = asyncFuncPattern.exec(content)) !== null) {
    console.log(`Found malformed async function: ${match[1]} with params starting with: ${match[2].slice(0, 20)}...`);
  }
  
  // Find malformed if statements
  const malformedIfPattern = /if\(([^:]+):\s+unknown\)\s*{/g;
  while ((match = malformedIfPattern.exec(content)) !== null) {
    console.log(`Found malformed if statement: if(${match[1]}: unknown) {...`);
  }

  // Find malformed method calls
  const malformedMethodPattern = /this\.([^.]+)\.\(([^)]+)\)/g;
  while ((match = malformedMethodPattern.exec(content)) !== null) {
    console.log(`Found malformed method call: this.${match[1]}.(${match[2]})`);
  }
});
