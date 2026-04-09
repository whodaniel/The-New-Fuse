#!/usr/bin/env node

/**
 * Standard Build Script
 * This script now runs a standard build process as memory optimization has been removed.
 */

const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: options.cwd || path.resolve(__dirname, '..'),
      shell: true,
      env: { 
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096',
        ...options.env
      }
    });

    const timeout = setTimeout(() => {
      console.log('⏰ Command timed out, killing process...');
      child.kill('SIGKILL');
      reject(new Error('Command timed out after 15 minutes'));
    }, 900000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code: ${code}`));
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  console.log('🚀 Starting standard build...');
  
  try {
    // The memory-optimized build logic has been removed.
    // We now run a standard turbo build.
    const buildCommand = 'turbo run build';
    console.log(`🔨 Executing: ${buildCommand}`);
    
    const buildArgs = buildCommand.split(' ').slice(1);
    await runCommand('turbo', buildArgs, {
      env: { ...process.env }
    });
    
    console.log('✅ Build completed successfully!');
    
  } catch (error) {
    console.error('❌ Standard build failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);