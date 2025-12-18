#!/usr/bin/env node
/**
 * Global Browser Hub Sync System
 * Ensures consistency between browser hub files across all apps
 * Prevents version inconsistencies between Electron, Chrome, and any other consumers
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

// Configuration
const CONFIG = {
  source: path.resolve(__dirname, '..', 'apps', 'browser-hub'),
  targets: [
    {
      name: 'Electron Desktop',
      path: path.resolve(__dirname, '..', 'apps', 'electron-desktop', 'dist', 'browser-hub'),
      enabled: true
    },
    {
      name: 'Frontend Public',
      path: path.resolve(__dirname, '..', 'apps', 'frontend', 'public', 'browser-hub'),
      enabled: true
    },
    {
      name: 'Theia IDE Static',
      path: path.resolve(__dirname, '..', 'apps', 'theia-ide', 'static', 'browser-hub'),
      enabled: true
    }
  ]
};

class BrowserHubSyncManager {
  constructor() {
    this.watcher = null;
    this.stats = {
      synced: 0,
      errors: 0,
      targets: CONFIG.targets.filter(t => t.enabled).length
    };
  }

  log(emoji, message, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji} [${timestamp}] ${message}`, ...args);
  }

  error(message, ...args) {
    this.log('❌', message, ...args);
    this.stats.errors++;
  }

  success(message, ...args) {
    this.log('✅', message, ...args);
    this.stats.synced++;
  }

  info(message, ...args) {
    this.log('ℹ️ ', message, ...args);
  }

  warn(message, ...args) {
    this.log('⚠️ ', message, ...args);
  }

  // Ensure all target directories exist
  ensureTargetDirs() {
    for (const target of CONFIG.targets) {
      if (!target.enabled) continue;
      
      try {
        if (!fs.existsSync(target.path)) {
          fs.mkdirSync(target.path, { recursive: true });
          this.success(`Created target directory: ${target.name}`);
        }
      } catch (error) {
        this.error(`Failed to create ${target.name} directory:`, error.message);
      }
    }
  }

  // Copy a single file to all targets
  copyToTargets(srcPath, isDirectory = false) {
    if (!fs.existsSync(srcPath)) {
      this.warn(`Source path does not exist: ${srcPath}`);
      return;
    }

    const relativePath = path.relative(CONFIG.source, srcPath);
    const stats = isDirectory ? null : fs.statSync(srcPath);
    
    for (const target of CONFIG.targets) {
      if (!target.enabled) continue;
      
      const destPath = path.join(target.path, relativePath);
      
      try {
        if (isDirectory) {
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
            this.info(`📁 Created directory in ${target.name}: ${relativePath}`);
          }
        } else {
          // Ensure destination directory exists
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          fs.copyFileSync(srcPath, destPath);
          const sizeKB = (stats.size / 1024).toFixed(1);
          this.info(`📋 Synced to ${target.name}: ${relativePath} (${sizeKB} KB)`);
        }
      } catch (error) {
        this.error(`Failed to copy to ${target.name}:`, error.message);
      }
    }
  }

  // Remove file from all targets
  removeFromTargets(srcPath) {
    const relativePath = path.relative(CONFIG.source, srcPath);
    
    for (const target of CONFIG.targets) {
      if (!target.enabled) continue;
      
      const destPath = path.join(target.path, relativePath);
      
      try {
        if (fs.existsSync(destPath)) {
          const stats = fs.statSync(destPath);
          if (stats.isDirectory()) {
            fs.rmSync(destPath, { recursive: true, force: true });
            this.info(`🗑️  Removed directory from ${target.name}: ${relativePath}`);
          } else {
            fs.unlinkSync(destPath);
            this.info(`🗑️  Removed file from ${target.name}: ${relativePath}`);
          }
        }
      } catch (error) {
        this.error(`Failed to remove from ${target.name}:`, error.message);
      }
    }
  }

  // Full sync of all files
  fullSync() {
    if (!fs.existsSync(CONFIG.source)) {
      this.error(`Source directory not found: ${CONFIG.source}`);
      return false;
    }

    this.log('🔄', 'Starting full sync of browser hub files...');
    this.stats = { synced: 0, errors: 0, targets: CONFIG.targets.filter(t => t.enabled).length };
    
    this.ensureTargetDirs();

    const syncRecursive = (srcPath) => {
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        this.copyToTargets(srcPath, true);
        
        for (const name of fs.readdirSync(srcPath)) {
          if (name.startsWith('.')) continue; // Skip hidden files
          syncRecursive(path.join(srcPath, name));
        }
      } else {
        this.copyToTargets(srcPath, false);
      }
    };

    syncRecursive(CONFIG.source);
    
    this.success(`Full sync complete: ${this.stats.synced} operations, ${this.stats.errors} errors`);
    this.info(`Synced to ${this.stats.targets} target locations`);
    
    return this.stats.errors === 0;
  }

  // Start file watcher
  startWatcher() {
    this.log('👁️ ', 'Starting file watcher for browser hub...');
    
    this.watcher = chokidar.watch(CONFIG.source, {
      ignored: /node_modules|\.git|\.DS_Store|\.tmp/,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', (filePath) => {
        this.copyToTargets(filePath, false);
      })
      .on('change', (filePath) => {
        this.copyToTargets(filePath, false);
      })
      .on('unlink', (filePath) => {
        this.removeFromTargets(filePath);
      })
      .on('addDir', (dirPath) => {
        this.copyToTargets(dirPath, true);
      })
      .on('unlinkDir', (dirPath) => {
        this.removeFromTargets(dirPath);
      })
      .on('error', (error) => {
        this.error('Watcher error:', error.message);
      })
      .on('ready', () => {
        this.success('File watcher is ready and monitoring changes');
        this.info('Any changes to browser hub files will be automatically synced');
      });

    return this.watcher;
  }

  // Stop watcher
  stopWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.info('File watcher stopped');
    }
  }

  // Display current configuration
  showConfig() {
    this.log('⚙️ ', 'Browser Hub Sync Configuration:');
    this.info(`Source: ${CONFIG.source}`);
    this.info('Targets:');
    
    for (const target of CONFIG.targets) {
      const status = target.enabled ? '✅' : '❌';
      this.info(`  ${status} ${target.name}: ${target.path}`);
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const manager = new BrowserHubSyncManager();

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔄 Browser Hub Global Sync System

Usage:
  node sync-browser-hub-global.js [options]

Options:
  --once, -o     Run one-time sync and exit
  --watch, -w    Start file watcher (default)
  --config, -c   Show current configuration
  --help, -h     Show this help message

Examples:
  node sync-browser-hub-global.js --once    # One-time sync
  node sync-browser-hub-global.js --watch   # Watch for changes
  node sync-browser-hub-global.js --config  # Show configuration
`);
    return;
  }

  // Show configuration
  if (args.includes('--config') || args.includes('-c')) {
    manager.showConfig();
    return;
  }

  // One-time sync
  if (args.includes('--once') || args.includes('-o')) {
    manager.showConfig();
    const success = manager.fullSync();
    process.exit(success ? 0 : 1);
    return;
  }

  // Watch mode (default)
  manager.showConfig();
  manager.fullSync(); // Initial sync
  manager.startWatcher();

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down browser hub sync...');
    manager.stopWatcher();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGQUIT', shutdown);

  manager.log('🚀', 'Browser Hub Global Sync is running!');
  manager.info('Press Ctrl+C to stop');
}

// Export for programmatic use
module.exports = {
  BrowserHubSyncManager,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}