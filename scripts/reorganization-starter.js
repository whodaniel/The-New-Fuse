#!/usr/bin/env node

/**
 * Reorganization Starter Script
 * Initializes the comprehensive reorganization process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

class ReorganizationStarter {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  async promptUser(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async start() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                THE NEW FUSE REORGANIZATION               ║');
    console.log('║              Comprehensive Structure Update              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    
    console.log('\nThis process will:');
    console.log('• Standardize package naming across the workspace');
    console.log('• Unify TypeScript configurations');
    console.log('• Eliminate code duplication');
    console.log('• Optimize build processes for Bun');
    console.log('• Preserve 100% of existing functionality');
    
    const confirm = await this.promptUser('\nDo you want to proceed with the reorganization? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y') {
      this.log('Reorganization cancelled by user');
      this.rl.close();
      return;
    }

    await this.performPreChecks();
    await this.createBackups();
    await this.initializeReorganization();
    
    this.rl.close();
  }

  async performPreChecks() {
    this.log('Performing pre-reorganization checks...');
    
    try {
      // Check Git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        const proceed = await this.promptUser('Working directory has uncommitted changes. Continue? (y/N): ');
        if (proceed.toLowerCase() !== 'y') {
          this.log('Please commit or stash changes before proceeding');
          process.exit(1);
        }
      }

      // Check for required tools
      const requiredTools = ['bun', 'git', 'node'];
      for (const tool of requiredTools) {
        try {
          execSync(`which ${tool}`, { stdio: 'pipe' });
          this.log(`✓ ${tool} is available`);
        } catch {
          this.log(`✗ Required tool missing: ${tool}`, 'error');
          process.exit(1);
        }
      }

      // Run pre-change validation
      this.log('Running comprehensive pre-change validation...');
      try {
        execSync('node scripts/pre-change-validation.js', { stdio: 'inherit' });
      } catch (error) {
        this.log('Pre-change validation failed. Please fix issues before proceeding.', 'error');
        process.exit(1);
      }

    } catch (error) {
      this.log(`Pre-checks failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async createBackups() {
    this.log('Creating comprehensive backups...');
    
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      
      // Create backup tag
      execSync(`git tag backup-pre-reorganization-${today}`);
      this.log('✓ Created backup tag');

      // Create backup branch
      execSync(`git checkout -b backup-${today}`);
      execSync('git checkout -');
      this.log('✓ Created backup branch');

      // Create reorganization branch
      execSync('git checkout -b feature/comprehensive-reorganization');
      this.log('✓ Created reorganization branch');

      // Create validation results directory
      if (!fs.existsSync('validation-results')) {
        fs.mkdirSync('validation-results');
      }

      // Backup current configuration
      const configFiles = [
        'package.json',
        'tsconfig.json',
        'bun.lockb'
      ];

      for (const file of configFiles) {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, `validation-results/backup-${file}`);
          this.log(`✓ Backed up ${file}`);
        }
      }

    } catch (error) {
      this.log(`Backup creation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async initializeReorganization() {
    this.log('Initializing reorganization process...');
    
    console.log('\n=== REORGANIZATION PHASES ===');
    console.log('Phase 1: Package Standardization (Days 3-5)');
    console.log('Phase 2: TypeScript Configuration (Days 6-8)');
    console.log('Phase 3: Directory Structure (Days 9-12)');
    console.log('Phase 4: Configuration Management (Days 13-15)');
    console.log('Phase 5: Testing Infrastructure (Days 16-17)');
    console.log('Phase 6: Documentation & DX (Days 18-19)');
    console.log('Phase 7: Performance Optimization (Day 20)');
    console.log('Phase 8: Final Validation (Day 21)');

    console.log('\n=== AVAILABLE COMMANDS ===');
    console.log('bun run reorganize:phase1    - Start package standardization');
    console.log('bun run reorganize:phase2    - Start TypeScript unification');
    console.log('bun run reorganize:phase3    - Start directory optimization');
    console.log('bun run reorganize:validate  - Run post-change validation');
    console.log('bun run reorganize:rollback  - Access rollback procedures');

    // Create/update package.json scripts
    await this.addReorganizationScripts();

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Review the comprehensive plan: COMPREHENSIVE_REORGANIZATION_PLAN.md');
    console.log('2. Start with Phase 1: bun run reorganize:phase1');
    console.log('3. Follow validation checkpoints between phases');
    console.log('4. Use rollback procedures if needed');

    this.log('✅ Reorganization initialized successfully');
    this.log('Refer to COMPREHENSIVE_REORGANIZATION_PLAN.md for detailed instructions');
  }

  async addReorganizationScripts() {
    try {
      const packageJsonPath = 'package.json';
      let packageJson;

      if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      } else {
        packageJson = { scripts: {} };
      }

      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Add reorganization scripts
      const newScripts = {
        'reorganize:init': 'node scripts/reorganization-starter.js',
        'reorganize:phase1': 'node scripts/update-imports.js && bun run reorganize:validate',
        'reorganize:phase2': 'echo "Phase 2: TypeScript Configuration - See plan for manual steps"',
        'reorganize:phase3': 'echo "Phase 3: Directory Structure - See plan for manual steps"',
        'reorganize:validate': 'node scripts/post-change-validation.js',
        'reorganize:rollback': 'node scripts/rollback-procedure.js',
        'reorganize:emergency': 'node scripts/rollback-procedure.js emergency',
        'type-check': 'bunx tsc --noEmit',
        'lint': 'bunx eslint . --ext .ts,.js,.tsx,.jsx',
        'build:packages': 'bun run --filter="./packages/*" build',
        'build:apps': 'bun run --filter="./apps/*" build',
        'build': 'bun run build:packages && bun run build:apps'
      };

      Object.assign(packageJson.scripts, newScripts);

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      this.log('✓ Added reorganization scripts to package.json');

    } catch (error) {
      this.log(`Failed to add scripts: ${error.message}`, 'warn');
    }
  }
}

// Main execution
const starter = new ReorganizationStarter();
starter.start().catch(error => {
  console.error('Reorganization starter failed:', error);
  process.exit(1);
});
