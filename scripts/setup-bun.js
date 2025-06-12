#!/usr/bin/env node

import { execSync  } from 'child_process';
import fs from 'fs';
import path from 'path';

// Note: Bun doesn't use plugins like Yarn, but we can ensure Bun is properly set up
try {
  console.log('Checking Bun installation...');
  execSync('bun --version', { stdio: 'inherit' });
  console.log('Bun is properly installed.');
} catch (error) {
  console.error('Bun is not installed or not accessible:', error);
  console.log('Please install Bun from https://bun.sh/');
  process.exit(1);
}

// Bun has built-in TypeScript support and workspace management
// No additional plugins needed like Yarn
console.log('Bun provides built-in support for:');
console.log('- TypeScript compilation');
console.log('- Workspace management');
console.log('- Fast package installation');
console.log('- Built-in bundler');

// Ensure bun.lockb exists by running bun install
try {
  console.log('Running bun install to ensure lockfile exists...');
  execSync('bun install', { stdio: 'inherit' });
  console.log('Bun setup complete!');
} catch (error) {
  console.error('Failed to run bun install:', error);
}

