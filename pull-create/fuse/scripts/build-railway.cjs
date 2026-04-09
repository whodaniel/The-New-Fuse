#!/usr/bin/env node

/**
 * Railway-Optimized Build Script
 *
 * Builds only what's needed for Railway deployment:
 * 1. Core shared packages (types, core, common, etc.)
 * 2. API Gateway application
 * 3. Frontend application (if needed)
 *
 * Skips test packages and dev-only packages to save time and memory.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class RailwayBuilder {
  constructor() {
    this.startTime = Date.now();
    this.verbose = process.env.BUILD_VERBOSE === 'true' || process.argv.includes('--verbose');
  }

  log(message, type = 'info') {
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARN]${colors.reset}`,
      step: `${colors.cyan}[STEP]${colors.reset}`,
    }[type] || '[INFO]';

    console.log(`${prefix} ${message}`);
  }

  exec(command, description) {
    this.log(`${description}...`, 'step');
    try {
      execSync(command, {
        cwd: process.cwd(),
        stdio: this.verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8',
      });
      this.log(`${description} completed`, 'success');
      return true;
    } catch (error) {
      this.log(`${description} failed`, 'error');
      if (this.verbose) {
        console.error(error.message);
      }
      return false;
    }
  }

  buildCorePackages() {
    this.log('Building core packages...', 'step');

    // Build essential packages in order
    const corePackages = [
      '@the-new-fuse/types',
      '@the-new-fuse/infrastructure',
      '@the-new-fuse/database',
      '@the-new-fuse/core',
      '@the-new-fuse/common',
      '@the-new-fuse/utils',
    ];

    for (const pkg of corePackages) {
      const success = this.exec(
        `pnpm turbo run build --filter=${pkg}`,
        `Build ${pkg}`
      );

      // Continue even if a package fails - some might not have build scripts
      if (!success) {
        this.log(`${pkg} build failed or has no build script, continuing...`, 'warning');
      }
    }

    this.log('Core packages build completed', 'success');
  }

  buildApiGateway() {
    this.log('Building API Gateway...', 'step');

    const success = this.exec(
      'pnpm turbo run build --filter=@the-new-fuse/api-gateway',
      'Build API Gateway'
    );

    if (!success) {
      throw new Error('API Gateway build failed - cannot continue');
    }

    // Verify output
    const distPath = path.join(process.cwd(), 'apps/api-gateway/dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('API Gateway dist directory not found after build');
    }

    const files = fs.readdirSync(distPath);
    this.log(`API Gateway built successfully (${files.length} files)`, 'success');
  }

  buildFrontend() {
    this.log('Building Frontend...', 'step');

    const success = this.exec(
      'pnpm turbo run build --filter=@the-new-fuse/frontend-app',
      'Build Frontend'
    );

    if (!success) {
      this.log('Frontend build failed', 'warning');
      return false;
    }

    // Verify output
    const distPath = path.join(process.cwd(), 'apps/frontend/dist');
    if (!fs.existsSync(distPath)) {
      this.log('Frontend dist directory not found after build', 'warning');
      return false;
    }

    const files = fs.readdirSync(distPath);
    this.log(`Frontend built successfully (${files.length} files)`, 'success');
    return true;
  }

  async build() {
    try {
      console.log(`\n${colors.bright}${colors.cyan}Railway Production Build${colors.reset}\n`);

      this.log('Starting Railway-optimized build...', 'info');

      // Build core packages
      this.buildCorePackages();

      // Build API Gateway (required)
      this.buildApiGateway();

      // Build Frontend (optional for API-only deployments)
      const buildFrontend = process.env.BUILD_FRONTEND !== 'false';
      if (buildFrontend) {
        this.buildFrontend();
      } else {
        this.log('Skipping frontend build (BUILD_FRONTEND=false)', 'info');
      }

      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

      console.log('\n' + '='.repeat(60));
      console.log(`${colors.bright}${colors.green}BUILD SUCCESSFUL${colors.reset}`);
      console.log(`Duration: ${duration}s`);
      console.log('='.repeat(60) + '\n');

      process.exit(0);

    } catch (error) {
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

      console.log('\n' + '='.repeat(60));
      console.log(`${colors.bright}${colors.red}BUILD FAILED${colors.reset}`);
      console.log(`Error: ${error.message}`);
      console.log(`Duration: ${duration}s`);
      console.log('='.repeat(60) + '\n');

      process.exit(1);
    }
  }
}

// Run the build
const builder = new RailwayBuilder();
builder.build();
