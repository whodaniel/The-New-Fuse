#!/usr/bin/env node

/**
 * Redis Migration Script
 * Migrates all Redis implementations to use the unified Redis service
 * from packages/infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RedisMigrationTool {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.unifiedServicePath = '@the-new-fuse/infrastructure';
    this.migrationLog = [];
    this.errors = [];
    
    // Patterns to identify Redis usage
    this.redisPatterns = [
      /import.*redis/gi,
      /from.*redis/gi,
      /require.*redis/gi,
      /new.*Redis/gi,
      /redis\.create/gi,
      /ioredis/gi
    ];

    // Files to exclude from migration
    this.excludePatterns = [
      /node_modules/,
      /dist/,
      /build/,
      /\.git/,
      /\.map$/,
      /packages\/infrastructure\/src\/redis\//,  // Don't migrate our unified service
      /REDIS_AUDIT_REPORT\.md/,
      /redis-migration\.js/
    ];

    // Common Redis service replacement patterns
    this.replacementPatterns = [
      {
        // Import pattern replacements
        find: /import\s+Redis\s+from\s+['"]ioredis['"];?/g,
        replace: "import { UnifiedRedisService } from '@the-new-fuse/infrastructure';"
      },
      {
        // Import pattern replacements for destructured imports
        find: /import\s*\{\s*Redis\s*\}\s+from\s+['"]ioredis['"];?/g,
        replace: "import { UnifiedRedisService } from '@the-new-fuse/infrastructure';"
      },
      {
        // RedisService class declaration replacements
        find: /class\s+RedisService/g,
        replace: "class LegacyRedisService"
      },
      {
        // Constructor Redis instantiation
        find: /new\s+Redis\s*\(/g,
        replace: "// MIGRATION TODO: Replace with UnifiedRedisService injection\n    // new Redis("
      }
    ];
  }

  /**
   * Main migration execution
   */
  async migrate() {
    console.log('🚀 Starting Redis Migration to Unified Service...\n');
    
    try {
      // Step 1: Find all Redis files
      console.log('📁 Step 1: Scanning for Redis usage...');
      const redisFiles = await this.findRedisFiles();
      console.log(`Found ${redisFiles.length} files with Redis usage\n`);

      // Step 2: Categorize files by migration complexity
      console.log('📊 Step 2: Categorizing files by migration complexity...');
      const categorizedFiles = this.categorizeFiles(redisFiles);
      this.printCategorizationResults(categorizedFiles);

      // Step 3: Create backup
      console.log('\n💾 Step 3: Creating backup...');
      this.createBackup();

      // Step 4: Update package.json files
      console.log('\n📦 Step 4: Updating package.json dependencies...');
      await this.updatePackageDependencies();

      // Step 5: Migrate simple cases first
      console.log('\n🔄 Step 5: Migrating simple import statements...');
      await this.migrateSimpleImports(categorizedFiles.simple);

      // Step 6: Generate migration TODOs for complex cases
      console.log('\n📝 Step 6: Generating migration guides for complex cases...');
      await this.generateMigrationGuides(categorizedFiles.complex);

      // Step 7: Create migration report
      console.log('\n📋 Step 7: Creating migration report...');
      this.generateMigrationReport(categorizedFiles);

      console.log('\n✅ Redis migration preparation completed!');
      console.log('\n📄 Check REDIS_MIGRATION_REPORT.md for details and next steps.');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.errors.push(error.message);
    }
  }

  /**
   * Find all files with Redis usage
   */
  async findRedisFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);
        
        // Skip excluded paths
        if (this.shouldExclude(relativePath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.isSourceFile(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (this.containsRedis(content)) {
              files.push({
                path: fullPath,
                relativePath,
                content,
                type: this.classifyFile(content, relativePath)
              });
            }
          } catch (error) {
            console.warn(`⚠️  Could not read file: ${relativePath}`);
          }
        }
      }
    };
    
    // Scan packages and apps directories
    const scanPaths = [
      path.join(this.rootDir, 'packages'),
      path.join(this.rootDir, 'apps')
    ];
    
    scanPaths.forEach(scanPath => {
      if (fs.existsSync(scanPath)) {
        scanDirectory(scanPath);
      }
    });
    
    return files;
  }

  /**
   * Check if file should be excluded
   */
  shouldExclude(relativePath) {
    return this.excludePatterns.some(pattern => pattern.test(relativePath));
  }

  /**
   * Check if file is a source file
   */
  isSourceFile(filename) {
    return /\.(ts|tsx|js|jsx)$/.test(filename) && !filename.endsWith('.d.ts');
  }

  /**
   * Check if content contains Redis usage
   */
  containsRedis(content) {
    return this.redisPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Classify file type for migration complexity
   */
  classifyFile(content, relativePath) {
    if (relativePath.includes('/infrastructure/')) return 'unified';
    if (content.includes('class') && content.includes('RedisService')) return 'service';
    if (content.includes('@Injectable')) return 'injectable';
    if (content.includes('new Redis(')) return 'instantiation';
    if (content.includes('import') && content.includes('redis')) return 'import';
    return 'unknown';
  }

  /**
   * Categorize files by migration complexity
   */
  categorizeFiles(files) {
    const categories = {
      unified: [],     // Our unified service - skip
      simple: [],      // Simple import/require statements  
      complex: [],     // Services, classes, complex usage
      apps: [],        // Application-level files
      backup: []       // Backup/legacy files
    };

    files.forEach(file => {
      if (file.relativePath.includes('backup/')) {
        categories.backup.push(file);
      } else if (file.relativePath.startsWith('apps/')) {
        categories.apps.push(file);
      } else if (file.relativePath.includes('infrastructure/src/redis/')) {
        categories.unified.push(file);
      } else if (file.type === 'import' && !file.content.includes('class') && !file.content.includes('@Injectable')) {
        categories.simple.push(file);
      } else {
        categories.complex.push(file);
      }
    });

    return categories;
  }

  /**
   * Print categorization results
   */
  printCategorizationResults(categories) {
    console.log(`📊 Migration Complexity Analysis:`);
    console.log(`   • Unified Service (skip): ${categories.unified.length} files`);
    console.log(`   • Simple Imports: ${categories.simple.length} files`);
    console.log(`   • Complex Services: ${categories.complex.length} files`);
    console.log(`   • Applications: ${categories.apps.length} files`);
    console.log(`   • Backup/Legacy: ${categories.backup.length} files`);
  }

  /**
   * Create backup of current state
   */
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.rootDir, `redis-migration-backup-${timestamp}`);
    
    // For now, just log the backup step
    console.log(`Backup would be created at: ${backupDir}`);
    console.log(`(Skipped in this run - using git for version control)`);
  }

  /**
   * Update package.json files to include infrastructure dependency
   */
  async updatePackageDependencies() {
    const packageJsonFiles = this.findPackageJsonFiles();
    let updated = 0;

    for (const pkgFile of packageJsonFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
        let modified = false;

        // Check if this package uses Redis and needs infrastructure dependency
        if (this.packageNeedsRedisDependency(pkgFile)) {
          if (!content.dependencies) content.dependencies = {};
          
          if (!content.dependencies[this.unifiedServicePath]) {
            content.dependencies[this.unifiedServicePath] = 'workspace:*';
            modified = true;
            this.migrationLog.push(`Added infrastructure dependency to ${path.relative(this.rootDir, pkgFile)}`);
          }
        }

        if (modified) {
          fs.writeFileSync(pkgFile, JSON.stringify(content, null, 2) + '\n');
          updated++;
        }
      } catch (error) {
        console.warn(`⚠️  Could not update ${pkgFile}: ${error.message}`);
      }
    }

    console.log(`Updated ${updated} package.json files`);
  }

  /**
   * Find all package.json files
   */
  findPackageJsonFiles() {
    const files = [];
    
    const scanForPackageJson = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.rootDir, fullPath);
          
          if (this.shouldExclude(relativePath)) continue;
          
          if (entry.name === 'package.json') {
            files.push(fullPath);
          } else if (entry.isDirectory()) {
            scanForPackageJson(fullPath);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };
    
    scanForPackageJson(this.rootDir);
    return files;
  }

  /**
   * Check if package needs Redis infrastructure dependency
   */
  packageNeedsRedisDependency(packageJsonPath) {
    const packageDir = path.dirname(packageJsonPath);
    
    // Don't add dependency to infrastructure package itself
    if (packageDir.includes('packages/infrastructure')) return false;
    
    // Check if any files in this package use Redis
    try {
      const hasRedis = this.directoryContainsRedis(packageDir);
      return hasRedis;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if directory contains Redis usage
   */
  directoryContainsRedis(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
          if (this.directoryContainsRedis(fullPath)) return true;
        } else if (this.isSourceFile(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (this.containsRedis(content)) return true;
          } catch (error) {
            // Ignore read errors
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    
    return false;
  }

  /**
   * Migrate simple import statements
   */
  async migrateSimpleImports(simpleFiles) {
    let migrated = 0;
    
    for (const file of simpleFiles) {
      try {
        let content = file.content;
        let modified = false;
        
        // Apply replacement patterns
        for (const pattern of this.replacementPatterns) {
          const newContent = content.replace(pattern.find, pattern.replace);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        }
        
        if (modified) {
          // Add migration comment at top
          const migrationComment = `// REDIS MIGRATION: This file has been automatically migrated to use UnifiedRedisService\n// TODO: Update service injection and method calls as needed\n\n`;
          content = migrationComment + content;
          
          fs.writeFileSync(file.path, content);
          this.migrationLog.push(`Migrated simple imports in ${file.relativePath}`);
          migrated++;
        }
      } catch (error) {
        this.errors.push(`Failed to migrate ${file.relativePath}: ${error.message}`);
      }
    }
    
    console.log(`Migrated ${migrated} files with simple imports`);
  }

  /**
   * Generate migration guides for complex cases
   */
  async generateMigrationGuides(complexFiles) {
    const guideContent = this.createComplexMigrationGuide(complexFiles);
    const guidePath = path.join(this.rootDir, 'REDIS_MIGRATION_GUIDE.md');
    
    fs.writeFileSync(guidePath, guideContent);
    console.log(`Generated migration guide: REDIS_MIGRATION_GUIDE.md`);
  }

  /**
   * Create complex migration guide content
   */
  createComplexMigrationGuide(complexFiles) {
    let guide = `# Redis Migration Guide - Complex Cases\n\n`;
    guide += `Generated on: ${new Date().toISOString()}\n\n`;
    guide += `This guide covers ${complexFiles.length} files that require manual migration.\n\n`;
    
    guide += `## Migration Steps\n\n`;
    guide += `1. **Update Imports**: Replace ioredis imports with UnifiedRedisService\n`;
    guide += `2. **Update Constructor**: Use dependency injection instead of manual instantiation\n`;
    guide += `3. **Update Methods**: Map old Redis methods to UnifiedRedisService methods\n`;
    guide += `4. **Update Configuration**: Use UnifiedRedisService configuration pattern\n`;
    guide += `5. **Test Integration**: Verify functionality after migration\n\n`;
    
    guide += `## File-by-File Migration Tasks\n\n`;
    
    complexFiles.forEach((file, index) => {
      guide += `### ${index + 1}. \`${file.relativePath}\`\n\n`;
      guide += `**Type**: ${file.type}\n\n`;
      guide += `**Current Issues**:\n`;
      
      // Analyze file for specific issues
      const issues = this.analyzeFileForIssues(file.content);
      issues.forEach(issue => {
        guide += `- ${issue}\n`;
      });
      
      guide += `\n**Migration Steps**:\n`;
      guide += `1. Replace imports: Change ioredis imports to UnifiedRedisService\n`;
      guide += `2. Update constructor: Use @Inject(UnifiedRedisService)\n`;
      guide += `3. Update method calls: Map to UnifiedRedisService API\n`;
      guide += `4. Remove manual Redis instantiation\n`;
      guide += `5. Test functionality\n\n`;
      
      guide += `---\n\n`;
    });
    
    return guide;
  }

  /**
   * Analyze file for specific migration issues
   */
  analyzeFileForIssues(content) {
    const issues = [];
    
    if (content.includes('new Redis(')) {
      issues.push('Manual Redis instantiation needs to be replaced with dependency injection');
    }
    
    if (content.includes('class RedisService') || content.includes('class Redis')) {
      issues.push('Custom Redis service class conflicts with unified service');
    }
    
    if (content.includes('@Injectable()') && content.includes('redis')) {
      issues.push('Injectable service needs to be refactored to use UnifiedRedisService');
    }
    
    if (content.includes('redis.quit()') || content.includes('client.quit()')) {
      issues.push('Connection management should be handled by UnifiedRedisService');
    }
    
    if (content.includes('redis.on(') || content.includes('client.on(')) {
      issues.push('Event handling needs to be updated for unified service patterns');
    }
    
    return issues;
  }

  /**
   * Generate migration report
   */
  generateMigrationReport(categorizedFiles) {
    let report = `# Redis Migration Report\n\n`;
    report += `Generated on: ${new Date().toISOString()}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Total files with Redis usage**: ${Object.values(categorizedFiles).flat().length}\n`;
    report += `- **Simple imports migrated**: ${categorizedFiles.simple.length}\n`;
    report += `- **Complex cases requiring manual migration**: ${categorizedFiles.complex.length}\n`;
    report += `- **Application files**: ${categorizedFiles.apps.length}\n`;
    report += `- **Legacy/backup files**: ${categorizedFiles.backup.length}\n\n`;
    
    if (this.migrationLog.length > 0) {
      report += `## Successfully Migrated\n\n`;
      this.migrationLog.forEach(log => {
        report += `- ${log}\n`;
      });
      report += `\n`;
    }
    
    if (this.errors.length > 0) {
      report += `## Errors\n\n`;
      this.errors.forEach(error => {
        report += `- ${error}\n`;
      });
      report += `\n`;
    }
    
    report += `## Next Steps\n\n`;
    report += `1. Review REDIS_MIGRATION_GUIDE.md for manual migration tasks\n`;
    report += `2. Test migrated services\n`;
    report += `3. Update imports in remaining complex files\n`;
    report += `4. Remove old Redis service files after migration\n`;
    report += `5. Update CI/CD configurations if needed\n\n`;
    
    const reportPath = path.join(this.rootDir, 'REDIS_MIGRATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
  }
}

// Execute migration if run directly
if (require.main === module) {
  const migrationTool = new RedisMigrationTool();
  migrationTool.migrate().catch(console.error);
}

module.exports = RedisMigrationTool;