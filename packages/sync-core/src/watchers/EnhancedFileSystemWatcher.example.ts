/**
 * Example usage of EnhancedFileSystemWatcher
 * Demonstrates integration with existing infrastructure
 */

import { EnhancedFileSystemWatcher, WatcherConfig } from './EnhancedFileSystemWatcher.js';
import { SyncRedisConfig } from '../config/SyncRedisConfig.js';
import { SyncDatabaseService } from '../database/SyncDatabaseService.js';
import { FileChangeEvent } from '../types/index.js';

// Example: Setting up the Enhanced File System Watcher
export async function setupEnhancedFileWatcher() {
  // Initialize dependencies (these would come from your DI container)
  const redisConfig = new SyncRedisConfig(/* ConfigService instance */);
  const dbService = new SyncDatabaseService(/* DrizzleClient instance */);
  
  // Create the watcher instance
  const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
  
  // Initialize with basic configuration
  const config: WatcherConfig = {
    paths: [
      './apps/browser-hub/**/*',
      './packages/*/src/**/*',
      './scripts/**/*'
    ],
    ignored: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.tmp',
      '*.temp'
    ],
    depth: 10,
    debounceMs: 200,
    enableChecksumValidation: true,
    enableConflictDetection: true,
    batchSize: 50
  };
  
  await watcher.initialize(config);
  
  // Set up event listeners
  watcher.on('fileChange', (event: FileChangeEvent) => {
    console.log(`File ${event.type}: ${event.filePath}`, {
      tenant: event.tenantId,
      checksum: event.checksum.substring(0, 8),
      timestamp: event.timestamp
    });
  });
  
  watcher.on('conflict', (conflict) => {
    console.warn('File conflict detected:', {
      file: conflict.filePath,
      type: conflict.conflictType,
      localChecksum: conflict.localChecksum.substring(0, 8),
      remoteChecksum: conflict.remoteChecksum.substring(0, 8)
    });
  });
  
  watcher.on('error', (error) => {
    console.error('File watcher error:', error);
  });
  
  watcher.on('ready', (context) => {
    console.log('File watcher ready:', context);
  });
  
  return watcher;
}

// Example: Multi-tenant file watching
export async function setupMultiTenantWatching(watcher: EnhancedFileSystemWatcher) {
  // Watch global files (cross-tenant)
  await watcher.watchGlobalFiles([
    './apps/browser-hub/**/*',
    './packages/*/templates/**/*',
    './scripts/sync-*.cjs'
  ]);
  
  // Watch tenant-specific files
  const tenants = ['tenant-1', 'tenant-2', 'tenant-3'];
  
  for (const tenantId of tenants) {
    await watcher.watchTenantFiles(tenantId, [
      `./data/tenants/${tenantId}/**/*`,
      `./apps/*/tenant-configs/${tenantId}/**/*`,
      `./packages/*/tenant-templates/${tenantId}/**/*`
    ]);
  }
  
  console.log(`Set up file watching for ${tenants.length} tenants`);
}

// Example: Integration with existing browser hub sync
export async function integrateWithBrowserHubSync(watcher: EnhancedFileSystemWatcher) {
  // Watch browser hub source files
  await watcher.watchGlobalFiles([
    './apps/browser-hub/**/*.html',
    './apps/browser-hub/**/*.js',
    './apps/browser-hub/**/*.css',
    './apps/browser-hub/**/*.json'
  ]);
  
  // Set up sync to existing targets when files change
  watcher.on('fileChange', async (event: FileChangeEvent) => {
    if (event.filePath.includes('browser-hub')) {
      console.log('Browser hub file changed, triggering sync:', event.filePath);
      
      // Here you would integrate with the existing sync-browser-hub-global.cjs
      // or call the MultiTenantBrowserHubSync directly
      
      // Example integration:
      // const { BrowserHubSyncManager } = require('../../scripts/sync-browser-hub-global.cjs');
      // const syncManager = new BrowserHubSyncManager();
      // await syncManager.copyToTargets(event.filePath);
    }
  });
}

// Example: Conflict resolution workflow
export async function setupConflictResolution(watcher: EnhancedFileSystemWatcher) {
  watcher.on('conflict', async (conflict) => {
    console.log('Resolving file conflict:', conflict.filePath);
    
    // Example conflict resolution strategies
    switch (conflict.conflictType) {
      case 'checksum':
        // For checksum conflicts, prefer the newer file
        if (conflict.localModified > conflict.remoteModified) {
          console.log('Using local version (newer)');
          // Update sync state with local version
        } else {
          console.log('Using remote version (newer)');
          // Restore from remote version
        }
        break;
        
      case 'concurrent':
        // For concurrent modifications, create backup and use latest
        console.log('Creating backup for concurrent modification');
        // Create backup file with timestamp
        // Use the latest modification
        break;
        
      case 'version':
        // For version conflicts, merge if possible
        console.log('Attempting to merge version conflict');
        // Implement merge logic or escalate to manual resolution
        break;
    }
  });
}

// Example: Performance monitoring
export async function setupPerformanceMonitoring(watcher: EnhancedFileSystemWatcher) {
  // Monitor watcher health
  setInterval(async () => {
    const health = await watcher.healthCheck();
    const status = watcher.getWatcherStatus();
    
    console.log('Watcher Health Check:', {
      status: health.status,
      activeWatchers: status.activeWatchers,
      watchedFiles: status.watchedFiles,
      pendingChanges: status.pendingChanges
    });
    
    // Alert if unhealthy
    if (health.status === 'unhealthy') {
      console.error('File watcher is unhealthy!', health.details);
      // Send alert to monitoring system
    }
  }, 30000); // Check every 30 seconds
  
  // Monitor file change rate
  let changeCount = 0;
  watcher.on('fileChange', () => {
    changeCount++;
  });
  
  setInterval(() => {
    console.log(`File changes in last minute: ${changeCount}`);
    changeCount = 0;
  }, 60000); // Reset every minute
}

// Example: Graceful shutdown
export async function setupGracefulShutdown(watcher: EnhancedFileSystemWatcher) {
  const shutdown = async () => {
    console.log('Shutting down file watcher...');
    
    // Get final statistics
    const status = watcher.getWatcherStatus();
    const pendingChanges = watcher.getPendingChanges();
    
    console.log('Final status:', {
      watchedFiles: status.watchedFiles,
      pendingChanges: pendingChanges.length
    });
    
    // Process any pending changes
    if (pendingChanges.length > 0) {
      console.log(`Processing ${pendingChanges.length} pending changes...`);
      // Process pending changes or save them for next startup
    }
    
    // Stop all watchers
    await watcher.stopAllWatchers();
    
    console.log('File watcher shutdown complete');
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGQUIT', shutdown);
}

// Example: Complete setup function
export async function setupCompleteFileWatcher() {
  console.log('Setting up Enhanced File System Watcher...');
  
  try {
    // Initialize watcher
    const watcher = await setupEnhancedFileWatcher();
    
    // Set up multi-tenant watching
    await setupMultiTenantWatching(watcher);
    
    // Integrate with browser hub sync
    await integrateWithBrowserHubSync(watcher);
    
    // Set up conflict resolution
    await setupConflictResolution(watcher);
    
    // Set up monitoring
    await setupPerformanceMonitoring(watcher);
    
    // Set up graceful shutdown
    await setupGracefulShutdown(watcher);
    
    console.log('Enhanced File System Watcher setup complete!');
    
    return watcher;
  } catch (error) {
    console.error('Failed to setup file watcher:', error);
    throw error;
  }
}

// Example usage in a NestJS application
export class FileWatcherModule {
  private watcher: EnhancedFileSystemWatcher;
  
  async onModuleInit() {
    this.watcher = await setupCompleteFileWatcher();
  }
  
  async onModuleDestroy() {
    if (this.watcher) {
      await this.watcher.stopAllWatchers();
    }
  }
  
  getWatcher(): EnhancedFileSystemWatcher {
    return this.watcher;
  }
}

// Export for use in other modules
export {
  EnhancedFileSystemWatcher,
  type WatcherConfig,
  type FileChangeEvent
};