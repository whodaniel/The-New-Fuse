import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
const vi = jest;
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { EnhancedFileSystemWatcher, WatcherConfig } from './EnhancedFileSystemWatcher';

// Simple integration test without complex mocking
describe('EnhancedFileSystemWatcher Integration', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create real temp directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'enhanced-watcher-integration-'));
    testFile = path.join(tempDir, 'test.txt');
  });

  afterEach(async () => {
    // Remove temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create watcher instance', () => {
    // Create mock dependencies
    const redisConfig = {
      validateTenantId: () => true,
      sanitizeResourceId: (id: string) => id,
    } as any;

    const dbService = {
      upsertSyncState: async () => ({}),
      getSyncState: async () => null,
      deleteSyncState: async () => undefined,
      createSyncConflict: async () => ({}),
    } as any;

    const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
    expect(watcher).toBeDefined();
  });

  it('should initialize with valid config', async () => {
    const redisConfig = {
      validateTenantId: () => true,
      sanitizeResourceId: (id: string) => id,
    } as any;

    const dbService = {
      upsertSyncState: async () => ({}),
      getSyncState: async () => null,
      deleteSyncState: async () => undefined,
      createSyncConflict: async () => ({}),
    } as any;

    const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
    
    const config: WatcherConfig = {
      paths: [tempDir],
    };

    await expect(watcher.initialize(config)).resolves.not.toThrow();
    
    const status = watcher.getWatcherStatus();
    expect(status.initialized).toBe(true);
    
    await watcher.stopAllWatchers();
  });

  it('should calculate file checksums', async () => {
    const redisConfig = {
      validateTenantId: () => true,
      sanitizeResourceId: (id: string) => id,
    } as any;

    const dbService = {
      upsertSyncState: async () => ({}),
      getSyncState: async () => null,
      deleteSyncState: async () => undefined,
      createSyncConflict: async () => ({}),
    } as any;

    const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
    
    const config: WatcherConfig = {
      paths: [tempDir],
    };

    await watcher.initialize(config);
    
    // Create test file
    await fs.writeFile(testFile, 'test content');
    
    const checksum = await watcher.refreshFileChecksum(testFile);
    
    expect(checksum).toBeDefined();
    expect(typeof checksum).toBe('string');
    expect(checksum.length).toBe(64); // SHA-256 hex length
    
    // Should cache the checksum
    const cachedChecksum = watcher.getFileChecksum(testFile);
    expect(cachedChecksum).toBe(checksum);
    
    await watcher.stopAllWatchers();
  });

  it('should report health status', async () => {
    const redisConfig = {
      validateTenantId: () => true,
      sanitizeResourceId: (id: string) => id,
    } as any;

    const dbService = {
      upsertSyncState: async () => ({}),
      getSyncState: async () => null,
      deleteSyncState: async () => undefined,
      createSyncConflict: async () => ({}),
    } as any;

    const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
    
    // Should be unhealthy when not initialized
    let health = await watcher.healthCheck();
    expect(health.status).toBe('unhealthy');
    expect(health.details.initialized).toBe(false);
    
    // Initialize
    const config: WatcherConfig = {
      paths: [tempDir],
    };
    await watcher.initialize(config);
    
    // Should be degraded when initialized but no watchers
    health = await watcher.healthCheck();
    expect(health.status).toBe('degraded');
    expect(health.details.initialized).toBe(true);
    expect(health.details.activeWatchers).toBe(0);
    
    await watcher.stopAllWatchers();
  });

  it('should manage pending changes', async () => {
    const redisConfig = {
      validateTenantId: () => true,
      sanitizeResourceId: (id: string) => id,
    } as any;

    const dbService = {
      upsertSyncState: async () => ({}),
      getSyncState: async () => null,
      deleteSyncState: async () => undefined,
      createSyncConflict: async () => ({}),
    } as any;

    const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
    
    const config: WatcherConfig = {
      paths: [tempDir],
    };
    await watcher.initialize(config);
    
    // Should start with no pending changes
    let pendingChanges = watcher.getPendingChanges();
    expect(Array.isArray(pendingChanges)).toBe(true);
    expect(pendingChanges.length).toBe(0);
    
    // Clear pending changes
    watcher.clearPendingChanges();
    
    pendingChanges = watcher.getPendingChanges();
    expect(pendingChanges.length).toBe(0);
    
    await watcher.stopAllWatchers();
  });

  it('should validate tenant IDs', async () => {
    const redisConfig = {
      validateTenantId: (id: string) => /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 64,
      sanitizeResourceId: (id: string) => id,
    } as any;

    const dbService = {
      upsertSyncState: async () => ({}),
      getSyncState: async () => null,
      deleteSyncState: async () => undefined,
      createSyncConflict: async () => ({}),
    } as any;

    const watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
    
    const config: WatcherConfig = {
      paths: [tempDir],
      tenantId: 'invalid@tenant', // Invalid tenant ID
    };

    await expect(watcher.initialize(config)).rejects.toThrow('Invalid tenant ID format');
  });
});