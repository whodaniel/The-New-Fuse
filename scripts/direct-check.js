#!/usr/bin/env node

import { spawnSync  } from 'child_process';
import fs from 'fs';
import path from 'path';

// Install TypeScript directly with npm

spawnSync('npm', ['install', '--no-save', 'typescript@4.9.5'], { 
  stdio: 'inherit',
  shell: true
});

// Run TypeScript check using a specific tsconfig

const tscResult = spawnSync('npx', ['tsc', '--project', 'tsconfig-check.json', '--noEmit'], { 
  encoding: 'utf8',
  stdio: 'pipe',
  shell: true
});

const output = tscResult.stdout || tscResult.stderr || '';
const errors = output.split('\n')
  .filter(line => line.includes('error TS'));

if (errors.length === 0) {
  
  process.exit(0);
}

// Group errors by file
const errorsByFile = {};
errors.forEach(error => {
  const match = error.match(/(.*?)\(\d+,\d+\): error TS\d+: (.*)/);
  if (match) {
    const file = match[1];
    const message = match[2];
    if (!errorsByFile[file]) {
      errorsByFile[file] = [];
    }
    errorsByFile[file].push(message);
  }
});

// Print top error files

Object.entries(errorsByFile)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([file, errors]) => {
    
    // Print first 3 errors in each file
    errors.slice(0, 3).forEach(error => {
      
    });
    if (errors.length > 3) {
      
    }
  });

// Save error report
fs.writeFileSync('typescript-errors-direct.json', JSON.stringify({
  totalErrors: errors.length,
  errorsByFile: Object.fromEntries(
    Object.entries(errorsByFile).map(([file, errors]) => [
      file,
      {
        count: errors.length,
        errors: errors.slice(0, 5) // Just save first 5 errors per file
      }
    ])
  )
}, null, 2));

