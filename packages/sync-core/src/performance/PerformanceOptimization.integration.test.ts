import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
const vi = jest;
import { PerformanceOptimizationService } from './PerformanceOptimizationService.js';
import { HorizontalScalingCoordinator } from './HorizontalScalingCoordinator.js';
import { FileChangeBatcher } from './FileChangeBatcher.js';
import { SyncLRUCache } from './SyncLRUCache.js';
import { SyncPerformanceTelemetry } from './SyncPerformanceTelemetry.js';
import { FileChangeEvent } from '../watchers/EnhancedFileSystemWatcher.js';

// Mock Redis for integration testing
const mockRedis = {
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  sadd: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  srem: jest.fn().mockResolvedValue(1),
  del: jest.fn().mockResolvedValue(1),
  lpush: jest.fn().mockResolvedValue(1),
  lrange: jest.fn().mockResolvedValue([]),
  publish: jest.fn().mockResolvedValue(1)
};

const mockMetrics = {
  recordMetric: jest.fn()
};

describe('Performance Optimization Integration', () => {
  let service: PerformanceOptimizationService;

  beforeEach(async () => {
    const config = {
      scaling: {
        instanceId: 'integration-test',
        heartbeatInterval: 1000,
        loadThreshold: 80,
        redistributionDelay: 2000,
        clusterKey: 'test-cluster'
      },
      batching: {
        maxBatchSize: 5,
        batchTimeout: 500,
        debounceDelay: 50,
        priorityPatterns: ['config', 'template']
      },
      caching: {
        maxSize: 100,
        maxMemory: 1024 * 100, // 100KB
        ttl: 30000, // 30 seconds
        cleanupInterval: 5000,
        tenantIsolation: true
      },
      telemetry: {
        metricsInterval: 1000,
        retentionPeriod: 60000,
        aggregationWindow: 5000,
        enableDetailedMetrics: true,
        maxMetricsBuffer: 1000
      },
      enableOptimizations: true,
      memoryThreshold: 1024 * 1024 * 50, // 50MB
      cpuThreshold: 70
    };

    service = new PerformanceOptimizationService(
      mockRedis as any,
      mockMetrics as any,
      config
    );

    await service.initialize();
  });

  afterEach(async () => {
    await service.shutdown();
    jest.clearAllMocks();
  });

  describe('end-to-end file processing', () => {
    it('should process multiple file changes through complete pipeline', async () => {
      const fileChanges: FileChangeEvent[] = [
        {
          type: 'create',
          filePath: '/config/app.json',
          tenantId: 'tenant1',
          timestamp: new Date(),
          checksum: 'hash1',
          metadata: { size: 1024 }
        },
        {
          type: 'update',
          filePath: '/templates/prompt.md',
          tenantId: 'tenant1',
          timestamp: new Date(),
          checksum: 'hash2',
          metadata: { size: 2048 }
        },
        {
          type: 'delete',
          filePath: '/data/temp.txt',
          tenantId: 'tenant2',
          timestamp: new Date(),
          checksum: 'hash3',
          metadata: { size: 512 }
        }
      ];

      // Process all file changes
      for (const change of fileChanges) {
        await service.processFileChange(change);
      }

      // Wait for batching to complete
      await new Promise(resolve => setTimeout(resolve, 600));

      const metrics = await service.getPerformanceMetrics();
      expect(metrics.batching.processedBatches).toBeGreaterThan(0);
    });

    it('should handle high-volume file changes with batching', async () => {
      const changes: FileChangeEvent[] = [];
      
      // Generate 20 file changes
      for (let i = 0; i < 20; i++) {
        changes.push({
          type: 'update',
          filePath: `/files/file${i}.txt`,
          tenantId: i % 2 === 0 ? 'tenant1' : 'tenant2',
          timestamp: new Date(),
          checksum: `hash${i}`,
          metadata: { size: 100 * i }
        });
      }

      // Process all changes rapidly
      const promises = changes.map(change => service.processFileChange(change));
      await Promise.all(promises);

      // Wait for batching
      await new Promise(resolve => setTimeout(resolve, 1000));

      const metrics = await service.getPerformanceMetrics();
      expect(metrics.batching.processedBatches).toBeGreaterThan(1);
    });
  });

  describe('caching with performance tracking', () => {
    it('should cache data and track performance metrics', async () => {
      const testData = { 
        id: 1, 
        name: 'test', 
        data: new Array(100).fill('x').join('') 
      };

      // Set cache data
      service.setCachedData('perf-test', testData, 'tenant1');
      
      // Get cache data multiple times
      for (let i = 0; i < 10; i++) {
        const result = service.getCachedData('perf-test', 'tenant1');
        expect(result).toEqual(testData);
      }

      // Check cache miss
      const missResult = service.getCachedData('non-existent', 'tenant1');
      expect(missResult).toBeUndefined();

      const metrics = await service.getPerformanceMetrics();
      expect(metrics.caching.hitRate).toBeGreaterThan(0);
    });

    it('should handle cache eviction under memory pressure', async () => {
      // Fill cache beyond capacity
      for (let i = 0; i < 150; i++) {
        const largeData = new Array(1000).fill(`data-${i}`).join('');
        service.setCachedData(`key-${i}`, largeData, 'tenant1');
      }

      const metrics = await service.getPerformanceMetrics();
      expect(metrics.caching.evictionCount).toBeGreaterThan(0);
    });
  });

  describe('scaling coordination', () => {
    it('should coordinate work distribution across instances', async () => {
      // Mock multiple instances
      mockRedis.smembers.mockResolvedValue(['instance1', 'instance2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({
          instanceId: 'instance1',
          hostname: 'host1',
          port: 3001,
          capabilities: ['file-sync'],
          load: 30,
          lastHeartbeat: new Date(),
          status: 'active'
        }))
        .mockResolvedValueOnce(JSON.stringify({
          instanceId: 'instance2',
          hostname: 'host2',
          port: 3002,
          capabilities: ['file-sync'],
          load: 60,
          lastHeartbeat: new Date(),
          status: 'active'
        }));

      const workload = { files: ['file1.txt', 'file2.txt'] };
      const targetInstance = await service.distributeWork('file-sync', workload);

      expect(['instance1', 'instance2']).toContain(targetInstance);
      expect(mockRedis.lpush).toHaveBeenCalled();
    });

    it('should handle instance failures gracefully', async () => {
      // Mock stale instance
      mockRedis.smembers.mockResolvedValue(['stale-instance']);
      mockRedis.get.mockResolvedValue(JSON.stringify({
        instanceId: 'stale-instance',
        hostname: 'stale-host',
        port: 3000,
        capabilities: ['file-sync'],
        load: 50,
        lastHeartbeat: new Date(Date.now() - 300000), // 5 minutes ago
        status: 'active'
      }));

      const workload = { files: ['file1.txt'] };
      
      await expect(service.distributeWork('file-sync', workload))
        .rejects.toThrow('No available instances');
    });
  });

  describe('performance monitoring and optimization', () => {
    it('should collect and report comprehensive metrics', async () => {
      // Generate some activity
      await service.processFileChange({
        type: 'update',
        filePath: '/test.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash',
        metadata: { size: 1024 }
      });

      service.setCachedData('test', { data: 'value' }, 'tenant1');
      service.getCachedData('test', 'tenant1');

      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = await service.getPerformanceMetrics();
      
      expect(metrics.scaling.instanceCount).toBeGreaterThanOrEqual(0);
      expect(metrics.batching.pendingChanges).toBeGreaterThanOrEqual(0);
      expect(metrics.caching.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.system.memoryUsage).toBeGreaterThan(0);
    });

    it('should trigger optimization under load', async () => {
      // Simulate high memory usage by filling cache
      for (let i = 0; i < 50; i++) {
        const largeData = new Array(2000).fill(`load-test-${i}`).join('');
        service.setCachedData(`load-${i}`, largeData);
      }

      // Force optimization
      await service.forceOptimization();

      const metricsAfter = await service.getPerformanceMetrics();
      expect(metricsAfter.caching.memoryUsage).toBeDefined();
    });
  });

  describe('tenant isolation', () => {
    it('should maintain tenant isolation across all components', async () => {
      // Test file changes for different tenants
      await service.processFileChange({
        type: 'create',
        filePath: '/tenant1/config.json',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash1',
        metadata: { size: 1024 }
      });

      await service.processFileChange({
        type: 'create',
        filePath: '/tenant2/config.json',
        tenantId: 'tenant2',
        timestamp: new Date(),
        checksum: 'hash2',
        metadata: { size: 1024 }
      });

      // Test cache isolation
      service.setCachedData('config', { tenant: 'tenant1' }, 'tenant1');
      service.setCachedData('config', { tenant: 'tenant2' }, 'tenant2');

      const tenant1Data = service.getCachedData('config', 'tenant1');
      const tenant2Data = service.getCachedData('config', 'tenant2');

      expect(tenant1Data).toEqual({ tenant: 'tenant1' });
      expect(tenant2Data).toEqual({ tenant: 'tenant2' });
    });
  });

  describe('error handling and resilience', () => {
    it('should handle Redis failures gracefully', async () => {
      // Simulate Redis failure
      mockRedis.lpush.mockRejectedValueOnce(new Error('Redis connection lost'));

      const workload = { files: ['test.txt'] };
      
      await expect(service.distributeWork('file-sync', workload))
        .rejects.toThrow('Redis connection lost');

      // Service should still be functional for other operations
      service.setCachedData('test', 'value');
      expect(service.getCachedData('test')).toBe('value');
    });

    it('should recover from component failures', async () => {
      // Test that service continues to work even if some operations fail
      const fileChange: FileChangeEvent = {
        type: 'update',
        filePath: '/test.txt',
        tenantId: 'tenant1',
        timestamp: new Date(),
        checksum: 'hash',
        metadata: { size: 1024 }
      };

      // This should work even if other components have issues
      await expect(service.processFileChange(fileChange)).resolves.not.toThrow();
    });
  });
});