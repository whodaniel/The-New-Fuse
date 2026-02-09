#!/usr/bin/env node
/**
 * Build Status and Health Check Script
 * Provides comprehensive status of the build system
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkNativeModule(moduleName, binaryPath) {
  const exists = checkFileExists(binaryPath);
  return {
    name: moduleName,
    status: exists ? '✅' : '❌',
    path: binaryPath,
    exists
  };
}

function getSystemInfo() {
  try {
    const os = require('os');
    return {
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + 'GB',
      cpus: os.cpus().length
    };
  } catch (error) {
    return { error: error.message };
  }
}

function checkBuildArtifacts() {
  const artifacts = [
    { name: 'Theia Frontend Bundle', path: 'apps/theia-ide/lib/frontend/bundle.js' },
    { name: 'Theia Backend', path: 'apps/theia-ide/lib/backend/main.js' },
    { name: 'Database Types', path: 'packages/database/generated/prisma/index.d.ts' },
    { name: 'UI Components', path: 'packages/ui-consolidated/dist/index.js' }
  ];
  
  return artifacts.map(artifact => ({
    ...artifact,
    status: checkFileExists(artifact.path) ? '✅' : '❌',
    exists: checkFileExists(artifact.path)
  }));
}

function main() {
  console.log('🔍 Build System Status Report');
  console.log('=' .repeat(50));
  
  // System Information
  console.log('\n📊 System Information:');
  const systemInfo = getSystemInfo();
  Object.entries(systemInfo).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  // Native Modules Status
  console.log('\n🔧 Native Modules Status:');
  const nativeModules = [
    checkNativeModule('Ripgrep', 'node_modules/@vscode/ripgrep/bin/rg'),
    checkNativeModule('Node-pty', 'node_modules/node-pty/build/Release/spawn-helper'),
    checkNativeModule('Drivelist', 'node_modules/drivelist/build/Release/drivelist.node'),
    checkNativeModule('Keytar', 'node_modules/keytar/build/Release/keytar.node')
  ];
  
  nativeModules.forEach(module => {
    console.log(`   ${module.status} ${module.name}`);
  });
  
  // Build Artifacts Status
  console.log('\n📦 Build Artifacts Status:');
  const artifacts = checkBuildArtifacts();
  artifacts.forEach(artifact => {
    console.log(`   ${artifact.status} ${artifact.name}`);
  });
  
  // Build Scripts Status
  console.log('\n🚀 Available Build Commands:');
  console.log('   bun install          - Install dependencies with native module fixes');
  console.log('   bun run build         - Memory-optimized build (recommended)');
  console.log('   bun run build:fast    - Fast build for development');
  console.log('   bun run build:low-memory - Low memory build for constrained systems');
  console.log('   bun run build:staged  - Staged build to prevent memory issues');
  console.log('   bun run dev           - Memory-optimized development server');
  console.log('   bun run fix:native-modules - Fix native module issues');
  
  // Health Summary
  const allNativeModulesWorking = nativeModules.every(m => m.exists);
  const allArtifactsBuilt = artifacts.every(a => a.exists);
  
  console.log('\n🎯 Health Summary:');
  console.log(`   Native Modules: ${allNativeModulesWorking ? '✅ All Working' : '⚠️  Issues Detected'}`);
  console.log(`   Build Artifacts: ${allArtifactsBuilt ? '✅ All Present' : '⚠️  Missing Artifacts'}`);
  
  if (!allNativeModulesWorking) {
    console.log('\n💡 To fix native modules: bun run fix:native-modules');
  }
  
  if (!allArtifactsBuilt) {
    console.log('\n💡 To build missing artifacts: bun run build');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Build system status check complete!');
}

if (require.main === module) {
  main();
}

module.exports = { main, checkNativeModule, checkBuildArtifacts, getSystemInfo };