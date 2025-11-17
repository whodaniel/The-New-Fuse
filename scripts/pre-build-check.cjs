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
  
  // Check if all required native modules are working
  // Note: canvas is optional as it requires system dependencies (pangocairo, etc.)
  const nativeModuleChecks = [
    { name: 'canvas', check: () => checkCanvas() && testCanvas(), optional: true },
    { name: 'drivelist', check: () => checkNativeModule('drivelist') },
    { name: 'node-pty', check: () => checkNativeModule('node-pty') },
    { name: '@vscode/ripgrep', check: () => checkNativeModule('@vscode/ripgrep') }
  ];
  
  let allPassed = true;
  const failedModules = [];
  const optionalFailed = [];

  for (const moduleCheck of nativeModuleChecks) {
    try {
      if (!moduleCheck.check()) {
        if (moduleCheck.optional) {
          optionalFailed.push(moduleCheck.name);
        } else {
          allPassed = false;
          failedModules.push(moduleCheck.name);
        }
      }
    } catch (error) {
      if (moduleCheck.optional) {
        optionalFailed.push(moduleCheck.name);
      } else {
        allPassed = false;
        failedModules.push(moduleCheck.name);
      }
    }
  }

  if (optionalFailed.length > 0) {
    log(`⚠️  Optional native modules not available: ${optionalFailed.join(', ')} (non-critical)`);
  }
  
  if (allPassed) {
    log('✅ All native modules ready for build');
    return;
  }
  
  log(`ERROR: Native modules are missing or not working: ${failedModules.join(', ')}`);
  log('This likely means the postinstall script failed or native modules need setup.');
  log('');
  log('🛠️  Attempting automatic fix...');
  
  // Try to fix automatically
  try {
    const setupScript = path.join(process.cwd(), 'scripts', 'setup-native-modules.cjs');
    if (fs.existsSync(setupScript)) {
      execSync('node scripts/setup-native-modules.cjs', { stdio: 'inherit' });
      log('✅ Automatic fix completed - retrying build checks...');
      
      // Re-check after fix
      let fixWorked = true;
      for (const moduleCheck of nativeModuleChecks) {
        try {
          if (!moduleCheck.check()) {
            fixWorked = false;
            break;
          }
        } catch (error) {
          fixWorked = false;
          break;
        }
      }
      
      if (fixWorked) {
        log('✅ All native modules now ready for build');
        return;
      }
    }
  } catch (error) {
    log(`Automatic fix failed: ${error.message}`);
  }
  
  log('❌ Native modules still not working after automatic fix.');
  log('');
  log('🛠️  Manual fix options:');
  log('   bun run setup:native-modules');
  log('   bun run fix:native-modules');
  log('');
  log('   Or for a complete reinstall:');
  log('   bun install');
  log('');
  
  // Exit with error to prevent broken builds
  process.exit(1);
}

function checkNativeModule(moduleName) {
  const modulePath = path.join(process.cwd(), 'node_modules', moduleName);
  return fs.existsSync(modulePath);
}

try {
  main();
} catch (error) {
  log('⚠️  Pre-build check failed:', error.message);
  process.exit(1);
}
