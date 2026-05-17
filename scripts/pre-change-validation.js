#!/usr/bin/env node

/**
 * Pre-Change Validation Script
 * Runs comprehensive checks before making any structural changes
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class PreChangeValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  async validate() {
    this.log('Starting pre-change validation...');
    
    // Check Git status
    await this.checkGitStatus();
    
    // Validate TypeScript compilation
    await this.validateTypeScript();
    
    // Run tests
    await this.runTests();
    
    // Check package integrity
    await this.checkPackageIntegrity();
    
    // Validate environment
    await this.validateEnvironment();
    
    // Document current state
    await this.documentCurrentState();
    
    this.generateReport();
  }

  async checkGitStatus() {
    try {
      this.log('Checking Git status...');
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        this.results.warnings++;
        this.log('Warning: Working directory has uncommitted changes', 'warn');
      } else {
        this.results.passed++;
        this.log('Git working directory is clean');
      }
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Git status check failed: ${error.message}`);
    }
  }

  async validateTypeScript() {
    try {
      this.log('Validating TypeScript compilation...');
      execSync('pnpm run type-check', { stdio: 'pipe' });
      this.results.passed++;
      this.log('TypeScript compilation successful');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`TypeScript compilation failed: ${error.message}`);
    }
  }

  async runTests() {
    try {
      this.log('Running test suite...');
      const testResult = execSync('pnpm test -- --passWithNoTests', { encoding: 'utf8' });
      this.results.passed++;
      this.log('All tests passed');
      
      // Save test results for comparison
      fs.writeFileSync('validation-results/pre-change-tests.log', testResult);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Tests failed: ${error.message}`);
    }
  }

  async checkPackageIntegrity() {
    try {
      this.log('Checking package integrity...');
      
      // Check for package.json files
      const packageFiles = this.findFiles('.', 'package.json');
      this.log(`Found ${packageFiles.length} package.json files`);
      
      // Validate each package.json
      for (const file of packageFiles) {
        try {
          const content = JSON.parse(fs.readFileSync(file, 'utf8'));
          if (!content.name || !content.version) {
            this.results.warnings++;
            this.log(`Warning: ${file} missing name or version`, 'warn');
          }
        } catch (parseError) {
          this.results.failed++;
          this.results.errors.push(`Invalid JSON in ${file}: ${parseError.message}`);
        }
      }
      
      this.results.passed++;
      this.log('Package integrity check completed');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Package integrity check failed: ${error.message}`);
    }
  }

  async validateEnvironment() {
    try {
      this.log('Validating environment...');
      
      // Check required tools
      const tools = ['bun', 'git', 'node'];
      for (const tool of tools) {
        try {
          execSync(`which ${tool}`, { stdio: 'pipe' });
          this.log(`✓ ${tool} is available`);
        } catch {
          this.results.failed++;
          this.results.errors.push(`Required tool not found: ${tool}`);
        }
      }
      
      // Check Bun version
      const bunVersion = execSync('bun --version', { encoding: 'utf8' }).trim();
      this.log(`Bun version: ${bunVersion}`);
      
      this.results.passed++;
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Environment validation failed: ${error.message}`);
    }
  }

  async documentCurrentState() {
    try {
      this.log('Documenting current state...');
      
      // Create validation results directory
      if (!fs.existsSync('validation-results')) {
        fs.mkdirSync('validation-results');
      }
      
      // Document file structure
      const fileTree = execSync('find . -type f -name "*.ts" -o -name "*.js" -o -name "*.json" | head -100', { encoding: 'utf8' });
      fs.writeFileSync('validation-results/pre-change-file-structure.txt', fileTree);
      
      // Document package dependencies
      const deps = execSync('bun pm ls --all', { encoding: 'utf8' });
      fs.writeFileSync('validation-results/pre-change-dependencies.txt', deps);
      
      // Document import patterns
      const imports = execSync('grep -r "from [\'\\"]@" . --include="*.ts" --include="*.js" | head -50', { encoding: 'utf8' });
      fs.writeFileSync('validation-results/pre-change-imports.txt', imports);
      
      this.results.passed++;
      this.log('Current state documented');
    } catch (error) {
      this.results.warnings++;
      this.log(`Warning: Could not fully document current state: ${error.message}`, 'warn');
    }
  }

  findFiles(dir, filename) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(this.findFiles(filePath, filename));
      } else if (file === filename) {
        results.push(filePath);
      }
    });
    
    return results;
  }

  generateReport() {
    this.log('\n=== PRE-CHANGE VALIDATION REPORT ===');
    this.log(`Passed: ${this.results.passed}`);
    this.log(`Failed: ${this.results.failed}`);
    this.log(`Warnings: ${this.results.warnings}`);
    
    if (this.results.errors.length > 0) {
      this.log('\nErrors:');
      this.results.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      passed: this.results.passed,
      failed: this.results.failed,
      warnings: this.results.warnings,
      errors: this.results.errors,
      status: this.results.failed === 0 ? 'READY' : 'NOT_READY'
    };
    
    fs.writeFileSync('validation-results/pre-change-report.json', JSON.stringify(report, null, 2));
    
    if (this.results.failed > 0) {
      this.log('\n❌ VALIDATION FAILED - Do not proceed with reorganization', 'error');
      process.exit(1);
    } else {
      this.log('\n✅ VALIDATION PASSED - Ready to proceed with reorganization');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new PreChangeValidator();
validator.validate().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
