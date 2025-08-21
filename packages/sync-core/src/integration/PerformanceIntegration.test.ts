import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { performance } from 'perf_hooks';

// Import performance-related services
import { SyncOrchestrator } from '../services/SyncOrchestrator';
import { MasterClockService } from '../services/MasterClockService';
import { EnhancedFileSystemWatcher } from '../watchers/EnhancedFileSystemWatcher';
import { FileChangeBatcher } from '../performance/FileChangeBatcher';
import { HorizontalScalingCoordinator } from '../performance/HorizontalScalingCoordinator';
import { SyncLRUCache } from '../performance/SyncLRUCache';
import { SyncPerformanceTelemetry } from '../performance/SyncPerformanceTelemetry';

describe('Performance Integration Tests', () => {
  let testModule: TestingModule;
  let prismaClient: PrismaClient;
  let redisClient: Redis;
  let tempDir: string;
  
  // Service instances
  let syncOrchestrator: SyncOrchestrator;
  let masterClockService: MasterClockService;
  let fileSystemWatcher: EnhancedFileSystemWatcher;
  let fileChangeBatcher: FileChangeBatcher;
  let scalingCoordinator: HorizontalScalingCoordinator;
  let lruCache: SyncLRUCache;
  let performanceTelemetry: SyncPerformanceTelemetry;

  // Mock services
  const mockWebSocketService = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    broadcastToAllUsers: jest.fn().mockResolvedValue(undefined),
  };

  const mockMetricsService = {
    collectMetric: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockResolvedValue({}),
    getSystemMetrics: jest.fn().mockResolvedValue({}),
    getApplicationMetrics: jest.fn().mockResolvedValue({}),
    generateReport: jest.fn().mockResolvedValue({}),
  };

  beforeAll(async () => {
    // Setup test environment
    const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sync_perf_test';
    const testRedisUrl = process.env.TEST_REDIS_URL || 'redis://localhost:6379/14';

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-perf-test-'));

    prismaClient = new PrismaClient({
      datasources: {
        db: { url: testDatabaseUrl },
      },
    });

    redisClient = new Redis(testRedisUrl);
    await redisClient.flushdb();
  });

  afterAll(async () => {
    try {
      await prismaClient.$disconnect();
      await redisClient.disconnect();
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    testModule = await Test.createTestingModule({
      providers: [
        SyncOrchestrator,
        MasterClockService,
        EnhancedFileSystemWatcher,
        FileChangeBatcher,
        HorizontalScalingCoordinator,
        SyncLRUCache,
        SyncPerformanceTelemetry,
        {
          provide: PrismaClient,
          useValue: prismaClient,
        },
        {
          provide: Redis,
          useValue: redisClient,
        },
        {
          provide: 'IWebSocketService',
          useValue: mockWebSocketService,
        },
        {
          provide: 'IMetricsService',
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    // Get service instances
    syncOrchestrator = testModule.get<SyncOrchestrator>(SyncOrchestrator);
    masterClockService = testModule.get<MasterClockService>(MasterClockService);
    fileSystemWatcher = testModule.get<EnhancedFileSystemWatcher>(EnhancedFileSystemWatcher);
    fileChangeBatcher = testModule.get<FileChangeBatcher>(FileChangeBatcher);
    scalingCoordinator = testModule.get<HorizontalScalingCoordinator>(HorizontalScalingCoordinator);
    lruCache = testModule.get<SyncLRUCache>(SyncLRUCache);
    performanceTelemetry = testModule.get<SyncPerformanceTelemetry>(SyncPerformanceTelemetry);

    // Initialize services
    await initializeServices();
  });

  afterEach(async () => {
    await shutdownServices();
    await cleanupTestData();
    jest.clearAllMocks();
  });

  async function initializeServices() {
    await masterClockService.initialize({
      syncIntervalMs: 100, // Faster for performance testing
      driftThresholdMs: 50,
      maxDriftMs: 200,
      correctionIntervalMs: 1000,
      instanceId: 'perf-test-clock',
      redisChannels: {
        clockSync: 'perf:sync:clock:sync',
        driftAlert: 'perf:sync:clock:drift',
        correction: 'perf:sync:clock:correction',
      },
    });

    await fileSystemWatcher.initialize({
      paths: [tempDir],
      debounceMs: 50, // Faster debounce for testing
      enableChecksums: true,
    });

    await syncOrchestrator.onModuleInit();
    
    await fileChangeBatcher.initialize({
      batchSize: 100,
      flushIntervalMs: 500,
      maxBatchAge: 2000,
    });

    await scalingCoordinator.initialize({
      instanceId: 'perf-test-instance',
      coordinationChannel: 'perf:coordination',
      heartbeatIntervalMs: 1000,
    });

    performanceTelemetry.startCollection();
  }

  async function shutdownServices() {
    try {
      performanceTelemetry.stopCollection();
      await scalingCoordinator.shutdown();
      await fileChangeBatcher.shutdown();
      await masterClockService.shutdown();
      await fileSystemWatcher.stopAllWatchers();
      await syncOrchestrator.onModuleDestroy();
    } catch (error) {
      console.warn('Service shutdown error:', error);
    }
  }

  async function cleanupTestData() {
    await prismaClient.syncConflict.deleteMany({});
    await prismaClient.syncState.deleteMany({});
    await redisClient.flushdb();
  }

  describe('High-Volume Sync Operations', () => {
    it('should handle 1000 concurrent sync operations efficiently', async () => {
      const operationCount = 1000;
      const tenantCount = 10;
      const startTime = performance.now();

      // Create test tenants
      const tenants = Array.from({ length: tenantCount }, (_, i) => ({
        id: `perf-tenant-${i}`,
        email: `perf${i}@test.com`,
        role: 'USER',
      }));

      for (const tenant of tenants) {
        await prismaClient.user.upsert({
          where: { id: tenant.id },
          update: {},
          create: {
            id: tenant.id,
            email: tenant.email,
            role: tenant.role as any,
            hashedPassword: 'test-password',
          },
        });
      }

      await syncOrchestrator.onModuleInit();

      // Generate concurrent operations
      const promises = Array.from({ length: operationCount }, (_, i) => {
        const tenantId = tenants[i % tenantCount].id;
        const data = {
          id: `perf-data-${i}`,
          content: `Performance test data ${i}`,
          timestamp: Date.now(),
        };
        return syncOrchestrator.syncTenantData(tenantId, 'agent', data);
      });

      // Execute all operations
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const operationsPerSecond = (operationCount / duration) * 1000;

      // Performance assertions
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(operationsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec

      // Verify all operations completed
      const syncStates = await prismaClient.syncState.findMany({
        where: {
          resourceId: { startsWith: 'perf-data-' },
        },
      });

      expect(syncStates.length).toBe(operationCount);

      console.log(`Performance: ${operationCount} operations in ${duration.toFixed(2)}ms (${operationsPerSecond.toFixed(2)} ops/sec)`);
    });

    it('should maintain performance under sustained load', async () => {
      const batchSize = 100;
      const batchCount = 10;
      const batchIntervalMs = 1000;
      const performanceMetrics: number[] = [];

      // Create test tenant
      await prismaClient.user.upsert({
        where: { id: 'sustained-load-tenant' },
        update: {},
        create: {
          id: 'sustained-load-tenant',
          email: 'sustained@test.com',
          role: 'USER',
          hashedPassword: 'test-password',
        },
      });

      await syncOrchestrator.onModuleInit();

      // Execute batches with intervals
      for (let batch = 0; batch < batchCount; batch++) {
        const batchStartTime = performance.now();

        const promises = Array.from({ length: batchSize }, (_, i) => {
          const data = {
            id: `sustained-${batch}-${i}`,
            batch,
            index: i,
            timestamp: Date.now(),
          };
          return syncOrchestrator.syncTenantData('sustained-load-tenant', 'agent', data);
        });

        await Promise.all(promises);

        const batchEndTime = performance.now();
        const batchDuration = batchEndTime - batchStartTime;
        const batchOpsPerSec = (batchSize / batchDuration) * 1000;

        performanceMetrics.push(batchOpsPerSec);

        console.log(`Batch ${batch + 1}: ${batchSize} operations in ${batchDuration.toFixed(2)}ms (${batchOpsPerSec.toFixed(2)} ops/sec)`);

        // Wait between batches
        if (batch < batchCount - 1) {
          await new Promise(resolve => setTimeout(resolve, batchIntervalMs));
        }
      }

      // Analyze performance degradation
      const firstBatchPerf = performanceMetrics[0];
      const lastBatchPerf = performanceMetrics[performanceMetrics.length - 1];
      const performanceDegradation = (firstBatchPerf - lastBatchPerf) / firstBatchPerf;

      // Performance should not degrade by more than 20%
      expect(performanceDegradation).toBeLessThan(0.2);

      // All batches should maintain minimum performance
      for (const metric of performanceMetrics) {
        expect(metric).toBeGreaterThan(20); // At least 20 ops/sec
      }
    });
  });

  describe('File System Performance', () => {
    it('should handle rapid file changes efficiently', async () => {
      const fileCount = 500;
      const changeCount = 3; // Changes per file
      const files: string[] = [];

      // Create initial files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `perf-file-${i}.txt`);
        await fs.writeFile(filePath, `Initial content ${i}`);
        files.push(filePath);
      }

      // Wait for initial processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const startTime = performance.now();

      // Perform rapid changes
      for (let change = 0; change < changeCount; change++) {
        const changePromises = files.map(async (file, index) => {
          const content = `Updated content ${index} - change ${change}`;
          await fs.writeFile(file, content);
        });

        await Promise.all(changePromises);
        
        // Small delay between change batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait for all changes to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalChanges = fileCount * changeCount;
      const changesPerSecond = (totalChanges / duration) * 1000;

      console.log(`File changes: ${totalChanges} changes in ${duration.toFixed(2)}ms (${changesPerSecond.toFixed(2)} changes/sec)`);

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(changesPerSecond).toBeGreaterThan(50); // At least 50 changes/sec

      // Verify checksums were updated
      let updatedChecksums = 0;
      for (const file of files) {
        const checksum = fileSystemWatcher.getFileChecksum(file);
        if (checksum) {
          updatedChecksums++;
        }
      }

      expect(updatedChecksums).toBeGreaterThan(fileCount * 0.8); // At least 80% processed
    });

    it('should batch file changes effectively', async () => {
      const fileCount = 200;
      const files: string[] = [];

      // Create files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(tempDir, `batch-file-${i}.txt`);
        await fs.writeFile(filePath, `Batch content ${i}`);
        files.push(filePath);
      }

      // Monitor batching metrics
      const initialBatchCount = fileChangeBatcher.getMetrics().batchesProcessed;

      const startTime = performance.now();

      // Perform simultaneous changes (should be batched)
      const changePromises = files.map(async (file, index) => {
        await fs.writeFile(file, `Batched update ${index}`);
      });

      await Promise.all(changePromises);

      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const endTime = performance.now();
      const duration = endTime - startTime;

      const finalBatchCount = fileChangeBatcher.getMetrics().batchesProcessed;
      const batchesCreated = finalBatchCount - initialBatchCount;

      console.log(`Batching: ${fileCount} changes processed in ${batchesCreated} batches over ${duration.toFixed(2)}ms`);

      // Should create fewer batches than individual files (batching is working)
      expect(batchesCreated).toBeLessThan(fileCount / 2);
      expect(batchesCreated).toBeGreaterThan(0);

      // Should complete efficiently
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Performance', () => {
    it('should manage memory efficiently with LRU cache', async () => {
      const cacheSize = 1000;
      const testDataSize = 2000; // More than cache size

      // Configure cache
      lruCache.configure({
        maxSize: cacheSize,
        ttlMs: 60000,
        cleanupIntervalMs: 5000,
      });

      const initialMemory = process.memoryUsage();

      // Fill cache beyond capacity
      for (let i = 0; i < testDataSize; i++) {
        const key = `cache-key-${i}`;
        const data = {
          id: i,
          content: 'x'.repeat(1000), // 1KB of data
          timestamp: Date.now(),
        };
        
        lruCache.set(key, data);
      }

      const afterFillMemory = process.memoryUsage();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();

      // Verify cache size is maintained
      const cacheMetrics = lruCache.getMetrics();
      expect(cacheMetrics.size).toBeLessThanOrEqual(cacheSize);

      // Memory should not grow unbounded
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const expectedMaxMemory = cacheSize * 1200; // 1KB + overhead per item

      expect(memoryIncrease).toBeLessThan(expectedMaxMemory);

      console.log(`Memory: Cache size ${cacheMetrics.size}, Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle memory pressure gracefully', async () => {
      const largeDataSize = 10000;
      const itemSize = 5000; // 5KB per item

      // Create test tenant
      await prismaClient.user.upsert({
        where: { id: 'memory-pressure-tenant' },
        update: {},
        create: {
          id: 'memory-pressure-tenant',
          email: 'memory@test.com',
          role: 'USER',
          hashedPassword: 'test-password',
        },
      });

      await syncOrchestrator.onModuleInit();

      const initialMemory = process.memoryUsage();

      // Create memory pressure with large sync operations
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < largeDataSize; i++) {
        const data = {
          id: `memory-pressure-${i}`,
          largeContent: 'x'.repeat(itemSize),
          timestamp: Date.now(),
        };

        promises.push(
          syncOrchestrator.syncTenantData('memory-pressure-tenant', 'agent', data)
        );

        // Process in batches to avoid overwhelming the system
        if (promises.length >= 100) {
          await Promise.all(promises);
          promises.length = 0;

          // Force garbage collection periodically
          if (global.gc && i % 1000 === 0) {
            global.gc();
          }
        }
      }

      // Process remaining promises
      if (promises.length > 0) {
        await Promise.all(promises);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerItem = memoryIncrease / largeDataSize;

      console.log(`Memory pressure: ${largeDataSize} items, ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase, ${memoryPerItem.toFixed(0)} bytes/item`);

      // Memory per item should be reasonable (less than 2x the item size)
      expect(memoryPerItem).toBeLessThan(itemSize * 2);

      // Verify operations completed successfully
      const syncStates = await prismaClient.syncState.findMany({
        where: {
          resourceId: { startsWith: 'memory-pressure-' },
        },
      });

      expect(syncStates.length).toBe(largeDataSize);
    });
  });

  describe('Horizontal Scaling Performance', () => {
    it('should coordinate multiple instances efficiently', async () => {
      const instanceCount = 5;
      const operationsPerInstance = 100;
      const coordinators: HorizontalScalingCoordinator[] = [];

      // Create multiple coordinator instances
      for (let i = 0; i < instanceCount; i++) {
        const coordinator = new HorizontalScalingCoordinator(redisClient, mockMetricsService);
        await coordinator.initialize({
          instanceId: `perf-instance-${i}`,
          coordinationChannel: 'perf:coordination',
          heartbeatIntervalMs: 500,
        });
        coordinators.push(coordinator);
      }

      // Wait for coordination to establish
      await new Promise(resolve => setTimeout(resolve, 1000));

      const startTime = performance.now();

      // Distribute work across instances
      const allPromises: Promise<void>[] = [];
      
      for (let i = 0; i < instanceCount; i++) {
        const coordinator = coordinators[i];
        
        for (let j = 0; j < operationsPerInstance; j++) {
          const workItem = {
            id: `work-${i}-${j}`,
            instanceId: `perf-instance-${i}`,
            data: `Work item ${j} for instance ${i}`,
          };
          
          allPromises.push(
            coordinator.distributeWork('sync_operation', workItem)
          );
        }
      }

      await Promise.all(allPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalOperations = instanceCount * operationsPerInstance;
      const operationsPerSecond = (totalOperations / duration) * 1000;

      console.log(`Scaling: ${totalOperations} operations across ${instanceCount} instances in ${duration.toFixed(2)}ms (${operationsPerSecond.toFixed(2)} ops/sec)`);

      // Performance assertions
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(operationsPerSecond).toBeGreaterThan(30); // At least 30 ops/sec

      // Verify work distribution
      for (const coordinator of coordinators) {
        const metrics = coordinator.getMetrics();
        expect(metrics.workItemsProcessed).toBeGreaterThan(0);
      }

      // Cleanup coordinators
      for (const coordinator of coordinators) {
        await coordinator.shutdown();
      }
    });

    it('should handle instance failures gracefully', async () => {
      const stableInstanceCount = 3;
      const failingInstanceCount = 2;
      const operationsPerInstance = 50;
      const coordinators: HorizontalScalingCoordinator[] = [];

      // Create stable instances
      for (let i = 0; i < stableInstanceCount; i++) {
        const coordinator = new HorizontalScalingCoordinator(redisClient, mockMetricsService);
        await coordinator.initialize({
          instanceId: `stable-instance-${i}`,
          coordinationChannel: 'perf:coordination:failover',
          heartbeatIntervalMs: 500,
        });
        coordinators.push(coordinator);
      }

      // Create failing instances
      const failingCoordinators: HorizontalScalingCoordinator[] = [];
      for (let i = 0; i < failingInstanceCount; i++) {
        const coordinator = new HorizontalScalingCoordinator(redisClient, mockMetricsService);
        await coordinator.initialize({
          instanceId: `failing-instance-${i}`,
          coordinationChannel: 'perf:coordination:failover',
          heartbeatIntervalMs: 500,
        });
        failingCoordinators.push(coordinator);
      }

      // Wait for coordination
      await new Promise(resolve => setTimeout(resolve, 1000));

      const startTime = performance.now();

      // Start work on all instances
      const allPromises: Promise<void>[] = [];
      
      // Stable instances
      for (let i = 0; i < stableInstanceCount; i++) {
        const coordinator = coordinators[i];
        
        for (let j = 0; j < operationsPerInstance; j++) {
          const workItem = {
            id: `stable-work-${i}-${j}`,
            instanceId: `stable-instance-${i}`,
            data: `Stable work ${j}`,
          };
          
          allPromises.push(
            coordinator.distributeWork('sync_operation', workItem)
          );
        }
      }

      // Failing instances (will be shut down mid-operation)
      for (let i = 0; i < failingInstanceCount; i++) {
        const coordinator = failingCoordinators[i];
        
        for (let j = 0; j < operationsPerInstance; j++) {
          const workItem = {
            id: `failing-work-${i}-${j}`,
            instanceId: `failing-instance-${i}`,
            data: `Failing work ${j}`,
          };
          
          allPromises.push(
            coordinator.distributeWork('sync_operation', workItem).catch(() => {
              // Ignore failures from failing instances
            })
          );
        }
      }

      // Simulate failures after some work has started
      setTimeout(async () => {
        for (const coordinator of failingCoordinators) {
          await coordinator.shutdown();
        }
      }, 2000);

      await Promise.all(allPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Failover: Operations completed in ${duration.toFixed(2)}ms despite ${failingInstanceCount} instance failures`);

      // Should complete despite failures
      expect(duration).toBeLessThan(20000);

      // Stable instances should have processed work
      for (const coordinator of coordinators) {
        const metrics = coordinator.getMetrics();
        expect(metrics.workItemsProcessed).toBeGreaterThan(0);
      }

      // Cleanup
      for (const coordinator of coordinators) {
        await coordinator.shutdown();
      }
    });
  });

  describe('Performance Telemetry', () => {
    it('should collect comprehensive performance metrics', async () => {
      // Generate some activity
      await prismaClient.user.upsert({
        where: { id: 'telemetry-tenant' },
        update: {},
        create: {
          id: 'telemetry-tenant',
          email: 'telemetry@test.com',
          role: 'USER',
          hashedPassword: 'test-password',
        },
      });

      await syncOrchestrator.onModuleInit();

      // Perform various operations
      for (let i = 0; i < 50; i++) {
        await syncOrchestrator.syncTenantData('telemetry-tenant', 'agent', {
          id: `telemetry-${i}`,
          data: `Telemetry test ${i}`,
        });
      }

      // Create some file changes
      for (let i = 0; i < 20; i++) {
        const filePath = path.join(tempDir, `telemetry-file-${i}.txt`);
        await fs.writeFile(filePath, `Telemetry content ${i}`);
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Collect metrics
      const metrics = performanceTelemetry.getMetrics();

      // Verify comprehensive metrics collection
      expect(metrics).toHaveProperty('syncOperations');
      expect(metrics).toHaveProperty('fileOperations');
      expect(metrics).toHaveProperty('cacheOperations');
      expect(metrics).toHaveProperty('systemMetrics');

      expect(metrics.syncOperations.total).toBeGreaterThan(0);
      expect(metrics.syncOperations.averageLatency).toBeGreaterThan(0);
      expect(metrics.systemMetrics.memoryUsage).toBeGreaterThan(0);
      expect(metrics.systemMetrics.cpuUsage).toBeGreaterThanOrEqual(0);

      console.log('Performance metrics:', JSON.stringify(metrics, null, 2));
    });

    it('should identify performance bottlenecks', async () => {
      // Create conditions that might cause bottlenecks
      await prismaClient.user.upsert({
        where: { id: 'bottleneck-tenant' },
        update: {},
        create: {
          id: 'bottleneck-tenant',
          email: 'bottleneck@test.com',
          role: 'USER',
          hashedPassword: 'test-password',
        },
      });

      await syncOrchestrator.onModuleInit();

      // Simulate high load
      const highLoadPromises: Promise<void>[] = [];
      for (let i = 0; i < 200; i++) {
        highLoadPromises.push(
          syncOrchestrator.syncTenantData('bottleneck-tenant', 'agent', {
            id: `bottleneck-${i}`,
            largeData: 'x'.repeat(10000), // Large payload
          })
        );
      }

      await Promise.all(highLoadPromises);

      // Analyze performance
      const analysis = performanceTelemetry.analyzePerformance();

      expect(analysis).toHaveProperty('bottlenecks');
      expect(analysis).toHaveProperty('recommendations');
      expect(Array.isArray(analysis.bottlenecks)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);

      console.log('Performance analysis:', JSON.stringify(analysis, null, 2));
    });
  });
});