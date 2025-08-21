#!/usr/bin/env node
/**
 * Multi-Tenant Browser Hub Sync System
 * Extends the existing global sync with tenant-aware patterns
 * Integrates with the EnhancedFileSystemWatcher for comprehensive monitoring
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto');

// Configuration with multi-tenant support
const CONFIG = {
  source: path.resolve(__dirname, '..', 'apps', 'browser-hub'),
  globalTargets: [
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
  ],
  tenantConfig: {
    enabled: true,
    basePath: path.resolve(__dirname, '..', 'data', 'tenants'),
    patterns: {
      configs: 'config/**/*.{json,yaml,yml}',
      templates: 'templates/**/*.{html,js,css}',
      assets: 'assets/**/*',
      customizations: 'customizations/**/*'
    }
  },
  sync: {
    debounceMs: 200,
    batchSize: 50,
    enableChecksums: true,
    enableConflictDetection: true,
    maxRetries: 3
  }
};

class MultiTenantBrowserHubSync {
  constructor() {
    this.watchers = new Map();
    this.fileChecksums = new Map();
    this.pendingChanges = new Map();
    this.debounceTimers = new Map();
    this.stats = {
      synced: 0,
      errors: 0,
      conflicts: 0,
      tenants: 0,
      globalTargets: CONFIG.globalTargets.filter(t => t.enabled).length
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
    this.stats.conflicts++;
  }

  /**
   * Calculate file checksum for conflict detection
   */
  async calculateChecksum(filePath) {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      this.warn(`Failed to calculate checksum for ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Validate tenant ID format
   */
  validateTenantId(tenantId) {
    const tenantIdRegex = /^[a-zA-Z0-9_-]+$/;
    return tenantIdRegex.test(tenantId) && tenantId.length <= 64;
  }

  /**
   * Get tenant-specific paths
   */
  getTenantPaths(tenantId) {
    if (!this.validateTenantId(tenantId)) {
      throw new Error(`Invalid tenant ID format: ${tenantId}`);
    }

    const basePath = path.join(CONFIG.tenantConfig.basePath, tenantId);
    return {
      base: basePath,
      configs: path.join(basePath, 'config'),
      templates: path.join(basePath, 'templates'),
      assets: path.join(basePath, 'assets'),
      customizations: path.join(basePath, 'customizations'),
      browserHub: path.join(basePath, 'browser-hub')
    };
  }

  /**
   * Ensure all target directories exist
   */
  async ensureDirectories() {
    // Ensure global target directories
    for (const target of CONFIG.globalTargets) {
      if (!target.enabled) continue;
      
      try {
        await fs.promises.mkdir(target.path, { recursive: true });
        this.info(`✓ Global target directory ready: ${target.name}`);
      } catch (error) {
        this.error(`Failed to create ${target.name} directory:`, error.message);
      }
    }

    // Ensure tenant base directory
    if (CONFIG.tenantConfig.enabled) {
      try {
        await fs.promises.mkdir(CONFIG.tenantConfig.basePath, { recursive: true });
        this.info(`✓ Tenant base directory ready: ${CONFIG.tenantConfig.basePath}`);
      } catch (error) {
        this.error('Failed to create tenant base directory:', error.message);
      }
    }
  }

  /**
   * Discover existing tenants
   */
  async discoverTenants() {
    if (!CONFIG.tenantConfig.enabled) return [];

    try {
      const entries = await fs.promises.readdir(CONFIG.tenantConfig.basePath, { withFileTypes: true });
      const tenants = entries
        .filter(entry => entry.isDirectory() && this.validateTenantId(entry.name))
        .map(entry => entry.name);
      
      this.stats.tenants = tenants.length;
      this.info(`📁 Discovered ${tenants.length} tenants:`, tenants.join(', '));
      return tenants;
    } catch (error) {
      this.warn('Failed to discover tenants:', error.message);
      return [];
    }
  }

  /**
   * Copy file with checksum validation and conflict detection
   */
  async copyWithValidation(srcPath, destPath, tenantId = null) {
    try {
      // Calculate source checksum
      const srcChecksum = await this.calculateChecksum(srcPath);
      if (!srcChecksum) return false;

      // Check for existing file and potential conflicts
      let destChecksum = null;
      if (await this.fileExists(destPath)) {
        destChecksum = await this.calculateChecksum(destPath);
        
        if (destChecksum && destChecksum !== srcChecksum) {
          // Conflict detected
          const srcStats = await fs.promises.stat(srcPath);
          const destStats = await fs.promises.stat(destPath);
          
          this.warn(`🔥 Conflict detected: ${destPath}`, {
            tenant: tenantId,
            srcModified: srcStats.mtime,
            destModified: destStats.mtime,
            srcChecksum: srcChecksum.substring(0, 8),
            destChecksum: destChecksum.substring(0, 8)
          });

          // For now, newer file wins (could be enhanced with user choice)
          if (srcStats.mtime <= destStats.mtime) {
            this.info(`⏭️  Skipping older file: ${path.basename(srcPath)}`);
            return false;
          }
        }
      }

      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      await fs.promises.mkdir(destDir, { recursive: true });

      // Copy file
      await fs.promises.copyFile(srcPath, destPath);

      // Update checksum cache
      this.fileChecksums.set(destPath, srcChecksum);

      const stats = await fs.promises.stat(srcPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      
      return { success: true, size: sizeKB, checksum: srcChecksum.substring(0, 8) };
    } catch (error) {
      this.error(`Failed to copy ${srcPath} to ${destPath}:`, error.message);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copy to global targets with tenant context
   */
  async copyToGlobalTargets(srcPath, tenantId = null) {
    if (!await this.fileExists(srcPath)) {
      this.warn(`Source path does not exist: ${srcPath}`);
      return;
    }

    const relativePath = path.relative(CONFIG.source, srcPath);
    
    for (const target of CONFIG.globalTargets) {
      if (!target.enabled) continue;
      
      const destPath = path.join(target.path, relativePath);
      const result = await this.copyWithValidation(srcPath, destPath, tenantId);
      
      if (result && result.success) {
        this.info(`📋 Synced to ${target.name}: ${relativePath} (${result.size} KB, ${result.checksum})`);
      }
    }
  }

  /**
   * Copy to tenant-specific targets
   */
  async copyToTenantTargets(srcPath, tenantId, targetType = 'browserHub') {
    if (!this.validateTenantId(tenantId)) {
      this.error(`Invalid tenant ID: ${tenantId}`);
      return;
    }

    const tenantPaths = this.getTenantPaths(tenantId);
    const relativePath = path.relative(CONFIG.source, srcPath);
    const destPath = path.join(tenantPaths[targetType], relativePath);
    
    const result = await this.copyWithValidation(srcPath, destPath, tenantId);
    
    if (result && result.success) {
      this.info(`🏢 Synced to tenant ${tenantId}: ${relativePath} (${result.size} KB, ${result.checksum})`);
    }
  }

  /**
   * Remove from all targets
   */
  async removeFromTargets(srcPath, tenantId = null) {
    const relativePath = path.relative(CONFIG.source, srcPath);
    
    // Remove from global targets
    for (const target of CONFIG.globalTargets) {
      if (!target.enabled) continue;
      
      const destPath = path.join(target.path, relativePath);
      
      try {
        if (await this.fileExists(destPath)) {
          await fs.promises.unlink(destPath);
          this.info(`🗑️  Removed from ${target.name}: ${relativePath}`);
          this.fileChecksums.delete(destPath);
        }
      } catch (error) {
        this.error(`Failed to remove from ${target.name}:`, error.message);
      }
    }

    // Remove from tenant targets if specified
    if (tenantId) {
      const tenantPaths = this.getTenantPaths(tenantId);
      const destPath = path.join(tenantPaths.browserHub, relativePath);
      
      try {
        if (await this.fileExists(destPath)) {
          await fs.promises.unlink(destPath);
          this.info(`🗑️  Removed from tenant ${tenantId}: ${relativePath}`);
          this.fileChecksums.delete(destPath);
        }
      } catch (error) {
        this.error(`Failed to remove from tenant ${tenantId}:`, error.message);
      }
    }
  }

  /**
   * Full sync with multi-tenant support
   */
  async fullSync() {
    if (!await this.fileExists(CONFIG.source)) {
      this.error(`Source directory not found: ${CONFIG.source}`);
      return false;
    }

    this.log('🔄', 'Starting multi-tenant browser hub sync...');
    this.stats = { 
      synced: 0, 
      errors: 0, 
      conflicts: 0, 
      tenants: 0,
      globalTargets: CONFIG.globalTargets.filter(t => t.enabled).length 
    };
    
    await this.ensureDirectories();
    const tenants = await this.discoverTenants();

    const syncRecursive = async (srcPath) => {
      const stats = await fs.promises.stat(srcPath);
      
      if (stats.isDirectory()) {
        const entries = await fs.promises.readdir(srcPath);
        
        for (const name of entries) {
          if (name.startsWith('.')) continue; // Skip hidden files
          await syncRecursive(path.join(srcPath, name));
        }
      } else {
        // Sync to global targets
        await this.copyToGlobalTargets(srcPath);
        
        // Sync to tenant targets if enabled
        if (CONFIG.tenantConfig.enabled) {
          for (const tenantId of tenants) {
            await this.copyToTenantTargets(srcPath, tenantId);
          }
        }
      }
    };

    await syncRecursive(CONFIG.source);
    
    this.success(`Multi-tenant sync complete: ${this.stats.synced} operations, ${this.stats.errors} errors, ${this.stats.conflicts} conflicts`);
    this.info(`Synced to ${this.stats.globalTargets} global targets and ${this.stats.tenants} tenants`);
    
    return this.stats.errors === 0;
  }

  /**
   * Start file watcher with multi-tenant support
   */
  startWatcher() {
    this.log('👁️ ', 'Starting multi-tenant file watcher...');
    
    // Watch global browser hub files
    const globalWatcher = chokidar.watch(CONFIG.source, {
      ignored: /node_modules|\.git|\.DS_Store|\.tmp/,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: CONFIG.sync.debounceMs,
        pollInterval: 50
      }
    });

    this.setupGlobalWatcherEvents(globalWatcher);
    this.watchers.set('global', globalWatcher);

    // Watch tenant directories if enabled
    if (CONFIG.tenantConfig.enabled) {
      this.startTenantWatchers();
    }

    this.success('Multi-tenant file watcher started');
    return this.watchers;
  }

  /**
   * Set up global watcher events
   */
  setupGlobalWatcherEvents(watcher) {
    watcher
      .on('add', (filePath) => {
        this.handleGlobalFileChange('add', filePath);
      })
      .on('change', (filePath) => {
        this.handleGlobalFileChange('change', filePath);
      })
      .on('unlink', (filePath) => {
        this.handleGlobalFileChange('unlink', filePath);
      })
      .on('error', (error) => {
        this.error('Global watcher error:', error.message);
      })
      .on('ready', () => {
        this.success('Global file watcher ready');
      });
  }

  /**
   * Handle global file changes with debouncing
   */
  handleGlobalFileChange(event, filePath) {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up debounced processing
    const timer = setTimeout(async () => {
      try {
        if (event === 'unlink') {
          await this.removeFromTargets(filePath);
        } else {
          await this.copyToGlobalTargets(filePath);
          
          // Also sync to tenant targets
          if (CONFIG.tenantConfig.enabled) {
            const tenants = await this.discoverTenants();
            for (const tenantId of tenants) {
              await this.copyToTenantTargets(filePath, tenantId);
            }
          }
        }
      } catch (error) {
        this.error(`Error processing global file change: ${filePath}`, error.message);
      }
      
      this.debounceTimers.delete(filePath);
    }, CONFIG.sync.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Start tenant-specific watchers
   */
  async startTenantWatchers() {
    const tenants = await this.discoverTenants();
    
    for (const tenantId of tenants) {
      try {
        const tenantPaths = this.getTenantPaths(tenantId);
        
        // Watch tenant browser hub customizations
        if (await this.fileExists(tenantPaths.browserHub)) {
          const tenantWatcher = chokidar.watch(tenantPaths.browserHub, {
            ignored: /node_modules|\.git|\.DS_Store|\.tmp/,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
              stabilityThreshold: CONFIG.sync.debounceMs,
              pollInterval: 50
            }
          });

          this.setupTenantWatcherEvents(tenantWatcher, tenantId);
          this.watchers.set(`tenant:${tenantId}`, tenantWatcher);
          
          this.info(`📁 Started watcher for tenant: ${tenantId}`);
        }
      } catch (error) {
        this.error(`Failed to start watcher for tenant ${tenantId}:`, error.message);
      }
    }
  }

  /**
   * Set up tenant watcher events
   */
  setupTenantWatcherEvents(watcher, tenantId) {
    watcher
      .on('add', (filePath) => {
        this.handleTenantFileChange('add', filePath, tenantId);
      })
      .on('change', (filePath) => {
        this.handleTenantFileChange('change', filePath, tenantId);
      })
      .on('unlink', (filePath) => {
        this.handleTenantFileChange('unlink', filePath, tenantId);
      })
      .on('error', (error) => {
        this.error(`Tenant ${tenantId} watcher error:`, error.message);
      })
      .on('ready', () => {
        this.info(`Tenant ${tenantId} watcher ready`);
      });
  }

  /**
   * Handle tenant file changes
   */
  handleTenantFileChange(event, filePath, tenantId) {
    const key = `${tenantId}:${filePath}`;
    
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up debounced processing
    const timer = setTimeout(async () => {
      try {
        this.info(`🏢 Tenant ${tenantId} file ${event}: ${path.basename(filePath)}`);
        
        // Tenant-specific file changes could trigger additional logic here
        // For now, just log the change
        
      } catch (error) {
        this.error(`Error processing tenant file change: ${filePath}`, error.message);
      }
      
      this.debounceTimers.delete(key);
    }, CONFIG.sync.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Stop all watchers
   */
  stopWatchers() {
    this.log('🛑', 'Stopping all watchers...');
    
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    for (const [id, watcher] of this.watchers) {
      try {
        watcher.close();
        this.info(`Stopped watcher: ${id}`);
      } catch (error) {
        this.error(`Error stopping watcher ${id}:`, error.message);
      }
    }
    
    this.watchers.clear();
    this.success('All watchers stopped');
  }

  /**
   * Display current configuration
   */
  showConfig() {
    this.log('⚙️ ', 'Multi-Tenant Browser Hub Sync Configuration:');
    this.info(`Source: ${CONFIG.source}`);
    this.info('Global Targets:');
    
    for (const target of CONFIG.globalTargets) {
      const status = target.enabled ? '✅' : '❌';
      this.info(`  ${status} ${target.name}: ${target.path}`);
    }

    if (CONFIG.tenantConfig.enabled) {
      this.info('Tenant Configuration:');
      this.info(`  Base Path: ${CONFIG.tenantConfig.basePath}`);
      this.info(`  Patterns: ${Object.keys(CONFIG.tenantConfig.patterns).join(', ')}`);
    } else {
      this.info('Tenant support: ❌ Disabled');
    }

    this.info('Sync Settings:');
    this.info(`  Debounce: ${CONFIG.sync.debounceMs}ms`);
    this.info(`  Batch Size: ${CONFIG.sync.batchSize}`);
    this.info(`  Checksums: ${CONFIG.sync.enableChecksums ? '✅' : '❌'}`);
    this.info(`  Conflict Detection: ${CONFIG.sync.enableConflictDetection ? '✅' : '❌'}`);
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeWatchers: this.watchers.size,
      pendingChanges: this.pendingChanges.size,
      cachedChecksums: this.fileChecksums.size
    };
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const manager = new MultiTenantBrowserHubSync();

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔄 Multi-Tenant Browser Hub Sync System

Usage:
  node sync-browser-hub-multi-tenant.js [options]

Options:
  --once, -o       Run one-time sync and exit
  --watch, -w      Start file watcher (default)
  --config, -c     Show current configuration
  --stats, -s      Show sync statistics
  --tenants, -t    List discovered tenants
  --help, -h       Show this help message

Examples:
  node sync-browser-hub-multi-tenant.js --once     # One-time sync
  node sync-browser-hub-multi-tenant.js --watch    # Watch for changes
  node sync-browser-hub-multi-tenant.js --config   # Show configuration
  node sync-browser-hub-multi-tenant.js --tenants  # List tenants
`);
    return;
  }

  // Show configuration
  if (args.includes('--config') || args.includes('-c')) {
    manager.showConfig();
    return;
  }

  // Show statistics
  if (args.includes('--stats') || args.includes('-s')) {
    const stats = manager.getStats();
    console.log('📊 Sync Statistics:', JSON.stringify(stats, null, 2));
    return;
  }

  // List tenants
  if (args.includes('--tenants') || args.includes('-t')) {
    manager.discoverTenants().then(tenants => {
      console.log('🏢 Discovered Tenants:', tenants.length > 0 ? tenants.join(', ') : 'None');
    });
    return;
  }

  // One-time sync
  if (args.includes('--once') || args.includes('-o')) {
    manager.showConfig();
    manager.fullSync().then(success => {
      const stats = manager.getStats();
      console.log('📊 Final Statistics:', JSON.stringify(stats, null, 2));
      process.exit(success ? 0 : 1);
    });
    return;
  }

  // Watch mode (default)
  manager.showConfig();
  manager.fullSync().then(() => {
    manager.startWatcher();

    // Graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down multi-tenant browser hub sync...');
      manager.stopWatchers();
      const stats = manager.getStats();
      console.log('📊 Final Statistics:', JSON.stringify(stats, null, 2));
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGQUIT', shutdown);

    manager.log('🚀', 'Multi-Tenant Browser Hub Sync is running!');
    manager.info('Press Ctrl+C to stop');
  });
}

// Export for programmatic use
module.exports = {
  MultiTenantBrowserHubSync,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main();
}