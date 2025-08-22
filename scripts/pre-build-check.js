#!/usr/bin/env node

/**
 * Pre-Build Check - Ensures native modules are ready before building
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-build: Checking native modules...');

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
      console.log('✅ Canvas not required - proceeding with build');
      return;
    }
  }
  
  // Check if canvas is working
  if (checkCanvas() && testCanvas()) {
    console.log('✅ Native modules ready for build');
    return;
  }
  
  console.log('❌ Canvas native module not working - build may fail');
  console.log('');
  console.log('🛠️  To fix this issue, run:');
  console.log('   bun run fix:native-modules');
  console.log('');
  console.log('   Or for a complete reinstall:');
  console.log('   bun run install:smart');
  console.log('');
  
  // Don't fail the build, just warn
  console.log('⚠️  Continuing with build (some tests may fail)...');
}

try {
  main();
} catch (error) {
  console.log('⚠️  Pre-build check failed:', error.message);
}