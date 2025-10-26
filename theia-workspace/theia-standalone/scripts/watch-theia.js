#!/usr/bin/env node

/**
 * Theia IDE File Watcher
 * Watches for file changes and triggers rebuilds when needed
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`👀 ${message}`, 'magenta');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

class TheiaFileWatcher {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.debounceTime = options.debounceTime || 1000;
    this.verbose = options.verbose || false;
    this.watchers = [];
    this.rebuildTimeout = null;
    this.isRebuilding = false;
  }

  getWatchPatterns() {
    return [
      'src/**/*.ts',
      'src/**/*.js',
      'src/**/*.json',
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'tsconfig.json',
      'webpack.config.js',
      '*.config.js'
    ];
  }

  shouldWatchFile(filePath) {
    const patterns = this.getWatchPatterns();
    const relativePath = path.relative(this.rootDir, filePath);
    
    for (const pattern of patterns) {
      if (this.matchesPattern(relativePath, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  matchesPattern(filePath, pattern) {
    const regex = new RegExp(
      pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
    );
    
    return regex.test(filePath);
  }

  scheduleRebuild() {
    if (this.isRebuilding) {
      return;
    }
    
    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
    }
    
    this.rebuildTimeout = setTimeout(() => {
      this.triggerRebuild();
    }, this.debounceTime);
  }

  async triggerRebuild() {
    if (this.isRebuilding) {
      return;
    }
    
    this.isRebuilding = true;
    logInfo('File changes detected, triggering rebuild...');
    
    try {
      // Run the standalone build script
      const buildProcess = spawn('node', ['build-theia-standalone.js'], {
        stdio: this.verbose ? 'inherit' : 'pipe',
        cwd: this.rootDir
      });
      
      let output = '';
      
      if (!this.verbose) {
        buildProcess.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        buildProcess.stderr?.on('data', (data) => {
          output += data.toString();
        });
      }
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          logSuccess('Rebuild completed successfully');
        } else {
          logWarning(`Rebuild failed with exit code ${code}`);
          if (!this.verbose && output) {
            log('Build output:', 'yellow');
            log(output.substring(0, 500) + (output.length > 500 ? '...' : ''), 'yellow');
          }
        }
        
        this.isRebuilding = false;
      });
      
      buildProcess.on('error', (error) => {
        logWarning(`Rebuild error: ${error.message}`);
        this.isRebuilding = false;
      });
      
    } catch (error) {
      logWarning(`Failed to trigger rebuild: ${error.message}`);
      this.isRebuilding = false;
    }
  }

  setupWatcher() {
    const watchPatterns = this.getWatchPatterns();
    
    logInfo(`Setting up file watcher for patterns: ${watchPatterns.join(', ')}`);
    
    try {
      // Use chokidar if available, otherwise fallback to fs.watch
      let chokidar;
      try {
        chokidar = require('chokidar');
      } catch (error) {
        logWarning('chokidar not found, using basic file watching');
      }
      
      if (chokidar) {
        // Use chokidar for better cross-platform watching
        const watcher = chokidar.watch(watchPatterns, {
          cwd: this.rootDir,
          ignored: [
            '**/node_modules/**',
            '**/lib/**',
            '**/dist/**',
            '**/src-gen/**',
            '**/.git/**',
            '**/.*'
          ],
          persistent: true,
          ignoreInitial: true
        });
        
        watcher.on('all', (event, filePath) => {
          if (this.shouldWatchFile(path.join(this.rootDir, filePath))) {
            logInfo(`File ${event}: ${filePath}`);
            this.scheduleRebuild();
          }
        });
        
        this.watchers.push(watcher);
        
      } else {
        // Fallback to basic fs.watch
        for (const pattern of watchPatterns) {
          const watchPath = path.join(this.rootDir, pattern.replace('**/', ''));
          
          if (fs.existsSync(watchPath) || pattern.includes('**')) {
            const watcher = fs.watch(watchPath, { recursive: true }, (event, filename) => {
              if (filename) {
                const fullPath = path.join(watchPath, filename);
                if (this.shouldWatchFile(fullPath)) {
                  logInfo(`File ${event}: ${filename}`);
                  this.scheduleRebuild();
                }
              }
            });
            
            this.watchers.push(watcher);
          }
        }
      }
      
      logSuccess('File watcher started');
      
    } catch (error) {
      logWarning(`Failed to setup file watcher: ${error.message}`);
    }
  }

  start() {
    log('👀 Starting Theia IDE File Watcher', 'bright');
    
    this.setupWatcher();
    
    logInfo('Watching for file changes...');
    logInfo('Press Ctrl+C to stop watching');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Stopping file watcher...');
      this.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('\n🛑 Stopping file watcher...');
      this.stop();
      process.exit(0);
    });
  }

  stop() {
    if (this.rebuildTimeout) {
      clearTimeout(this.rebuildTimeout);
    }
    
    for (const watcher of this.watchers) {
      try {
        if (watcher.close) {
          watcher.close();
        } else if (typeof watcher === 'object') {
          watcher.close?.();
        }
      } catch (error) {
        logWarning(`Error closing watcher: ${error.message}`);
      }
    }
    
    this.watchers = [];
    logSuccess('File watcher stopped');
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    rootDir: process.cwd(),
    debounceTime: 1000,
    verbose: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--debounce':
      case '-d':
        options.debounceTime = parseInt(nextArg) || 1000;
        i++;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          logError(`Unknown option: ${arg}`);
          options.help = true;
        }
    }
  }
  
  return options;
}

function showHelp() {
  log('\n👀 Theia IDE File Watcher', 'bright');
  log('═══════════════════════════════════════', 'cyan');
  log('\nUsage:');
  log('  node scripts/watch-theia.js [options]', 'blue');
  log('\nOptions:');
  log('  --debounce, -d <ms>     Debounce time in milliseconds (default: 1000)', 'blue');
  log('  --verbose, -v           Show detailed output', 'blue');
  log('  --help, -h              Show this help message', 'blue');
  log('\nWatched patterns:');
  log('  src/**/*.ts, src/**/*.js, src/**/*.json', 'blue');
  log('  package.json, tsconfig.json, *.config.js', 'blue');
  log('\nExamples:');
  log('  node scripts/watch-theia.js                    # Start with defaults', 'blue');
  log('  node scripts/watch-theia.js --debounce 2000    # 2 second debounce', 'blue');
  log('  node scripts/watch-theia.js --verbose          # Verbose output', 'blue');
}

// Main execution
function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  const watcher = new TheiaFileWatcher(options);
  
  try {
    watcher.start();
  } catch (error) {
    logError(`Failed to start file watcher: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TheiaFileWatcher };