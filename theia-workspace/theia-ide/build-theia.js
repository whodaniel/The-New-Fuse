#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building Theia IDE...');

// Check if theia.json exists
const theiaConfigPath = path.join(__dirname, 'theia.json');
if (!fs.existsSync(theiaConfigPath)) {
  console.error('❌ theia.json not found. Creating default configuration...');
  
  const defaultConfig = {
    "frontend": {
      "config": {
        "applicationName": "The New Fuse IDE",
        "preferences": {
          "files.enableTrash": false,
          "editor.multiCursorModifier": "ctrlCmd"
        }
      }
    },
    "backend": {
      "config": {
        "startupTimeout": -1
      }
    }
  };
  
  fs.writeFileSync(theiaConfigPath, JSON.stringify(defaultConfig, null, 2));
  console.log('✅ Created default theia.json');
}

// Use the Theia CLI to build
const theiaCommand = process.platform === 'win32' ? 'theia.cmd' : 'theia';
const buildProcess = spawn(theiaCommand, ['build', '--mode', 'production'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Theia IDE build completed successfully');
  } else {
    console.error(`❌ Theia IDE build failed with exit code ${code}`);
    process.exit(code);
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Failed to start Theia build process:', error.message);
  process.exit(1);
});