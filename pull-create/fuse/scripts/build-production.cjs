#!/usr/bin/env node

/**
 * Production Build Script for The New Fuse
 *
 * This script orchestrates the complete build process for the monorepo:
 * 1. Validates environment and dependencies
 * 2. Optionally cleans previous builds
 * 3. Builds all shared packages in dependency order
 * 4. Builds all applications
 * 5. Validates build outputs
 * 6. Reports build status
 *
 * Usage:
 *   node scripts/build-production.cjs [options]
 *
 * Options:
 *   --clean         Clean previous builds before building
 *   --packages-only Build only packages
 *   --apps-only     Build only apps (requires packages to be built)
 *   --verbose       Enable verbose logging
 *   --skip-validation Skip build output validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class BuildOrchestrator {
  constructor(options = {}) {
    this.options = {
      clean: options.clean || false,
      packagesOnly: options.packagesOnly || false,
      appsOnly: options.appsOnly || false,
      verbose: options.verbose || false,
      skipValidation: options.skipValidation || false,
    };
    this.startTime = Date.now();
    this.buildResults = {
      packages: [],
      apps: [],
      errors: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[SUCCESS]${colors.reset}`,
      error: `${colors.red}[ERROR]${colors.reset}`,
      warning: `${colors.yellow}[WARN]${colors.reset}`,
      step: `${colors.cyan}[STEP]${colors.reset}`,
    }[type] || '[INFO]';

    console.log(`${prefix} ${message}`);
  }

  execCommand(command, description) {
    this.log(`${description}...`, 'step');
    try {
      const output = execSync(command, {
        cwd: process.cwd(),
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8',
      });
      this.log(`${description} completed`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`${description} failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async validateEnvironment() {
    this.log('Validating build environment...', 'step');

    // Check for pnpm
    try {
      execSync('pnpm --version', { stdio: 'pipe' });
      this.log('pnpm is available', 'success');
    } catch (error) {
      this.log('pnpm is not installed or not in PATH', 'error');
      throw new Error('pnpm is required for building');
    }

    // Check for turbo
    try {
      execSync('pnpm turbo --version', { stdio: 'pipe' });
      this.log('turbo is available', 'success');
    } catch (error) {
      this.log('turbo is not installed', 'error');
      throw new Error('turbo is required for building');
    }

    // Check for node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      this.log('node_modules not found - dependencies need to be installed', 'warning');
      this.log('Installing dependencies...', 'step');
      this.execCommand('pnpm install --frozen-lockfile', 'Dependency installation');
    }
  }

  cleanBuilds() {
    if (!this.options.clean) {
      this.log('Skipping clean (use --clean to clean before building)', 'info');
      return;
    }

    this.log('Cleaning previous builds...', 'step');
    const result = this.execCommand(
      'pnpm run clean',
      'Clean previous builds'
    );

    if (!result.success) {
      this.log('Clean failed but continuing...', 'warning');
    }
  }

  buildPackages() {
    this.log('Building all shared packages in dependency order...', 'step');

    const result = this.execCommand(
      'pnpm turbo run build --filter=./packages/*',
      'Build packages'
    );

    this.buildResults.packages.push({
      name: 'all-packages',
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      throw new Error('Package build failed');
    }

    this.log('All packages built successfully', 'success');
  }

  buildApps() {
    this.log('Building all applications...', 'step');

    const result = this.execCommand(
      'pnpm turbo run build --filter=./apps/*',
      'Build applications'
    );

    this.buildResults.apps.push({
      name: 'all-apps',
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      throw new Error('Application build failed');
    }

    this.log('All applications built successfully', 'success');
  }

  buildSpecificApp(appName) {
    this.log(`Building ${appName}...`, 'step');

    const result = this.execCommand(
      `pnpm turbo run build --filter=@the-new-fuse/${appName}`,
      `Build ${appName}`
    );

    this.buildResults.apps.push({
      name: appName,
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      throw new Error(`${appName} build failed`);
    }

    this.log(`${appName} built successfully`, 'success');
  }

  validateBuildOutputs() {
    if (this.options.skipValidation) {
      this.log('Skipping build validation', 'info');
      return;
    }

    this.log('Validating build outputs...', 'step');

    const appsToValidate = [
      { name: 'api-gateway', path: 'apps/api-gateway/dist' },
      { name: 'frontend', path: 'apps/frontend/dist' },
    ];

    const packagesToValidate = [
      { name: 'core', path: 'packages/core/dist' },
      { name: 'types', path: 'packages/types/dist' },
    ];

    let validationErrors = [];

    // Validate app builds
    appsToValidate.forEach(({ name, path: distPath }) => {
      const fullPath = path.join(process.cwd(), distPath);
      if (!fs.existsSync(fullPath)) {
        validationErrors.push(`${name}: dist directory not found at ${distPath}`);
      } else {
        const files = fs.readdirSync(fullPath);
        if (files.length === 0) {
          validationErrors.push(`${name}: dist directory is empty`);
        } else {
          this.log(`${name}: dist directory exists with ${files.length} files`, 'success');
        }
      }
    });

    // Validate package builds
    packagesToValidate.forEach(({ name, path: distPath }) => {
      const fullPath = path.join(process.cwd(), distPath);
      if (!fs.existsSync(fullPath)) {
        this.log(`${name}: dist directory not found (might not have build script)`, 'warning');
      } else {
        this.log(`${name}: dist directory exists`, 'success');
      }
    });

    if (validationErrors.length > 0) {
      this.log('Build validation found issues:', 'warning');
      validationErrors.forEach(error => this.log(`  - ${error}`, 'warning'));
    } else {
      this.log('All build outputs validated successfully', 'success');
    }
  }

  printBuildSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}${colors.cyan}BUILD SUMMARY${colors.reset}`);
    console.log('='.repeat(60));

    console.log(`\n${colors.bright}Duration:${colors.reset} ${duration}s`);

    if (this.buildResults.packages.length > 0) {
      console.log(`\n${colors.bright}Packages:${colors.reset}`);
      this.buildResults.packages.forEach(pkg => {
        const status = pkg.success
          ? `${colors.green}✓${colors.reset}`
          : `${colors.red}✗${colors.reset}`;
        console.log(`  ${status} ${pkg.name}`);
        if (!pkg.success && pkg.error) {
          console.log(`    ${colors.red}Error: ${pkg.error}${colors.reset}`);
        }
      });
    }

    if (this.buildResults.apps.length > 0) {
      console.log(`\n${colors.bright}Applications:${colors.reset}`);
      this.buildResults.apps.forEach(app => {
        const status = app.success
          ? `${colors.green}✓${colors.reset}`
          : `${colors.red}✗${colors.reset}`;
        console.log(`  ${status} ${app.name}`);
        if (!app.success && app.error) {
          console.log(`    ${colors.red}Error: ${app.error}${colors.reset}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  async build() {
    try {
      console.log(`\n${colors.bright}${colors.cyan}The New Fuse - Production Build${colors.reset}\n`);

      // Step 1: Validate environment
      await this.validateEnvironment();

      // Step 2: Clean if requested
      this.cleanBuilds();

      // Step 3: Build packages (unless apps-only)
      if (!this.options.appsOnly) {
        this.buildPackages();
      }

      // Step 4: Build apps (unless packages-only)
      if (!this.options.packagesOnly) {
        this.buildApps();
      }

      // Step 5: Validate outputs
      this.validateBuildOutputs();

      // Step 6: Print summary
      this.printBuildSummary();

      this.log('Build completed successfully!', 'success');
      process.exit(0);

    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      this.buildResults.errors.push(error.message);
      this.printBuildSummary();
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    clean: args.includes('--clean'),
    packagesOnly: args.includes('--packages-only'),
    appsOnly: args.includes('--apps-only'),
    verbose: args.includes('--verbose'),
    skipValidation: args.includes('--skip-validation'),
  };
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const orchestrator = new BuildOrchestrator(options);
  orchestrator.build();
}

module.exports = BuildOrchestrator;
