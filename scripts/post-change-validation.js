#!/usr/bin/env node

/**
 * Post-Change Validation Script
 * Runs comprehensive checks after structural changes to ensure functionality preservation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class PostChangeValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    this.preChangeReport = this.loadPreChangeReport();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  loadPreChangeReport() {
    try {
      const reportPath = 'validation-results/pre-change-report.json';
      if (fs.existsSync(reportPath)) {
        return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      }
    } catch (error) {
      this.log(`Warning: Could not load pre-change report: ${error.message}`, 'warn');
    }
    return null;
  }

  async validate() {
    this.log('Starting post-change validation...');
    
    // Validate TypeScript compilation
    await this.validateTypeScript();
    
    // Check import resolution
    await this.validateImportResolution();
    
    // Run tests and compare with pre-change
    await this.runTestsAndCompare();
    
    // Validate build process
    await this.validateBuild();
    
    // Check package integrity
    await this.validatePackageIntegrity();
    
    // Validate functionality
    await this.validateCoreFunctionality();
    
    // Performance comparison
    await this.comparePerformance();
    
    this.generateReport();
  }

  async validateTypeScript() {
    try {
      this.log('Validating TypeScript compilation...');
      const output = execSync('bun run type-check', { encoding: 'utf8' });
      this.results.passed++;
      this.log('TypeScript compilation successful');
      
      // Save output for analysis
      fs.writeFileSync('validation-results/post-change-typescript.log', output);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`TypeScript compilation failed: ${error.message}`);
    }
  }

  async validateImportResolution() {
    try {
      this.log('Validating import resolution...');
      
      // Check for common import issues
      const tsFiles = execSync('find . -name "*.ts" -type f | grep -v node_modules', { encoding: 'utf8' }).trim().split('\n');
      
      let unresolvedImports = 0;
      for (const file of tsFiles) {
        if (!file) continue;
        
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for problematic import patterns
          const problemPatterns = [
            /@tnf\//g,  // Old package names
            /from ['"]\.\/.*\.tsx?['"];/g,  // Missing extensions
          ];
          
          problemPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              unresolvedImports += matches.length;
              this.log(`Found ${matches.length} problematic imports in ${file}`, 'warn');
            }
          });
        } catch (readError) {
          // Skip files that can't be read
        }
      }
      
      if (unresolvedImports > 0) {
        this.results.warnings++;
        this.log(`Found ${unresolvedImports} potentially problematic imports`, 'warn');
      } else {
        this.results.passed++;
        this.log('Import resolution validation passed');
      }
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Import resolution validation failed: ${error.message}`);
    }
  }

  async runTestsAndCompare() {
    try {
      this.log('Running test suite...');
      const testResult = execSync('bun test --passWithNoTests', { encoding: 'utf8' });
      this.results.passed++;
      this.log('All tests passed');
      
      // Save test results
      fs.writeFileSync('validation-results/post-change-tests.log', testResult);
      
      // Compare with pre-change results if available
      if (fs.existsSync('validation-results/pre-change-tests.log')) {
        const preChangeTests = fs.readFileSync('validation-results/pre-change-tests.log', 'utf8');
        
        // Basic comparison (can be enhanced)
        const preTestCount = (preChangeTests.match(/✓/g) || []).length;
        const postTestCount = (testResult.match(/✓/g) || []).length;
        
        if (postTestCount >= preTestCount) {
          this.log(`Test count maintained: ${postTestCount} tests passed`);
        } else {
          this.results.warnings++;
          this.log(`Warning: Test count decreased from ${preTestCount} to ${postTestCount}`, 'warn');
        }
      }
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Tests failed: ${error.message}`);
    }
  }

  async validateBuild() {
    try {
      this.log('Validating build process...');
      const startTime = Date.now();
      
      execSync('bun run build', { stdio: 'pipe' });
      
      const buildTime = Date.now() - startTime;
      this.log(`Build completed in ${buildTime}ms`);
      
      this.results.passed++;
      this.log('Build validation successful');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Build failed: ${error.message}`);
    }
  }

  async validatePackageIntegrity() {
    try {
      this.log('Validating package integrity...');
      
      // Check that all internal packages use consistent naming
      const packageFiles = this.findFiles('.', 'package.json');
      const packages = [];
      
      for (const file of packageFiles) {
        try {
          const content = JSON.parse(fs.readFileSync(file, 'utf8'));
          packages.push({ file, name: content.name, version: content.version });
        } catch (parseError) {
          this.results.warnings++;
          this.log(`Warning: Could not parse ${file}`, 'warn');
        }
      }
      
      // Check for consistent naming pattern
      const internalPackages = packages.filter(pkg => pkg.name && pkg.name.startsWith('@the-new-fuse/'));
      const oldPackages = packages.filter(pkg => pkg.name && pkg.name.startsWith('@tnf/'));
      
      if (oldPackages.length > 0) {
        this.results.warnings++;
        this.log(`Warning: Found ${oldPackages.length} packages still using @tnf/ namespace`, 'warn');
      }
      
      this.log(`Found ${internalPackages.length} packages using @the-new-fuse/ namespace`);
      this.results.passed++;
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Package integrity validation failed: ${error.message}`);
    }
  }

  async validateCoreFunctionality() {
    try {
      this.log('Validating core functionality...');
      
      // Check that key files exist and are importable
      const criticalPaths = [
        'packages/types/src/index.ts',
        'packages/core/src/index.ts',
        'packages/shared/src/index.ts',
        'apps/api/src/main.ts'
      ];
      
      for (const filePath of criticalPaths) {
        if (fs.existsSync(filePath)) {
          this.log(`✓ ${filePath} exists`);
        } else {
          this.results.failed++;
          this.results.errors.push(`Critical file missing: ${filePath}`);
        }
      }
      
      // Try to import key modules (basic syntax check)
      const importChecks = [
        "import { BusinessEvent } from '@the-new-fuse/types';",
        "import { AgentLLMService } from '@the-new-fuse/core';"
      ];
      
      for (const importStatement of importChecks) {
        try {
          // Write temporary file to test import
          const tempFile = 'temp-import-test.ts';
          fs.writeFileSync(tempFile, importStatement);
          
          // Check if TypeScript can resolve it
          execSync(`bunx tsc --noEmit ${tempFile}`, { stdio: 'pipe' });
          this.log(`✓ Import resolved: ${importStatement}`);
          
          // Clean up
          fs.unlinkSync(tempFile);
        } catch (importError) {
          this.results.warnings++;
          this.log(`Warning: Import may not resolve: ${importStatement}`, 'warn');
          
          // Clean up temp file if it exists
          if (fs.existsSync('temp-import-test.ts')) {
            fs.unlinkSync('temp-import-test.ts');
          }
        }
      }
      
      this.results.passed++;
    } catch (error) {
      this.results.failed++;
      this.results.errors.push(`Core functionality validation failed: ${error.message}`);
    }
  }

  async comparePerformance() {
    try {
      this.log('Running performance comparison...');
      
      // Build time comparison
      const startTime = Date.now();
      execSync('bun run type-check', { stdio: 'pipe' });
      const typeCheckTime = Date.now() - startTime;
      
      this.log(`Type checking took ${typeCheckTime}ms`);
      
      // Save performance metrics
      const metrics = {
        typeCheckTime,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync('validation-results/post-change-performance.json', JSON.stringify(metrics, null, 2));
      
      this.results.passed++;
    } catch (error) {
      this.results.warnings++;
      this.log(`Warning: Performance comparison failed: ${error.message}`, 'warn');
    }
  }

  findFiles(dir, filename) {
    let results = [];
    try {
      const list = fs.readdirSync(dir);
      
      list.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            results = results.concat(this.findFiles(filePath, filename));
          } else if (file === filename) {
            results.push(filePath);
          }
        } catch (statError) {
          // Skip files that can't be accessed
        }
      });
    } catch (readdirError) {
      // Skip directories that can't be read
    }
    
    return results;
  }

  generateReport() {
    this.log('\n=== POST-CHANGE VALIDATION REPORT ===');
    this.log(`Passed: ${this.results.passed}`);
    this.log(`Failed: ${this.results.failed}`);
    this.log(`Warnings: ${this.results.warnings}`);
    
    if (this.results.errors.length > 0) {
      this.log('\nErrors:');
      this.results.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    // Compare with pre-change report
    if (this.preChangeReport) {
      this.log('\n=== COMPARISON WITH PRE-CHANGE ===');
      this.log(`Pre-change passed: ${this.preChangeReport.passed}`);
      this.log(`Post-change passed: ${this.results.passed}`);
      
      if (this.results.passed >= this.preChangeReport.passed) {
        this.log('✅ Validation results maintained or improved');
      } else {
        this.log('⚠️  Some validation results may have regressed');
      }
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      passed: this.results.passed,
      failed: this.results.failed,
      warnings: this.results.warnings,
      errors: this.results.errors,
      status: this.results.failed === 0 ? 'PASSED' : 'FAILED',
      preChangeComparison: this.preChangeReport ? {
        passedDelta: this.results.passed - this.preChangeReport.passed,
        failedDelta: this.results.failed - this.preChangeReport.failed
      } : null
    };
    
    fs.writeFileSync('validation-results/post-change-report.json', JSON.stringify(report, null, 2));
    
    if (this.results.failed > 0) {
      this.log('\n❌ VALIDATION FAILED - Consider rollback or additional fixes', 'error');
      process.exit(1);
    } else if (this.results.warnings > 0) {
      this.log('\n⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings before proceeding');
      process.exit(0);
    } else {
      this.log('\n✅ VALIDATION PASSED - Reorganization successful');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new PostChangeValidator();
validator.validate().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
