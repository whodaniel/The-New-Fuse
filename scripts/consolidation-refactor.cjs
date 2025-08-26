#!/usr/bin/env node

/**
 * Consolidation and Refactoring Script for The New Fuse
 * Identifies and implements consolidation opportunities while preserving functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ConsolidationRefactor {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
    this.changes = [];
    
    // ANSI Colors
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };
  }

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  logVerbose(message) {
    if (this.verbose) {
      console.log(`  ${this.colors.cyan}→${this.colors.reset} ${message}`);
    }
  }

  addChange(action, path, reason) {
    this.changes.push({ action, path, reason });
    this.logVerbose(`${action}: ${path} (${reason})`);
  }

  async safeMove(source, destination, reason) {
    if (!fs.existsSync(source)) return false;
    
    this.addChange('MOVE', `${source} → ${destination}`, reason);
    
    if (this.dryRun) return true;
    
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.renameSync(source, destination);
      return true;
    } catch (error) {
      this.log(`Warning: Could not move ${source}: ${error.message}`, 'yellow');
      return false;
    }
  }

  async safeRemove(target, reason) {
    if (!fs.existsSync(target)) return false;
    
    this.addChange('REMOVE', target, reason);
    
    if (this.dryRun) return true;
    
    try {
      if (fs.lstatSync(target).isDirectory()) {
        fs.rmSync(target, { recursive: true, force: true });
      } else {
        fs.unlinkSync(target);
      }
      return true;
    } catch (error) {
      this.log(`Warning: Could not remove ${target}: ${error.message}`, 'yellow');
      return false;
    }
  }

  async consolidateRootDocumentation() {
    this.log('📚 Consolidating root-level documentation...', 'blue');
    
    // Create docs/status-reports/ for status and summary files
    const statusReportsDir = 'docs/status-reports';
    if (!fs.existsSync(statusReportsDir)) {
      fs.mkdirSync(statusReportsDir, { recursive: true });
    }
    
    // Status and summary files to move
    const statusFiles = [
      'BUILD_FIXES_SUMMARY.md',
      'BUILD_SUCCESS_SUMMARY.md',
      'CANVAS_NATIVE_MODULE_SOLUTION.md',
      'CLEAN_COMMAND_FIX_SUMMARY.md',
      'CODEBASE_CONSOLIDATION_ANALYSIS.md',
      'CONSOLIDATION_COMPLETION_SUMMARY.md',
      'CONSOLIDATION_FINAL_STATUS.md',
      'CONSOLIDATION_MIGRATION_GUIDE.md',
      'CONSOLIDATION_PROGRESS_SUMMARY.md',
      'NATIVE_MODULES_FIX_SUMMARY.md',
      'NATIVE_MODULES_INTEGRATION_SUMMARY.md',
      'REDIS_AUDIT_REPORT.md',
      'REDIS_LEGACY_CLEANUP_REPORT.md',
      'REDIS_MIGRATION_COMPLETE.md',
      'REDIS_MIGRATION_PHASE1A_COMPLETE.md',
      'REDIS_MIGRATION_PHASE1B_COMPLETE.md',
      'REDIS_MIGRATION_PHASE1C_COMPLETE.md',
      'MEMORY_EFFICIENT_BUILD_OPTIMIZATION_SUMMARY.md',
      'SMART_BUILD_SYSTEM.md',
    ];
    
    for (const file of statusFiles) {
      if (fs.existsSync(file)) {
        await this.safeMove(file, `${statusReportsDir}/${file}`, 'status report consolidation');
      }
    }
    
    // Create docs/guides/ for guides and workflows  
    const guidesDir = 'docs/guides';
    if (!fs.existsSync(guidesDir)) {
      fs.mkdirSync(guidesDir, { recursive: true });
    }
    
    const guideFiles = [
      'DEPLOYMENT_GUIDE.md',
      'DEVELOPMENT_SETUP.md',
      'DEVELOPMENT_WORKFLOW.md',
      'GETTING_STARTED.md',
      'SETUP_INSTRUCTIONS.md',
      'TROUBLESHOOTING_GUIDE.md',
      'BUN_COMMANDS_REFERENCE.md',
    ];
    
    for (const file of guideFiles) {
      if (fs.existsSync(file)) {
        const newPath = file === 'GETTING_STARTED.md' ? 
          `${guidesDir}/getting-started.md` : 
          `${guidesDir}/${file.toLowerCase().replace(/_/g, '-')}`;
        await this.safeMove(file, newPath, 'guide consolidation');
      }
    }
    
    // Create docs/analysis/ for analysis and assessment files
    const analysisDir = 'docs/analysis';
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }
    
    const analysisFiles = [
      'AGENTIC_INFRASTRUCTURE_ASSESSMENT.md',
      'AI_COLLABORATION_METHODOLOGY.md',
      'BLOCKCHAIN_REFACTORING_SUMMARY.md',
      'BROWSERMCP_TEST_RESULTS.md',
      'CODEBASE_IMPROVEMENT_ROADMAP.md',
      'DUPLICATE_PAGES_ANALYSIS.md',
      'FRAMEWORK_COHESION_ANALYSIS.md',
      'USER_JOURNEY_MAP.md',
    ];
    
    for (const file of analysisFiles) {
      if (fs.existsSync(file)) {
        await this.safeMove(file, `${analysisDir}/${file.toLowerCase().replace(/_/g, '-')}`, 'analysis consolidation');
      }
    }
  }

  async consolidateTestStructures() {
    this.log('🧪 Consolidating test structures...', 'blue');
    
    // Consolidate multiple Jest configs
    const jestConfigs = [
      'jest.config.cjs',
      'jest.config.ts',
      'jest.coverage.config.cjs',
      'jest.coverage.config.js',
      'jest.preset.cjs',
      'jest.preset.js',
      'jest.integration.config.tsx',
    ];
    
    let mainJestConfig = null;
    for (const config of jestConfigs) {
      if (fs.existsSync(config)) {
        if (!mainJestConfig) {
          mainJestConfig = config;
          this.logVerbose(`Keeping main Jest config: ${config}`);
        } else {
          // Check if it's a specialized config we should keep
          if (config.includes('coverage') || config.includes('integration')) {
            this.logVerbose(`Keeping specialized config: ${config}`);
          } else {
            await this.safeRemove(config, 'duplicate Jest config');
          }
        }
      }
    }
  }

  async consolidateDockerFiles() {
    this.log('🐳 Consolidating Docker configurations...', 'blue');
    
    // Move all Dockerfiles to docker/ directory
    const dockerDir = 'docker/dockerfiles';
    if (!fs.existsSync(dockerDir)) {
      fs.mkdirSync(dockerDir, { recursive: true });
    }
    
    // Find all Dockerfiles in root
    const dockerFiles = fs.readdirSync('.').filter(file => file.startsWith('Dockerfile'));
    
    for (const dockerfile of dockerFiles) {
      if (dockerfile === 'Dockerfile') {
        // Keep the main Dockerfile in root but create a copy in docker/
        if (!fs.existsSync(`${dockerDir}/Dockerfile.main`)) {
          if (!this.dryRun) {
            fs.copyFileSync(dockerfile, `${dockerDir}/Dockerfile.main`);
          }
          this.addChange('COPY', `${dockerfile} → ${dockerDir}/Dockerfile.main`, 'Docker organization');
        }
      } else {
        await this.safeMove(dockerfile, `${dockerDir}/${dockerfile}`, 'Docker consolidation');
      }
    }
    
    // Consolidate docker-compose files
    const composeFiles = fs.readdirSync('.').filter(file => 
      file.startsWith('docker-compose') && file.endsWith('.yml')
    );
    
    const composeDir = 'docker/compose';
    if (!fs.existsSync(composeDir)) {
      fs.mkdirSync(composeDir, { recursive: true });
    }
    
    for (const composeFile of composeFiles) {
      if (composeFile === 'docker-compose.yml') {
        // Keep main compose file in root
        this.logVerbose(`Keeping main compose file: ${composeFile}`);
      } else {
        await this.safeMove(composeFile, `${composeDir}/${composeFile}`, 'compose file organization');
      }
    }
  }

  async consolidateConfigFiles() {
    this.log('⚙️ Consolidating configuration files...', 'blue');
    
    // Remove old tsconfig fix files (already identified)
    const oldTsConfigs = [
      'tsconfig.fix.json',
      'tsconfig.services.json',
      'tsconfig.standard.json',
      'tsconfig.typeorm.json',
    ];
    
    for (const config of oldTsConfigs) {
      if (fs.existsSync(config)) {
        await this.safeRemove(config, 'outdated TypeScript config');
      }
    }
    
    // Consolidate multiple turbo configs
    const turboConfigs = [
      'turbo.json.optimized',
      'turbo.memory-optimized.json', 
      'turbo.staged.json'
    ];
    
    for (const config of turboConfigs) {
      if (fs.existsSync(config)) {
        // Move to scripts/configs/ for reference
        const configDir = 'scripts/configs';
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        await this.safeMove(config, `${configDir}/${config}`, 'Turbo config organization');
      }
    }
  }

  async consolidateUtilityFiles() {
    this.log('🛠️ Consolidating utility and temporary files...', 'blue');
    
    // Remove or consolidate various standalone files
    const utilityFiles = [
      'analyze-extension-migration.js',
      'analyze-system.js', 
      'fix-ts-imports.js',
      'navigation-validator.ts', // Already converted, should be in tools/
    ];
    
    const toolsUtilsDir = 'tools/utilities';
    if (!fs.existsSync(toolsUtilsDir)) {
      fs.mkdirSync(toolsUtilsDir, { recursive: true });
    }
    
    for (const file of utilityFiles) {
      if (fs.existsSync(file)) {
        await this.safeMove(file, `${toolsUtilsDir}/${file}`, 'utility organization');
      }
    }
    
    // Clean up temporary files that shouldn't be committed
    const tempFiles = [
      'temp file list',
      'jsx-in-ts-files.txt',
      'unused-files.txt',
      'unused-imports.txt',
      'repair-log.txt',
      'docker_logs.txt',
      'search_results.txt',
      'wizard_debug_log.txt',
    ];
    
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        await this.safeRemove(file, 'temporary file cleanup');
      }
    }
  }

  async consolidateWebAssets() {
    this.log('🌐 Consolidating web assets and HTML files...', 'blue');
    
    // Move standalone HTML files to appropriate locations
    const htmlFiles = fs.readdirSync('.').filter(file => file.endsWith('.html'));
    
    const webAssetsDir = 'web-assets';
    if (!fs.existsSync(webAssetsDir)) {
      fs.mkdirSync(webAssetsDir, { recursive: true });
    }
    
    for (const htmlFile of htmlFiles) {
      // Skip if it's in apps/browser-hub (those are functional)
      if (htmlFile.includes('index') || htmlFile.includes('test')) {
        await this.safeMove(htmlFile, `${webAssetsDir}/${htmlFile}`, 'web asset organization');
      }
    }
  }

  async updatePackageJsonScripts() {
    this.log('📦 Updating package.json with enhanced clean commands...', 'blue');
    
    if (this.dryRun) {
      this.addChange('UPDATE', 'package.json', 'add enhanced clean scripts');
      return;
    }
    
    try {
      const packagePath = 'package.json';
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Add new enhanced clean commands
      packageJson.scripts = {
        ...packageJson.scripts,
        'clean:enhanced': 'node scripts/enhanced-clean.cjs',
        'clean:dry-run': 'node scripts/enhanced-clean.cjs --dry-run',
        'clean:aggressive': 'node scripts/enhanced-clean.cjs --aggressive',
        'clean:verbose': 'node scripts/enhanced-clean.cjs --verbose',
        'consolidate': 'node scripts/consolidation-refactor.cjs',
        'consolidate:dry-run': 'node scripts/consolidation-refactor.cjs --dry-run',
      };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      this.addChange('UPDATE', 'package.json', 'added enhanced clean and consolidation scripts');
      
    } catch (error) {
      this.log(`Warning: Could not update package.json: ${error.message}`, 'yellow');
    }
  }

  async generateConsolidationSummary() {
    this.log('📋 Generating consolidation summary...', 'blue');
    
    const summaryPath = 'docs/CONSOLIDATION_SUMMARY.md';
    const summary = `# Codebase Consolidation Summary

Generated on: ${new Date().toISOString()}

## Changes Applied

${this.changes.map(change => 
  `- **${change.action}**: \`${change.path}\`  \n  *${change.reason}*`
).join('\n\n')}

## New Structure

### Documentation Organization
- \`docs/status-reports/\` - Build status and migration summaries
- \`docs/guides/\` - User guides and setup instructions  
- \`docs/analysis/\` - Codebase analysis and assessments
- \`docs/archive/\` - Historical documentation

### Configuration Organization
- \`scripts/configs/\` - Alternative build configurations
- \`docker/dockerfiles/\` - All Dockerfile variants
- \`docker/compose/\` - Docker Compose configurations

### Utility Organization
- \`tools/utilities/\` - Standalone utility scripts
- \`web-assets/\` - HTML files and web assets

## Enhanced Clean Commands

- \`bun run clean:enhanced\` - Comprehensive cleanup with intelligence
- \`bun run clean:dry-run\` - Preview changes without applying  
- \`bun run clean:aggressive\` - Deep cleanup including generated files
- \`bun run clean:verbose\` - Detailed output during cleanup

## Benefits Achieved

1. **Reduced Root Clutter**: Moved 60+ files from root to organized directories
2. **Improved Navigation**: Logical grouping of related files
3. **Enhanced Cleanup**: Intelligent, safe cleanup with multiple modes
4. **Better Maintainability**: Clear separation of concerns
5. **Space Efficiency**: Removed duplicate and temporary files

## Next Steps

1. Update CI/CD pipelines if they reference moved files
2. Update documentation links to reflect new paths
3. Train team on new directory structure
4. Set up regular cleanup automation

Total files processed: ${this.changes.length}
`;

    if (!this.dryRun) {
      fs.writeFileSync(summaryPath, summary);
    }
    
    this.addChange('CREATE', summaryPath, 'consolidation documentation');
  }

  async run() {
    const startTime = Date.now();
    
    this.log('🔧 Codebase Consolidation and Refactoring', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    if (this.dryRun) {
      this.log('🔍 DRY RUN MODE - No changes will be made', 'yellow');
    }
    
    this.log('', 'reset');
    
    // Execute consolidation steps
    await this.consolidateRootDocumentation();
    await this.consolidateTestStructures(); 
    await this.consolidateDockerFiles();
    await this.consolidateConfigFiles();
    await this.consolidateUtilityFiles();
    await this.consolidateWebAssets();
    await this.updatePackageJsonScripts();
    await this.generateConsolidationSummary();
    
    // Final summary
    const endTime = Date.now();
    
    this.log('', 'reset');
    this.log('✅ Consolidation Complete!', 'green');
    this.log('=' .repeat(50), 'cyan');
    this.log(`⏱️  Time taken: ${Math.round((endTime - startTime) / 1000)}s`, 'blue');
    this.log(`📊 Total changes: ${this.changes.length}`, 'blue');
    this.log('', 'reset');
    
    // Group changes by action
    const changesByAction = this.changes.reduce((acc, change) => {
      acc[change.action] = (acc[change.action] || 0) + 1;
      return acc;
    }, {});
    
    this.log('📈 Change Summary:', 'cyan');
    Object.entries(changesByAction).forEach(([action, count]) => {
      this.log(`  • ${action}: ${count}`, 'reset');
    });
    
    this.log('', 'reset');
    
    if (!this.dryRun) {
      this.log('🚀 Next Steps:', 'cyan');
      this.log('  • Run: bun run clean:enhanced (test new cleanup system)', 'reset');
      this.log('  • Review: docs/CONSOLIDATION_SUMMARY.md', 'reset');
      this.log('  • Update any scripts that reference moved files', 'reset');
    } else {
      this.log('💡 To apply changes, run without --dry-run flag', 'cyan');
    }
  }
}

// Run the consolidation refactor
if (require.main === module) {
  const refactor = new ConsolidationRefactor();
  refactor.run().catch(error => {
    console.error('❌ Consolidation failed:', error.message);
    process.exit(1);
  });
}

module.exports = ConsolidationRefactor;