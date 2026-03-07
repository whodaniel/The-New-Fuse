#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Remove source map references from TypeScript files
 * These references are causing Vite warnings during development
 */

const FRONTEND_SRC = path.join(__dirname, '../apps/frontend/src');

// Find all TypeScript files with source map references
const files = glob.sync('**/*.{ts,tsx}', { 
  cwd: FRONTEND_SRC,
  absolute: true 
});

let fixedCount = 0;

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has source map reference
    if (content.includes('//# sourceMappingURL=')) {
      console.log(`Fixing: ${path.relative(process.cwd(), filePath)}`);
      
      // Remove source map references
      const cleanContent = content
        .replace(/\/\/# sourceMappingURL=.*$/gm, '')
        .replace(/\n\s*$/g, '\n'); // Clean up trailing whitespace
      
      fs.writeFileSync(filePath, cleanContent, 'utf8');
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files with source map references`);
console.log('Vite source map warnings should now be resolved.');