#!/usr/bin/env node

import { execSync  } from 'child_process';
import path from 'path';
import fs from 'fs';

// Find locally installed TypeScript binary
const tscPath = path.join(process.cwd(), 'node_modules', '.bin', 'tsc');
const hasTsc = fs.existsSync(tscPath);

if (!hasTsc) {
  
  try {
    execSync('npm install --no-save typescript@4.9.5', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('Failed to install TypeScript:', error);
    process.exit(1);
  }
}

// Run TypeScript check

try {
  execSync(`${tscPath} --noEmit`, { stdio: 'inherit' });
  
} catch (error) {
  console.error('TypeScript check failed. See errors above.');
  process.exit(1);
}
