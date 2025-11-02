#!/usr/bin/env node

/**
 * Verify Browser Hub Build Script
 * Checks if Browser Hub IDE is properly built and functional
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${description}: ${filePath} (${Math.round(stats.size / 1024)}KB)`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - MISSING`);
    return false;
  }
}

function main() {
  console.log('🔍 Verifying Browser Hub IDE build...\n');
  
  const requiredFiles = [
    { path: 'apps/theia-ide/lib/build-info.json', desc: 'Build Info' },
    { path: 'apps/theia-ide/lib/backend/main.js', desc: 'Backend Main' },
    { path: 'apps/theia-ide/lib/frontend/index.html', desc: 'Frontend HTML' },
    { path: 'apps/theia-ide/src-gen/backend/main.js', desc: 'Generated Backend' },
    { path: 'apps/theia-ide/src-gen/frontend/index.html', desc: 'Generated Frontend' }
  ];
  
  let allPresent = true;
  
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allPresent = false;
    }
  }
  
  console.log('');
  
  if (allPresent) {
    console.log('✅ Theia IDE build verification PASSED');
    console.log('🎯 Theia is ready for Browser Hub integration');
    
    // Check build info details
    try {
      const buildInfoPath = path.join(__dirname, '..', 'apps/theia-ide/lib/build-info.json');
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      
      console.log('\n📋 Build Details:');
      console.log(`   • Version: ${buildInfo.version}`);
      console.log(`   • Built: ${buildInfo.timestamp}`);
      console.log(`   • Method: ${buildInfo.buildMethod}`);
      console.log(`   • Fully Functional: ${buildInfo.fullyFunctional ? 'YES' : 'NO'}`);
      
      if (buildInfo.features) {
        console.log(`   • Features: ${buildInfo.features.join(', ')}`);
      }
      
    } catch (error) {
      console.log('⚠️  Could not read build info details');
    }
    
    process.exit(0);
  } else {
    console.log('❌ Theia IDE build verification FAILED');
    console.log('💡 Run: bun run build:with-yarn-theia');
    process.exit(1);
  }
}

main();