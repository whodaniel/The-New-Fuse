#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure we're in the project root
const projectRoot = process.cwd();

// Path to the TypeScript SDK directory
const sdkDir = path.join(projectRoot, '.yarn', 'sdks', 'typescript');
const libDir = path.join(sdkDir, 'lib');

// Ensure directories exist
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Create a proper tsserver.js file that correctly points to the TypeScript implementation
const tsserverContent = `#!/usr/bin/env node

// This file correctly loads the TypeScript server implementation
const path = require('path');
const fs = require('fs');

// Find the actual tsserver.js in node_modules
const typescriptPath = require.resolve('typescript');
const typescriptDir = path.dirname(typescriptPath);
const tsserverPath = path.join(typescriptDir, 'tsserver.js');

// Check if the file exists
if (!fs.existsSync(tsserverPath)) {
  console.error('TypeScript server not found at:', tsserverPath);
  process.exit(1);
}

// Load and run the actual tsserver implementation
require(tsserverPath);
`;

// Write the tsserver.js file
const tsserverPath = path.join(libDir, 'tsserver.js');
fs.writeFileSync(tsserverPath, tsserverContent);

console.log('TypeScript SDK setup complete!');
console.log('tsserver.js has been properly configured at:', tsserverPath);