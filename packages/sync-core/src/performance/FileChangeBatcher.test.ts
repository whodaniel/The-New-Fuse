import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
const vi = jest;
import { FileChangeBatcher, BatchConfig, BatchedFileChange } from './FileChangeBatcher.js';
import { FileChangeEvent } from '../watchers/EnhancedFileSystemWatcher.js';

describe('FileChangeBatcher', () => {
  let batcher: FileChangeBatcher;
  let config: BatchConfig;
  let processedBatches: BatchedFileChange[] = [];

  const mockBatchHandler = async (batch: BatchedFileChange): Promise<void> => {
    processedBatches.push(batch);
  };

  beforeEach(() => {
    config = {
      maxBatchSize: 5,
      batchTimeout: 100,
      debounceDelay: 50,
      priorityPatterns: ['config', 'template']
    };

    processedBatches = [];
    batcher = new FileChangeBatcher(config, mockBatchHandler);
  });

  afterEach(async () => {
    await batcher.shutdown();
  });

  describe('batching behavior', () => {
    it('should batch file changes by size', async () => {
      const changes: FileChangeEvent[] = [];
      
      // Create 6 changes (exceeds maxBatchSize of 5)
      for (let i = 0; i < 6; i++) {
        changes.push({
          type: 'update',
          filePath: `/test/file${i}.txt`,
          tenantId: 'tenant1',
          timestamp: new Date(),
          checksum: `hash${i}`,
          metadata: { size: 1024 }
        });
      }

      // Add all changes
      for (const change of changes) {
        await batcher.addFileChange(change);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processedBatches.length).toBeGreaterThan(0);
      
      // Should have processed at least one batch
      const totalProcessed = processedBatches.reduce((sum, batch) => sum + batch.events.length, 0);
      expect(totalProcessed).toBe(6);
    });

    it('should batch file changes by timeout', async () => {
      const change: FileChangeEvent = {
        type: 'update',
        filePath: '/test/file.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash1',
        metadata: { size: 1024 }
      };

      await batcher.addFileChange(change);

      // Wait for debounce + timeout
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processedBatches.length).toBe(1);
      expect(processedBatches[0].events.length).toBe(1);
    });

    it('should debounce rapid file changes', async () => {
      const change: FileChangeEvent = {
        type: 'update',
        filePath: '/test/same-file.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash1',
        metadata: { size: 1024 }
      };

      // Add same file multiple times rapidly
      await batcher.addFileChange(change);
      await batcher.addFileChange({ ...change, checksum: 'hash2' });
      await batcher.addFileChange({ ...change, checksum: 'hash3' });

      // Wait for debounce and processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processedBatches.length).toBe(1);
      expect(processedBatches[0].events.length).toBe(1);
      expect(processedBatches[0].events[0].checksum).toBe('hash3'); // Should have latest
    });
  });

  describe('priority handling', () => {
    it('should prioritize high-priority files', async () => {
      const highPriorityChange: FileChangeEvent = {
        type: 'update',
        filePath: '/config/app.json',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash1',
        metadata: { size: 1024 }
      };

      const normalChange: FileChangeEvent = {
        type: 'update',
        filePath: '/data/file.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash2',
        metadata: { size: 1024 }
      };

      await batcher.addFileChange(normalChange);
      await batcher.addFileChange(highPriorityChange);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processedBatches.length).toBeGreaterThan(0);
      
      // High priority should be processed first or separately
      const highPriorityBatch = processedBatches.find(batch => batch.priority === 'high');
      expect(highPriorityBatch).toBeDefined();
    });
  });

  describe('tenant isolation', () => {
    it('should batch changes by tenant', async () => {
      const tenant1Change: FileChangeEvent = {
        type: 'update',
        filePath: '/file1.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash1',
        metadata: { size: 1024 }
      };

      const tenant2Change: FileChangeEvent = {
        type: 'update',
        filePath: '/file2.txt',
        tenantId: 'tenant2',
        timestamp: new Date(),
        checksum: 'hash2',
        metadata: { size: 1024 }
      };

      await batcher.addFileChange(tenant1Change);
      await batcher.addFileChange(tenant2Change);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processedBatches.length).toBeGreaterThanOrEqual(2);
      
      const tenant1Batches = processedBatches.filter(batch => batch.tenantId === 'tenant1');
      const tenant2Batches = processedBatches.filter(batch => batch.tenantId === 'tenant2');
      
      expect(tenant1Batches.length).toBeGreaterThan(0);
      expect(tenant2Batches.length).toBeGreaterThan(0);
    });
  });

  describe('statistics and monitoring', () => {
    it('should provide batch statistics', () => {
      const stats = batcher.getBatchStats();
      
      expect(stats).toHaveProperty('pendingChanges');
      expect(stats).toHaveProperty('activeBatches');
      expect(stats).toHaveProperty('activeTimers');
      
      expect(typeof stats.pendingChanges).toBe('number');
      expect(typeof stats.activeBatches).toBe('number');
      expect(typeof stats.activeTimers).toBe('number');
    });

    it('should flush all pending batches', async () => {
      const changes: FileChangeEvent[] = [];
      
      for (let i = 0; i < 3; i++) {
        changes.push({
          type: 'update',
          filePath: `/test/file${i}.txt`,
          tenantId: 'tenant1',
          timestamp: new Date(),
          checksum: `hash${i}`,
          metadata: { size: 1024 }
        });
      }

      // Add changes but don't wait for natural processing
      for (const change of changes) {
        await batcher.addFileChange(change);
      }

      // Force flush
      await batcher.flushAll();

      expect(processedBatches.length).toBeGreaterThan(0);
      
      const totalProcessed = processedBatches.reduce((sum, batch) => sum + batch.events.length, 0);
      expect(totalProcessed).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle batch processing errors gracefully', async () => {
      const errorBatcher = new FileChangeBatcher(config, async () => {
        throw new Error('Processing failed');
      });

      const change: FileChangeEvent = {
        type: 'update',
        filePath: '/test/file.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash1',
        metadata: { size: 1024 }
      };

      // Should not throw during add
      await errorBatcher.addFileChange(change);
      
      // Wait for processing attempt
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should complete without throwing
      expect(true).toBe(true);

      await errorBatcher.shutdown();
    });
  });
});