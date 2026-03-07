#!/usr/bin/env node

/**
 * Update Imports Script
 * Systematically updates import paths from @tnf/ to @the-new-fuse/
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ImportUpdater {
  constructor() {
    this.replacements = {
      '@tnf/types': '@the-new-fuse/types',
      '@tnf/core': '@the-new-fuse/core',
      '@tnf/shared': '@the-new-fuse/shared'
    };
    
    this.stats = {
      filesProcessed: 0,
      replacementsMade: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  async updateImports() {
    this.log('Starting import path updates...');
    
    // Find all TypeScript and JavaScript files
    const files = this.findSourceFiles();
    this.log(`Found ${files.length} source files to process`);
    
    // Process each file
    for (const file of files) {
      await this.processFile(file);
    }
    
    // Update package.json files
    await this.updatePackageJsonFiles();
    
    this.generateReport();
  }

  findSourceFiles() {
    try {
      const output = execSync('find . -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \\) ! -path "./node_modules/*" ! -path "./dist/*" ! -path "./.git/*"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch (error) {
      this.log(`Error finding source files: ${error.message}`, 'error');
      return [];
    }
  }

  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let replacements = 0;
      
      // Apply each replacement
      for (const [oldImport, newImport] of Object.entries(this.replacements)) {
        const regex = new RegExp(this.escapeRegex(oldImport), 'g');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, newImport);
          replacements += matches.length;
          modified = true;
        }
      }
      
      // Write back if modified
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        this.log(`Updated ${replacements} imports in ${filePath}`);
        this.stats.replacementsMade += replacements;
      }
      
      this.stats.filesProcessed++;
    } catch (error) {
      this.stats.errors.push(`Error processing ${filePath}: ${error.message}`);
      this.log(`Error processing ${filePath}: ${error.message}`, 'error');
    }
  }

  async updatePackageJsonFiles() {
    try {
      this.log('Updating package.json files...');
      
      const packageFiles = this.findFiles('.', 'package.json');
      
      for (const file of packageFiles) {
        try {
          const content = JSON.parse(fs.readFileSync(file, 'utf8'));
          let modified = false;
          
          // Update package name if it uses old naming
          if (content.name && content.name.startsWith('@tnf/')) {
            content.name = content.name.replace('@tnf/', '@the-new-fuse/');
            modified = true;
          }
          
          // Update dependencies
          const depSections = ['dependencies', 'devDependencies', 'peerDependencies'];
          for (const section of depSections) {
            if (content[section]) {
              for (const [oldName, newName] of Object.entries(this.replacements)) {
                if (content[section][oldName]) {
                  content[section][newName] = content[section][oldName];
                  delete content[section][oldName];
                  modified = true;
                }
              }
            }
          }
          
          if (modified) {
            fs.writeFileSync(file, JSON.stringify(content, null, 2) + '\n', 'utf8');
            this.log(`Updated package references in ${file}`);
          }
        } catch (parseError) {
          this.stats.errors.push(`Error parsing ${file}: ${parseError.message}`);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Error updating package.json files: ${error.message}`);
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
          
          if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
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

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  generateReport() {
    this.log('\n=== IMPORT UPDATE REPORT ===');
    this.log(`Files processed: ${this.stats.filesProcessed}`);
    this.log(`Replacements made: ${this.stats.replacementsMade}`);
    this.log(`Errors encountered: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      this.log('\nErrors:');
      this.stats.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      filesProcessed: this.stats.filesProcessed,
      replacementsMade: this.stats.replacementsMade,
      errors: this.stats.errors,
      replacements: this.replacements
    };
    
    if (!fs.existsSync('validation-results')) {
      fs.mkdirSync('validation-results');
    }
    
    fs.writeFileSync('validation-results/import-update-report.json', JSON.stringify(report, null, 2));
    
    if (this.stats.errors.length > 0) {
      this.log('\n⚠️  Import updates completed with errors - Review before proceeding', 'warn');
    } else {
      this.log('\n✅ Import updates completed successfully');
    }
  }
}

// Run updater
const updater = new ImportUpdater();
updater.updateImports().catch(error => {
  console.error('Import update script failed:', error);
  process.exit(1);
});
