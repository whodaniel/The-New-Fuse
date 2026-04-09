#!/usr/bin/env node

import { execSync } from 'child_process';
import { rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

async function cleanup(args) {
  const isAll = args.includes('--all');
  const cleanDeps = isAll || args.includes('--deps');
  const cleanBuild = isAll || args.includes('--build');
  const cleanDocker = isAll || args.includes('--docker');
  const cleanCache = isAll || args.includes('--cache');

  try {
    if (cleanDeps || cleanCache) {
      console.log('Cleaning dependencies and cache...');
      await rm('node_modules', { recursive: true, force: true });
      execSync('yarn cache clean', { stdio: 'inherit' });
    }

    if (cleanBuild) {
      console.log('Cleaning build artifacts...');
      await Promise.all([
        rm('dist', { recursive: true, force: true }),
        rm('build', { recursive: true, force: true }),
        rm('.next', { recursive: true, force: true })
      ]);
    }

    if (cleanDocker) {
      console.log('Cleaning Docker artifacts...');
      try {
        execSync('docker-compose down --rmi all --volumes --remove-orphans', { stdio: 'inherit' });
      } catch (e) {
        console.log('No Docker artifacts to clean or Docker not available');
      }
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup(process.argv.slice(2));
