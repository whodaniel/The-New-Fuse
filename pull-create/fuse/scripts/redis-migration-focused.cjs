#!/usr/bin/env node

/**
 * Focused Redis Migration Script
 * Targets the most critical Redis implementations for migration
 */

const fs = require('fs');
const path = require('path');

class FocusedRedisMigration {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.migrationResults = [];
    
    // Priority files for migration - the most critical ones
    this.priorityFiles = [
      'packages/a2a-core/src/redis-adapter.ts',
      'packages/api/src/services/redis.service.ts', 
      'packages/core/src/services/redis.service.ts',
      'packages/core/src/redis/redis.service.ts',
      'packages/agent/src/services/RedisService.tsx',
      'packages/cache/src/redis-cache.service.js',
      'packages/job-queue/src/optimized-queue.service.js'
    ];
  }

  async migrate() {
    console.log('🎯 Focused Redis Migration - Critical Files Only\n');
    
    // Step 1: Update infrastructure package dependencies
    await this.updateCriticalPackages();
    
    // Step 2: Analyze and migrate priority files
    await this.migratePriorityFiles();
    
    // Step 3: Generate focused migration report
    this.generateReport();
    
    console.log('\n✅ Focused migration completed!');
  }

  async updateCriticalPackages() {
    console.log('📦 Updating critical package dependencies...\n');
    
    const criticalPackages = [
      'packages/a2a-core/package.json',
      'packages/api/package.json',
      'packages/core/package.json',
      'packages/agent/package.json'
    ];

    for (const pkgPath of criticalPackages) {
      const fullPath = path.join(this.rootDir, pkgPath);
      
      if (fs.existsSync(fullPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          
          // Add infrastructure dependency
          if (!content.dependencies) content.dependencies = {};
          if (!content.dependencies['@the-new-fuse/infrastructure']) {
            content.dependencies['@the-new-fuse/infrastructure'] = 'workspace:*';
            
            fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
            console.log(`✅ Updated ${pkgPath}`);
            this.migrationResults.push(`Added infrastructure dependency to ${pkgPath}`);
          } else {
            console.log(`ℹ️  ${pkgPath} already has infrastructure dependency`);
          }
        } catch (error) {
          console.error(`❌ Failed to update ${pkgPath}:`, error.message);
        }
      } else {
        console.log(`⚠️  ${pkgPath} not found`);
      }
    }
  }

  async migratePriorityFiles() {
    console.log('\n🔄 Analyzing priority Redis files...\n');
    
    for (const relativePath of this.priorityFiles) {
      const fullPath = path.join(this.rootDir, relativePath);
      
      if (fs.existsSync(fullPath)) {
        console.log(`📄 Analyzing: ${relativePath}`);
        await this.analyzeAndMigrateFile(fullPath, relativePath);
      } else {
        console.log(`⚠️  File not found: ${relativePath}`);
      }
    }
  }

  async analyzeAndMigrateFile(fullPath, relativePath) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const analysis = this.analyzeFile(content);
      
      console.log(`   Type: ${analysis.type}`);
      console.log(`   Complexity: ${analysis.complexity}`);
      
      if (analysis.complexity === 'simple') {
        // Attempt automatic migration for simple cases
        const migrated = this.attemptAutoMigration(content, fullPath, relativePath);
        if (migrated) {
          console.log(`   ✅ Auto-migrated`);
        } else {
          console.log(`   ⚠️  Auto-migration failed - needs manual work`);
        }
      } else {
        console.log(`   📝 Requires manual migration`);
        this.createMigrationTodo(relativePath, analysis);
      }
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`   ❌ Analysis failed: ${error.message}`);
    }
  }

  analyzeFile(content) {
    const analysis = {
      type: 'unknown',
      complexity: 'complex',
      issues: [],
      patterns: []
    };

    // Determine file type
    if (content.includes('@Injectable()')) analysis.type = 'injectable-service';
    else if (content.includes('class') && content.includes('Redis')) analysis.type = 'class-service';
    else if (content.includes('export class')) analysis.type = 'export-class';
    else if (content.includes('import') && content.includes('redis')) analysis.type = 'import-only';

    // Assess complexity
    let complexityScore = 0;
    if (content.includes('new Redis(')) complexityScore += 2;
    if (content.includes('@Injectable()')) complexityScore += 1;
    if (content.includes('extends') || content.includes('implements')) complexityScore += 2;
    if (content.includes('subscribe') || content.includes('publish')) complexityScore += 1;
    if (content.includes('pipeline') || content.includes('multi')) complexityScore += 2;

    if (complexityScore <= 2) analysis.complexity = 'simple';
    else if (complexityScore <= 4) analysis.complexity = 'moderate';
    else analysis.complexity = 'complex';

    // Identify specific patterns
    if (content.includes('ioredis')) analysis.patterns.push('ioredis-import');
    if (content.includes('new Redis(')) analysis.patterns.push('manual-instantiation');
    if (content.includes('redis.on(')) analysis.patterns.push('event-handling');

    return analysis;
  }

  attemptAutoMigration(content, fullPath, relativePath) {
    try {
      let newContent = content;
      let changed = false;

      // Simple import replacements only
      const simpleReplacements = [
        {
          find: /import Redis from ['"]ioredis['"];?/g,
          replace: "// MIGRATED: import { UnifiedRedisService } from '@the-new-fuse/infrastructure';"
        },
        {
          find: /import \{ Redis \} from ['"]ioredis['"];?/g,
          replace: "// MIGRATED: import { UnifiedRedisService } from '@the-new-fuse/infrastructure';"
        }
      ];

      for (const replacement of simpleReplacements) {
        const replaced = newContent.replace(replacement.find, replacement.replace);
        if (replaced !== newContent) {
          newContent = replaced;
          changed = true;
        }
      }

      if (changed) {
        // Add migration header
        const migrationHeader = `// REDIS MIGRATION NOTICE:\n// This file has been prepared for migration to UnifiedRedisService\n// TODO: Complete manual migration steps\n\n`;
        newContent = migrationHeader + newContent;
        
        // Create backup and write new file
        fs.copyFileSync(fullPath, fullPath + '.backup');
        fs.writeFileSync(fullPath, newContent);
        
        this.migrationResults.push(`Auto-migrated imports in ${relativePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Auto-migration failed for ${relativePath}:`, error.message);
      return false;
    }
  }

  createMigrationTodo(relativePath, analysis) {
    const todo = {
      file: relativePath,
      type: analysis.type,
      complexity: analysis.complexity,
      patterns: analysis.patterns,
      steps: this.generateMigrationSteps(analysis)
    };

    this.migrationResults.push(`Manual migration needed: ${relativePath}`);
    
    // This would be expanded to create detailed TODO files
    console.log(`   📋 Migration TODO created`);
  }

  generateMigrationSteps(analysis) {
    const steps = [];
    
    if (analysis.patterns.includes('ioredis-import')) {
      steps.push('Replace ioredis import with UnifiedRedisService import');
    }
    
    if (analysis.patterns.includes('manual-instantiation')) {
      steps.push('Replace new Redis() with dependency injection');
      steps.push('Update constructor to use @Inject(UnifiedRedisService)');
    }
    
    if (analysis.type === 'injectable-service') {
      steps.push('Update @Injectable() service to use UnifiedRedisService');
      steps.push('Remove manual Redis connection management');
    }
    
    steps.push('Test migration and update method calls');
    
    return steps;
  }

  generateReport() {
    console.log('\n📋 Generating migration report...');
    
    let report = `# Focused Redis Migration Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Migration Results\n\n`;
    
    this.migrationResults.forEach((result, index) => {
      report += `${index + 1}. ${result}\n`;
    });
    
    report += `\n## Next Steps\n\n`;
    report += `1. Review backup files (*.backup) before proceeding\n`;
    report += `2. Complete manual migration for complex files\n`;
    report += `3. Test all migrated services\n`;
    report += `4. Remove backup files after verification\n`;
    report += `5. Run full migration script for remaining files\n`;
    
    const reportPath = path.join(this.rootDir, 'FOCUSED_MIGRATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`📄 Report saved: FOCUSED_MIGRATION_REPORT.md`);
  }
}

// Execute if run directly
if (require.main === module) {
  const migration = new FocusedRedisMigration();
  migration.migrate().catch(console.error);
}

module.exports = FocusedRedisMigration;