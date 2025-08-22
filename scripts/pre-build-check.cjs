#!/usr/bin/env node

/**
 * Pre-Build Check - Ensures native modules are ready before building
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[pre-build-check.js] ${message}`);
}

log('Verifying native modules before build/test...');

function checkCanvas() {
  const canvasPath = path.join(process.cwd(), 'node_modules', 'canvas');
  const canvasNodePath = path.join(canvasPath, 'build', 'Release', 'canvas.node');
  return fs.existsSync(canvasPath) && fs.existsSync(canvasNodePath);
}

function testCanvas() {
  try {
    execSync('node -e "const { createCanvas } = require(\'canvas\'); createCanvas(200, 200);"', { 
      stdio: 'pipe', timeout: 5000 
    });
    return true;
  } catch (error) {
    return false;
  }
}

function main() {
  // Check if canvas is in dependencies
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasCanvas = packageJson.dependencies?.canvas || 
                     packageJson.devDependencies?.canvas ||
                     packageJson.optionalDependencies?.canvas;
    
    if (!hasCanvas) {
      log('✅ Canvas not required - proceeding with build');
      return;
    }
  }
  
  // Check if canvas is working
  if (checkCanvas() && testCanvas()) {
    log('✅ Native modules ready for build');
    return;
  }
  
  log('ERROR: Critical native module "canvas.node" is missing or not working.');
  log('This likely means the postinstall script failed or was skipped.');
  log('');
  log('🛠️  To fix this issue, run:');
  log('   bun run fix:native-modules');
  log('');
  log('   Or for a complete reinstall:');
  log('   bun install');
  log('');
  
  // Exit with error to prevent broken builds
  process.exit(1);
}

try {
  main();
} catch (error) {
  log('⚠️  Pre-build check failed:', error.message);
  process.exit(1);
}
