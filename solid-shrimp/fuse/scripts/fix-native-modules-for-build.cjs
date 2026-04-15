#!/usr/bin/env node

/**
 * Fix Native Modules for Build
 * Specifically handles drivelist and keytar for Theia builds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing native modules for Theia build...');

function buildNativeModule(moduleName, modulePath) {
  console.log(`🛠️  Building ${moduleName}...`);
  
  if (!fs.existsSync(modulePath)) {
    console.log(`❌ ${moduleName} package not found at ${modulePath}`);
    return false;
  }
  
  const originalCwd = process.cwd();
  
  try {
    process.chdir(modulePath);
    
    // Check if package.json has install script
    const packageJsonPath = path.join(modulePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Try install script first if it exists
      if (packageJson.scripts && packageJson.scripts.install) {
        try {
          console.log(`   Running install script for ${moduleName}...`);
          execSync('npm run install', { stdio: 'inherit', timeout: 120000 });
          process.chdir(originalCwd);
          console.log(`✅ ${moduleName} built successfully via install script`);
          return true;
        } catch (error) {
          console.log(`   Install script failed, trying node-gyp...`);
        }
      }
    }
    
    // Try node-gyp rebuild
    try {
      execSync('npx node-gyp rebuild', { stdio: 'inherit', timeout: 120000 });
      process.chdir(originalCwd);
      console.log(`✅ ${moduleName} built successfully via node-gyp`);
      return true;
    } catch (error) {
      console.log(`   npx node-gyp failed, trying direct node-gyp...`);
      try {
        execSync('node-gyp rebuild', { stdio: 'inherit', timeout: 120000 });
        process.chdir(originalCwd);
        console.log(`✅ ${moduleName} built successfully via direct node-gyp`);
        return true;
      } catch (error2) {
        process.chdir(originalCwd);
        console.log(`❌ Failed to build ${moduleName}:`, error2.message);
        return false;
      }
    }
    
  } catch (error) {
    process.chdir(originalCwd);
    console.log(`❌ Failed to build ${moduleName}:`, error.message);
    return false;
  }
}

function checkNativeModule(moduleName, binaryPath) {
  return fs.existsSync(binaryPath);
}

function main() {
  const rootPath = path.resolve(__dirname, '..');
  const nodeModulesPath = path.join(rootPath, 'node_modules');
  
  const modules = [
    {
      name: 'drivelist',
      path: path.join(nodeModulesPath, 'drivelist'),
      binary: path.join(nodeModulesPath, 'drivelist', 'build', 'Release', 'drivelist.node')
    },
    {
      name: 'keytar',
      path: path.join(nodeModulesPath, 'keytar'),
      binary: path.join(nodeModulesPath, 'keytar', 'build', 'Release', 'keytar.node')
    }
  ];
  
  let allFixed = true;
  
  for (const module of modules) {
    if (!checkNativeModule(module.name, module.binary)) {
      console.log(`⚠️  ${module.name} native binary missing, attempting to build...`);
      if (!buildNativeModule(module.name, module.path)) {
        allFixed = false;
      }
    } else {
      console.log(`✅ ${module.name} native binary already exists`);
    }
  }
  
  if (allFixed) {
    console.log('\n🎉 All required native modules are ready for build!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some native modules failed to build');
    console.log('💡 The build may still succeed if these modules are optional');
    process.exit(0); // Don't fail the build process
  }
}

try {
  main();
} catch (error) {
  console.error('❌ Native module fix failed:', error.message);
  process.exit(0); // Don't fail the build process
}