#!/usr/bin/env node

/**
 * Enhanced Clean Command for The New Fuse
 * Provides comprehensive, intelligent, and safe development environment cleanup
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class EnhancedCleaner {
  constructor() {
    this.stats = {
      processes: 0,
      ports: 0,
      dirs: 0,
      files: 0,
      sizeSaved: 0
    };
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
    this.aggressive = process.argv.includes('--aggressive');
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logVerbose(message) {
    if (this.verbose) {
      console.log(`  ${colors.cyan}→${colors.reset} ${message}`);
    }
  }

  async getDirSize(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) return 0;
      const result = execSync(`du -sk "${dirPath}" 2>/dev/null | cut -f1`, { encoding: 'utf8' });
      return parseInt(result.trim()) * 1024; // Convert KB to bytes
    } catch {
      return 0;
    }
  }

  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  async safeRemove(targetPath, description) {
    try {
      if (!fs.existsSync(targetPath)) return;
      
      const size = await this.getDirSize(targetPath);
      this.logVerbose(`${description}: ${targetPath} (${this.formatBytes(size)})`);
      
      if (this.dryRun) {
        this.log(`[DRY RUN] Would remove: ${targetPath}`, 'yellow');
        return;
      }
      
      if (fs.lstatSync(targetPath).isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        this.stats.dirs++;
      } else {
        fs.unlinkSync(targetPath);
        this.stats.files++;
      }
      
      this.stats.sizeSaved += size;
    } catch (error) {
      this.logVerbose(`Warning: Could not remove ${targetPath}: ${error.message}`);
    }
  }

  async killProcesses(patterns, description) {
    this.log(`🔄 Terminating ${description}...`, 'blue');
    let killed = 0;
    
    for (const pattern of patterns) {
      try {
        const pids = execSync(`pgrep -f "${pattern}" 2>/dev/null || true`, { encoding: 'utf8' });
        if (pids.trim()) {
          const pidList = pids.trim().split('\n').filter(pid => pid);
          this.logVerbose(`Found ${pidList.length} processes matching: ${pattern}`);
          
          if (!this.dryRun && pidList.length > 0) {
            // Graceful termination first
            try {
              execSync(`kill -TERM ${pidList.join(' ')} 2>/dev/null || true`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Force kill if still running
              const remaining = execSync(`pgrep -f "${pattern}" 2>/dev/null || true`, { encoding: 'utf8' });
              if (remaining.trim()) {
                execSync(`kill -KILL ${remaining.trim().split('\n').join(' ')} 2>/dev/null || true`);
              }
            } catch (error) {
              this.logVerbose(`Warning during process cleanup: ${error.message}`);
            }
          }
          killed += pidList.length;
        }
      } catch (error) {
        this.logVerbose(`No processes found for pattern: ${pattern}`);
      }
    }
    
    if (killed > 0) {
      this.log(`  ✅ Terminated ${killed} processes`, 'green');
      this.stats.processes += killed;
    } else {
      this.log(`  ✅ No processes found`, 'green');
    }
  }

  async clearPorts(portList, description) {
    this.log(`🔌 Clearing ${description}...`, 'blue');
    let cleared = 0;
    
    for (const port of portList) {
      try {
        const pid = execSync(`lsof -ti:${port} 2>/dev/null || true`, { encoding: 'utf8' });
        if (pid.trim()) {
          this.logVerbose(`Port ${port} occupied by PID ${pid.trim()}`);
          
          if (!this.dryRun) {
            try {
              execSync(`kill -TERM ${pid.trim()} 2>/dev/null || true`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Force kill if still running
              const remainingPid = execSync(`lsof -ti:${port} 2>/dev/null || true`, { encoding: 'utf8' });
              if (remainingPid.trim()) {
                execSync(`kill -KILL ${remainingPid.trim()} 2>/dev/null || true`);
              }
            } catch (error) {
              this.logVerbose(`Warning clearing port ${port}: ${error.message}`);
            }
          }
          cleared++;
        }
      } catch (error) {
        this.logVerbose(`No process on port ${port}`);
      }
    }
    
    if (cleared > 0) {
      this.log(`  ✅ Cleared ${cleared} ports`, 'green');
      this.stats.ports += cleared;
    } else {
      this.log(`  ✅ All ports were clear`, 'green');
    }
  }

  async findAndRemove(patterns, description, isDirectory = false) {
    this.log(`🗑️ Cleaning ${description}...`, 'blue');
    
    for (const pattern of patterns) {
      try {
        // Exclude node_modules and .git to speed up search
        const excludes = '-not -path "*/node_modules/*" -not -path "*/.git/*"';
        const command = isDirectory ? 
          `find . -name "${pattern}" -type d ${excludes} 2>/dev/null | head -100` :
          `find . -name "${pattern}" -type f ${excludes} 2>/dev/null | head -100`;
        
        const results = execSync(command, { encoding: 'utf8' });
        const items = results.trim().split('\n').filter(item => item && item !== '.');
        
        if (items.length > 0) {
          this.logVerbose(`Found ${items.length} items matching: ${pattern}`);
          
          for (const item of items) {
            await this.safeRemove(item, pattern);
          }
        }
      } catch (error) {
        this.logVerbose(`No items found for pattern: ${pattern}`);
      }
    }
  }

  async cleanupOrphanedFiles() {
    this.log('🧹 Cleaning orphaned and temporary files...', 'blue');
    
    const orphanedPatterns = [
      // Temporary compilation files
      '*.tsbuildinfo',
      'tsconfig.tsbuildinfo',
      '*.d.ts.map',
      
      // Log files
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'bun-debug.log*',
      
      // Temporary files
      '*.tmp',
      '*.temp',
      '*.swp',
      '*.swo',
      '*~',
      '.DS_Store',
      'Thumbs.db',
      
      // IDE artifacts
      '.vscode/settings.json.bak',
      '*.orig',
      
      // Development artifacts
      '.eslintcache',
      '.prettiercache',
      '.stylelintcache',
    ];
    
    await this.findAndRemove(orphanedPatterns, 'orphaned files');
  }

  async cleanupBuildArtifacts() {
    this.log('🔨 Cleaning build artifacts...', 'blue');
    
    const buildDirs = [
      'dist',
      'lib',
      'build',
      'coverage',
      '.nyc_output',
      'test-results',
      'playwright-report',
      'src-gen',
    ];
    
    const cacheDirs = [
      '.turbo',
      '.cache',
      '.parcel-cache',
      '.next',
      '.nuxt',
      '.vite',
      '.webpack',
      '.rollup.cache',
      '.babel-cache',
      '.swc',
      '.jest',
      'node_modules/.vitest',
      'node_modules/.cache',
    ];
    
    await this.findAndRemove(buildDirs, 'build directories', true);
    await this.findAndRemove(cacheDirs, 'cache directories', true);
  }

  async cleanupDuplicateConfigs() {
    if (!this.aggressive) return;
    
    this.log('⚙️ Cleaning duplicate configuration files...', 'blue');
    
    // Remove old tsconfig fix files
    const fixConfigs = [
      'config/tsconfig.fix.json',
      'config/tsconfig.fix.phase1.json',
      'config/tsconfig.fix.phase2.json',
      'config/tsconfig.fix.phase3.json',
      'config/tsconfig.fix.phase4.json',
    ];
    
    for (const config of fixConfigs) {
      if (fs.existsSync(config)) {
        await this.safeRemove(config, 'old tsconfig fix file');
      }
    }
    
    // Remove redundant markdown completion files
    const completionDocs = [
      'BUILD_INTEGRATION_COMPLETE.md',
      'DEV_ENVIRONMENT_CLEANUP_COMPLETE.md',
      'NATIVE_MODULES_INTEGRATION_COMPLETE.md',
      // Add more as identified
    ];
    
    for (const doc of completionDocs) {
      if (fs.existsSync(doc)) {
        await this.safeRemove(doc, 'completion status file');
      }
    }
  }

  async cleanupGeneratedFiles() {
    this.log('🤖 Cleaning generated files...', 'blue');
    
    const generatedDirs = [
      'generated/prisma',
      'src-gen',
      'lib',
    ];
    
    // Only remove generated dirs if we're in aggressive mode or they seem safe to regenerate
    if (this.aggressive) {
      for (const dir of generatedDirs) {
        if (fs.existsSync(dir)) {
          await this.safeRemove(dir, 'generated directory');
        }
      }
    } else {
      // In normal mode, just clean obvious temporary generated files
      await this.findAndRemove(['*.generated.js', '*.generated.ts'], 'temporary generated files');
    }
  }

  async verifyNativeModules() {
    this.log('🔧 Verifying native modules...', 'blue');
    
    try {
      const result = execSync('node scripts/pre-build-check.cjs 2>/dev/null', { encoding: 'utf8' });
      if (result.includes('✅ Native modules ready')) {
        this.log('  ✅ Native modules are ready', 'green');
      } else {
        this.log('  ⚠️  Native modules may need attention', 'yellow');
        this.log('  💡 Run: bun run fix:native-modules', 'cyan');
      }
    } catch (error) {
      this.log('  ⚠️  Could not verify native modules', 'yellow');
      this.logVerbose(`Error: ${error.message}`);
    }
  }

  async getProjectSize() {
    try {
      const result = execSync('du -sh . 2>/dev/null', { encoding: 'utf8' });
      return result.split('\t')[0];
    } catch {
      return 'unknown';
    }
  }

  async run() {
    const startTime = Date.now();
    const initialSize = await this.getProjectSize();
    
    this.log('🧹 Enhanced Development Environment Cleanup', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    if (this.dryRun) {
      this.log('🔍 DRY RUN MODE - No changes will be made', 'yellow');
    }
    
    if (this.aggressive) {
      this.log('🚀 AGGRESSIVE MODE - Additional cleanup enabled', 'magenta');
    }
    
    this.log(`📊 Initial size: ${initialSize}`, 'blue');
    this.log('', 'reset');
    
    // Step 1: Process and Port Cleanup (always safe)
    const devProcessPatterns = [
      'node.*dev',
      'node.*start',
      'bun.*dev',
      'yarn.*dev',
      'npm.*dev',
      'turbo.*dev',
      'webpack',
      'vite',
      'next.*dev',
      'electron',
      'theia'
    ];
    
    await this.killProcesses(devProcessPatterns, 'development processes');
    
    const devPorts = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 8080, 8081, 5173, 4200];
    await this.clearPorts(devPorts, 'development ports');
    
    // Step 2: Safe File System Cleanup
    await this.cleanupOrphanedFiles();
    await this.cleanupBuildArtifacts();
    
    // Step 3: Aggressive Cleanup (only if requested)
    await this.cleanupDuplicateConfigs();
    await this.cleanupGeneratedFiles();
    
    // Step 4: Verification
    await this.verifyNativeModules();
    
    // Final cleanup - remove empty directories
    if (!this.dryRun) {
      try {
        execSync('find . -type d -empty -delete 2>/dev/null || true');
        this.log('🗂️  Removed empty directories', 'blue');
      } catch {
        // Ignore errors
      }
    }
    
    // Summary
    const endTime = Date.now();
    const finalSize = await this.getProjectSize();
    
    this.log('', 'reset');
    this.log('✅ Cleanup Complete!', 'green');
    this.log('=' .repeat(50), 'cyan');
    this.log(`⏱️  Time taken: ${Math.round((endTime - startTime) / 1000)}s`, 'blue');
    this.log(`📊 Final size: ${finalSize}`, 'blue');
    this.log(`💾 Space saved: ${this.formatBytes(this.stats.sizeSaved)}`, 'green');
    this.log('', 'reset');
    this.log('📈 Stats:', 'cyan');
    this.log(`  • Processes terminated: ${this.stats.processes}`, 'reset');
    this.log(`  • Ports cleared: ${this.stats.ports}`, 'reset');
    this.log(`  • Directories removed: ${this.stats.dirs}`, 'reset');
    this.log(`  • Files removed: ${this.stats.files}`, 'reset');
    this.log('', 'reset');
    
    if (!this.dryRun) {
      this.log('🚀 Next Steps:', 'cyan');
      this.log('  • Run: bun run dev (should start cleanly)', 'reset');
      this.log('  • Use --dry-run to preview changes first', 'reset');
      this.log('  • Use --aggressive for deeper cleanup', 'reset');
      this.log('  • Use --verbose for detailed output', 'reset');
    }
  }
}

// Run the cleaner
if (require.main === module) {
  const cleaner = new EnhancedCleaner();
  cleaner.run().catch(error => {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  });
}

module.exports = EnhancedCleaner;