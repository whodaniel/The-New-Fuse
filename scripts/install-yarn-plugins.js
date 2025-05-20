#!/usr/bin/env node

import { execSync  } from 'child_process';
import fs from 'fs';
import path from 'path';

// Make sure we're using Yarn 3
try {
  execSync('yarn set version 3.6.0', { stdio: 'inherit' });
  
} catch (error) {
  console.error('Failed to set Yarn version:', error);
  process.exit(1);
}

// Install the workspace tools plugin
try {
  execSync('yarn plugin import workspace-tools', { stdio: 'inherit' });
  
} catch (error) {
  console.error('Failed to install workspace-tools plugin:', error);
}

// Install the TypeScript plugin
try {
  execSync('yarn plugin import typescript', { stdio: 'inherit' });
  
} catch (error) {
  console.error('Failed to install TypeScript plugin:', error);
}

// Create .yarn/plugins directory if it doesn't exist
const pluginsDir = path.join(process.cwd(), '.yarn', 'plugins');
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

