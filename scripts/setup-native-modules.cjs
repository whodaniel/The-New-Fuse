#!/usr/bin/env node

/**
 * Native Module Setup - Ensures all required native modules are properly installed and built
 * This script handles the common native module issues that occur during builds
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Skip native module builds in CI/Docker/Railway environments
if (process.env.RAILWAY_ENVIRONMENT || process.env.CI || process.env.DOCKER || process.env.KUBERNETES_SERVICE_HOST) {
  console.log('[native-setup] Skipping native module setup in CI/Docker/Railway environment');
  process.exit(0);
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} [native-setup] ${message}`);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit', 
      encoding: 'utf8',
      timeout: options.timeout || 120000,
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, code: error.status };
  }
}

function checkNativeModule(moduleName, requiredFiles = []) {
  const modulePath = path.join(process.cwd(), 'node_modules', moduleName);
  
  if (!fs.existsSync(modulePath)) {
    return { exists: false, built: false };
  }
  
  const allFilesExist = requiredFiles.every(file => {
    const filePath = path.join(modulePath, file);
    return fs.existsSync(filePath);
  });
  
  return { exists: true, built: allFilesExist };
}

function installNativeModule(moduleName) {
  log(`Installing ${moduleName}...`);
  const result = runCommand(`bun add ${moduleName} --dev`, { silent: false });
  
  if (!result.success) {
    log(`Failed to install ${moduleName}: ${result.error}`, 'error');
    return false;
  }
  
  log(`Successfully installed ${moduleName}`, 'success');
  return true;
}

function rebuildNativeModule(moduleName) {
  const modulePath = path.join(process.cwd(), 'node_modules', moduleName);
  
  if (!fs.existsSync(modulePath)) {
    log(`Module ${moduleName} not found, skipping rebuild`, 'warn');
    return false;
  }
  
  log(`Rebuilding ${moduleName}...`);
  const result = runCommand(`cd "${modulePath}" && node-gyp rebuild`, { silent: false });
  
  if (!result.success) {
    log(`Failed to rebuild ${moduleName}: ${result.error}`, 'error');
    return false;
  }
  
  log(`Successfully rebuilt ${moduleName}`, 'success');
  return true;
}

function copyModuleFromSubdependency(moduleName, sourcePath) {
  const targetPath = path.join(process.cwd(), 'node_modules', moduleName);
  const sourceFullPath = path.join(process.cwd(), 'node_modules', sourcePath, 'node_modules', moduleName);
  
  if (!fs.existsSync(sourceFullPath)) {
    log(`Source module not found at ${sourceFullPath}`, 'error');
    return false;
  }
  
  if (fs.existsSync(targetPath)) {
    log(`Target module already exists at ${targetPath}, removing...`);
    runCommand(`rm -rf "${targetPath}"`);
  }
  
  // Ensure parent directory exists
  const targetParent = path.dirname(targetPath);
  if (!fs.existsSync(targetParent)) {
    fs.mkdirSync(targetParent, { recursive: true });
  }
  
  log(`Copying ${moduleName} from ${sourceFullPath} to ${targetPath}...`);
  const result = runCommand(`cp -r "${sourceFullPath}" "${targetPath}"`);
  
  if (!result.success) {
    log(`Failed to copy ${moduleName}: ${result.error}`, 'error');
    return false;
  }
  
  log(`Successfully copied ${moduleName}`, 'success');
  return true;
}

function setupNativeModules() {
  log('Starting native module setup...');
  
  const requiredModules = [
    {
      name: 'drivelist',
      requiredFiles: ['build/Release/drivelist.node'],
      canInstall: true
    },
    {
      name: 'node-pty', 
      requiredFiles: ['build/Release/pty.node', 'build/Release/spawn-helper'],
      canInstall: true
    },
    {
      name: 'canvas',
      requiredFiles: ['build/Release/canvas.node'],
      canInstall: false, // Already in dependencies
      canRebuild: true
    },
    {
      name: '@vscode/ripgrep',
      requiredFiles: ['bin/rg'],
      canInstall: true,
      canRebuild: false
    }
  ];
  
  let allSuccessful = true;
  
  for (const module of requiredModules) {
    log(`Checking ${module.name}...`);
    const status = checkNativeModule(module.name, module.requiredFiles);
    
    if (!status.exists) {
      if (module.canInstall) {
        if (!installNativeModule(module.name)) {
          allSuccessful = false;
          continue;
        }
      } else {
        log(`Module ${module.name} not found and cannot be installed`, 'error');
        allSuccessful = false;
        continue;
      }
    }
    
    if (!status.built) {
      log(`${module.name} exists but not built, attempting to rebuild...`);
      
      if (module.canRebuild !== false) {
        if (!rebuildNativeModule(module.name)) {
          // Try to find in subdependencies and copy
          log(`Attempting to find ${module.name} in subdependencies...`);
          const found = copyModuleFromSubdependency(module.name, 'drivelist');
          if (!found) {
            allSuccessful = false;
          }
        }
      }
    } else {
      log(`${module.name} is properly built`, 'success');
    }
  }
  
  // Special handling for modules that might be in subdependencies
  const moduleLocations = [
    { name: '@vscode/ripgrep', copyFrom: 'drivelist' },
    { name: 'node-pty', copyFrom: 'drivelist' }
  ];
  
  for (const location of moduleLocations) {
    const status = checkNativeModule(location.name, requiredModules.find(m => m.name === location.name)?.requiredFiles || []);
    if (!status.exists || !status.built) {
      log(`Attempting to copy ${location.name} from ${location.copyFrom} subdependency...`);
      copyModuleFromSubdependency(location.name, location.copyFrom);
    }
  }
  
  return allSuccessful;
}

function testNativeModules() {
  log('Testing native modules...');
  
  const tests = [
    {
      name: 'canvas',
      test: 'const { createCanvas } = require("canvas"); createCanvas(200, 200); console.log("Canvas OK");'
    },
    {
      name: 'drivelist', 
      test: 'const drivelist = require("drivelist"); console.log("Drivelist OK");'
    }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const result = runCommand(`node -e '${test.test}'`, { silent: true });
      if (result.success) {
        log(`${test.name} test passed`, 'success');
      } else {
        log(`${test.name} test failed: ${result.error}`, 'error');
        allPassed = false;
      }
    } catch (error) {
      log(`${test.name} test failed: ${error.message}`, 'error');
      allPassed = false;
    }
  }
  
  return allPassed;
}

function main() {
  log('='.repeat(60));
  log('Native Module Setup Script');
  log('='.repeat(60));
  
  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`);
  
  if (parseInt(nodeVersion.split('.')[0].substring(1)) > 18) {
    log('Warning: Node.js version > 18 may cause issues with native modules', 'warn');
    log('Recommended: Use Node.js 18.x for better compatibility', 'warn');
  }
  
  // Setup native modules
  const setupSuccess = setupNativeModules();
  
  if (!setupSuccess) {
    log('Some native modules failed to setup properly', 'error');
    process.exit(1);
  }
  
  // Test native modules
  const testSuccess = testNativeModules();
  
  if (!testSuccess) {
    log('Some native modules failed testing', 'error');
    process.exit(1);
  }
  
  log('='.repeat(60));
  log('All native modules setup successfully!', 'success');
  log('='.repeat(60));
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { setupNativeModules, testNativeModules };