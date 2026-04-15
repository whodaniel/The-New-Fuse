#!/usr/bin/env node

/**
 * Direct SkIDEancer Build Script
 * Bypasses complex optimization for reliable builds
 */

const { spawn } = require('child_process');
const path = require('path');

function runSkIDEancerDirectBuild() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting direct SkIDEancer build...');
    
    const idePath = path.join(__dirname, '..', 'apps', 'ide-ide');
    
    console.log(`📁 Building in: ${idePath}`);
    console.log('🔧 Using NODE_OPTIONS="--max-old-space-size=4096"');
    
    const child = spawn('pnpm dlx', ['@ide/cli@1.59.0', 'build', '--mode', 'production'], {
      stdio: 'inherit',
      cwd: idePath,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096'
      }
    });

    // 20 minute timeout for SkIDEancer builds
    const timeout = setTimeout(() => {
      console.log('⏰ SkIDEancer build timed out after 20 minutes, killing...');
      child.kill('SIGKILL');
      reject(new Error('SkIDEancer build timed out'));
    }, 1200000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        console.log('✅ SkIDEancer build completed successfully!');
        resolve();
      } else {
        console.error(`❌ SkIDEancer build failed with code: ${code}`);
        reject(new Error(`Build failed with code: ${code}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.error('❌ SkIDEancer build process error:', err);
      reject(err);
    });
  });
}

async function main() {
  try {
    await runSkIDEancerDirectBuild();
    console.log('🎉 Direct SkIDEancer build completed successfully!');
  } catch (error) {
    console.error('💥 Direct SkIDEancer build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}