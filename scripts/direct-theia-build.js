#!/usr/bin/env node

/**
 * Direct Theia Build Script
 * Bypasses complex optimization for reliable builds
 */

const { spawn } = require('child_process');
const path = require('path');

function runTheiaDirectBuild() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting direct Theia build...');
    
    const theiaPath = path.join(__dirname, '..', 'apps', 'theia-ide');
    
    console.log(`📁 Building in: ${theiaPath}`);
    console.log('🔧 Using NODE_OPTIONS="--max-old-space-size=4096"');
    
    const child = spawn('bunx', ['@theia/cli@1.59.0', 'build', '--mode', 'production'], {
      stdio: 'inherit',
      cwd: theiaPath,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });

    // 20 minute timeout for Theia builds
    const timeout = setTimeout(() => {
      console.log('⏰ Theia build timed out after 20 minutes, killing...');
      child.kill('SIGKILL');
      reject(new Error('Theia build timed out'));
    }, 1200000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log('✅ Theia build completed successfully!');
        resolve();
      } else {
        console.error(`❌ Theia build failed with code: ${code}`);
        reject(new Error(`Build failed with code: ${code}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.error('❌ Theia build process error:', err);
      reject(err);
    });
  });
}

async function main() {
  try {
    await runTheiaDirectBuild();
    console.log('🎉 Direct Theia build completed successfully!');
  } catch (error) {
    console.error('💥 Direct Theia build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}