import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
const vi = jest;
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { EnhancedFileSystemWatcher, WatcherConfig } from './EnhancedFileSystemWatcher';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import { SyncDatabaseService } from '../database/SyncDatabaseService';
import { FileChangeEvent } from '../types';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../config/SyncRedisConfig');
jest.mock('../database/SyncDatabaseService');

describe('EnhancedFileSystemWatcher', () => {
  let watcher: EnhancedFileSystemWatcher;
  let redisConfig: SyncRedisConfig;
  let dbService: SyncDatabaseService;
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create real temp directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'enhanced-watcher-test-'));
    testFile = path.join(tempDir, 'test.txt');

    // Create mock instances
    redisConfig = {
      validateTenantId: jest.fn().mockReturnValue(true),
      sanitizeResourceId: jest.fn().mockImplementation((id) => id),
    } as any;

    dbService = {
      upsertSyncState: jest.fn().mockResolvedValue({}),
      getSyncState: jest.fn().mockResolvedValue(null),
      deleteSyncState: jest.fn().mockResolvedValue(undefined),
      createSyncConflict: jest.fn().mockResolvedValue({}),
    } as any;

    watcher = new EnhancedFileSystemWatcher(redisConfig, dbService);
  });

  afterEach(async () => {
    // Clean up
    await watcher.stopAllWatchers();
    
    // Remove temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
        tenantId: 'test-tenant',
      };

      await expect(watcher.initialize(config)).resolves.not.toThrow();
      
      const status = watcher.getWatcherStatus();
      expect(status.initialized).toBe(true);
    });

    it('should reject invalid tenant ID', async () => {
      jest.mocked(redisConfig.validateTenantId).mockReturnValue(false);
      
      const config: WatcherConfig = {
        paths: [tempDir],
        tenantId: 'invalid@tenant',
      };

      await expect(watcher.initialize(config)).rejects.toThrow('Invalid tenant ID format');
    });

    it('should not initialize twice', async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };

      await watcher.initialize(config);
      await watcher.initialize(config); // Should not throw

      const status = watcher.getWatcherStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('tenant file watching', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
    });

    it('should start tenant file watcher', async () => {
      const tenantId = 'test-tenant';
      const patterns = [path.join(tempDir, '**/*')];

      await expect(watcher.watchTenantFiles(tenantId, patterns)).resolves.not.toThrow();
      
      const status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBeGreaterThan(0);
    });

    it('should reject invalid tenant ID for watching', async () => {
      jest.mocked(redisConfig.validateTenantId).mockReturnValue(false);
      
      const tenantId = 'invalid@tenant';
      const patterns = [path.join(tempDir, '**/*')];

      await expect(watcher.watchTenantFiles(tenantId, patterns)).rejects.toThrow('Invalid tenant ID format');
    });

    it('should not create duplicate tenant watchers', async () => {
      const tenantId = 'test-tenant';
      const patterns = [path.join(tempDir, '**/*')];

      await watcher.watchTenantFiles(tenantId, patterns);
      await watcher.watchTenantFiles(tenantId, patterns); // Should not throw

      const status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBe(1);
    });
  });

  describe('global file watching', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
    });

    it('should start global file watcher', async () => {
      const patterns = [path.join(tempDir, '**/*')];

      await expect(watcher.watchGlobalFiles(patterns)).resolves.not.toThrow();
      
      const status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBeGreaterThan(0);
    });

    it('should not create duplicate global watchers', async () => {
      const patterns = [path.join(tempDir, '**/*')];

      await watcher.watchGlobalFiles(patterns);
      await watcher.watchGlobalFiles(patterns); // Should not throw

      const status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBe(1);
    });
  });

  describe('file change detection', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
        enableChecksumValidation: true,
        enableConflictDetection: true,
      };
      await watcher.initialize(config);
    });

    it('should detect file creation', (done) => {
      const patterns = [path.join(tempDir, '**/*')];
      
      watcher.watchGlobalFiles(patterns).then(() => {
        watcher.once('fileChange', (event: FileChangeEvent) => {
          expect(event.type).toBe('create');
          expect(event.filePath).toBe(testFile);
          expect(event.checksum).toBeDefined();
          expect(event.timestamp).toBeInstanceOf(Date);
          done();
        });

        // Create test file after a short delay to ensure watcher is ready
        setTimeout(async () => {
          await fs.writeFile(testFile, 'test content');
        }, 100);
      });
    });

    it('should detect file modification', (done) => {
      const patterns = [path.join(tempDir, '**/*')];
      
      // First create the file
      fs.writeFile(testFile, 'initial content').then(() => {
        watcher.watchGlobalFiles(patterns).then(() => {
          let changeCount = 0;
          
          watcher.on('fileChange', (event: FileChangeEvent) => {
            changeCount++;
            
            if (changeCount === 1) {
              // First event should be 'create' from initial file
              expect(event.type).toBe('create');
            } else if (changeCount === 2) {
              // Second event should be 'update' from modification
              expect(event.type).toBe('update');
              expect(event.filePath).toBe(testFile);
              done();
            }
          });

          // Modify file after watcher is ready
          setTimeout(async () => {
            await fs.writeFile(testFile, 'modified content');
          }, 200);
        });
      });
    });

    it('should detect file deletion', (done) => {
      const patterns = [path.join(tempDir, '**/*')];
      
      // First create the file
      fs.writeFile(testFile, 'content to delete').then(() => {
        watcher.watchGlobalFiles(patterns).then(() => {
          let changeCount = 0;
          
          watcher.on('fileChange', (event: FileChangeEvent) => {
            changeCount++;
            
            if (changeCount === 2) { // Skip the initial 'create' event
              expect(event.type).toBe('delete');
              expect(event.filePath).toBe(testFile);
              expect(event.checksum).toBe('');
              done();
            }
          });

          // Delete file after watcher is ready
          setTimeout(async () => {
            await fs.unlink(testFile);
          }, 200);
        });
      });
    });
  });

  describe('conflict detection', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
        enableConflictDetection: true,
      };
      await watcher.initialize(config);
      
      // Create test file
      await fs.writeFile(testFile, 'initial content');
    });

    it('should detect checksum conflicts', async () => {
      // Mock existing sync state with different checksum
      jest.mocked(dbService.getSyncState).mockResolvedValue({
        id: 'test-id',
        resourceType: 'file',
        resourceId: testFile,
        tenantId: null,
        version: 1,
        checksum: 'different-checksum',
        lastSync: new Date(),
        syncedBy: 'test',
        metadata: null,
      });

      const conflicts = await watcher.detectConflicts(testFile);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('checksum');
      expect(conflicts[0].filePath).toBe(testFile);
    });

    it('should handle conflict detection errors gracefully', async () => {
      jest.mocked(dbService.getSyncState).mockRejectedValue(new Error('Database error'));

      const conflicts = await watcher.detectConflicts(testFile);
      
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('checksum operations', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
      
      // Create test file
      await fs.writeFile(testFile, 'test content for checksum');
    });

    it('should calculate file checksum', async () => {
      const checksum = await watcher.refreshFileChecksum(testFile);
      
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBe(64); // SHA-256 hex length
    });

    it('should cache file checksums', async () => {
      await watcher.refreshFileChecksum(testFile);
      
      const cachedChecksum = watcher.getFileChecksum(testFile);
      expect(cachedChecksum).toBeDefined();
    });

    it('should return consistent checksums for same content', async () => {
      const checksum1 = await watcher.refreshFileChecksum(testFile);
      const checksum2 = await watcher.refreshFileChecksum(testFile);
      
      expect(checksum1).toBe(checksum2);
    });
  });

  describe('watcher management', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
    });

    it('should stop specific watcher', async () => {
      const patterns = [path.join(tempDir, '**/*')];
      await watcher.watchGlobalFiles(patterns);
      
      let status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBe(1);
      
      await watcher.stopWatcher('global');
      
      status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBe(0);
    });

    it('should stop all watchers', async () => {
      const patterns = [path.join(tempDir, '**/*')];
      await watcher.watchGlobalFiles(patterns);
      await watcher.watchTenantFiles('test-tenant', patterns);
      
      let status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBe(2);
      
      await watcher.stopAllWatchers();
      
      status = watcher.getWatcherStatus();
      expect(status.activeWatchers).toBe(0);
      expect(status.initialized).toBe(false);
    });
  });

  describe('health check', () => {
    it('should report unhealthy when not initialized', async () => {
      const health = await watcher.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.details.initialized).toBe(false);
    });

    it('should report degraded when initialized but no watchers', async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
      
      const health = await watcher.healthCheck();
      
      expect(health.status).toBe('degraded');
      expect(health.details.initialized).toBe(true);
      expect(health.details.activeWatchers).toBe(0);
    });

    it('should report healthy when initialized with active watchers', async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
      
      const patterns = [path.join(tempDir, '**/*')];
      await watcher.watchGlobalFiles(patterns);
      
      const health = await watcher.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.details.initialized).toBe(true);
      expect(health.details.activeWatchers).toBeGreaterThan(0);
    });
  });

  describe('pending changes', () => {
    beforeEach(async () => {
      const config: WatcherConfig = {
        paths: [tempDir],
      };
      await watcher.initialize(config);
    });

    it('should track pending changes', () => {
      const pendingChanges = watcher.getPendingChanges();
      expect(Array.isArray(pendingChanges)).toBe(true);
    });

    it('should clear pending changes', () => {
      watcher.clearPendingChanges();
      
      const pendingChanges = watcher.getPendingChanges();
      expect(pendingChanges).toHaveLength(0);
    });
  });
});