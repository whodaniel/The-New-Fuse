#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Postinstall: Checking native modules...');

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

function fixCanvas() {
  console.log('🛠️  Fixing canvas native module...');
  const canvasPath = path.join(process.cwd(), 'node_modules', 'canvas');
  
  if (!fs.existsSync(canvasPath)) {
    console.log('❌ Canvas package not found - skipping native module fix');
    return false;
  }
  
  try {
    process.chdir(canvasPath);
    try {
      execSync('node-gyp rebuild', { stdio: 'inherit', timeout: 60000 });
    } catch (error) {
      console.log('   Trying with npx node-gyp...');
      execSync('npx node-gyp rebuild', { stdio: 'inherit', timeout: 60000 });
    }
    process.chdir(path.join(__dirname, '..'));
    console.log('✅ Canvas native module compiled successfully');
    return true;
  } catch (error) {
    process.chdir(path.join(__dirname, '..'));
    console.log('❌ Failed to compile canvas native module:', error.message);
    return false;
  }
}

function main() {
  if (process.env.CI && process.env.SKIP_NATIVE_MODULES) {
    console.log('⏭️  Skipping native module check in CI');
    return;
  }
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasCanvas = packageJson.dependencies?.canvas || 
                     packageJson.devDependencies?.canvas ||
                     packageJson.optionalDependencies?.canvas;
    
    if (!hasCanvas) {
      console.log('⏭️  Canvas not in dependencies - skipping check');
      return;
    }
  }
  
  if (checkCanvas() && testCanvas()) {
    console.log('✅ Native modules are working correctly');
    return;
  }
  
  console.log('⚠️  Canvas native module needs fixing...');
  
  if (fixCanvas()) {
    if (testCanvas()) {
      console.log('🎉 Canvas native module fix successful!');
    } else {
      console.log('⚠️  Canvas compiled but may have runtime issues');
      console.log('💡 You may need system dependencies: pnpm run fix:native-modules');
    }
  } else {
    console.log('⚠️  Automatic canvas fix failed');
    console.log('💡 Run manually: pnpm run fix:native-modules');
  }
}

try {
  main();
} catch (error) {
  console.log('⚠️  Postinstall check failed:', error.message);
  console.log('💡 If you encounter issues, run: pnpm run fix:native-modules');
}