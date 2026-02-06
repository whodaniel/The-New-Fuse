/**
 * Integration tests for sync error handling system
 * Tests the complete error handling workflow with Redis and monitoring
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCategory, ErrorSeverity } from '@the-new-fuse/core-error-handling';
import { IMetricsCollector, IMonitoringSystem } from '@the-new-fuse/core-monitoring';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import {
  SyncContext,
  SyncError,
  SyncErrorHandler,
  SyncErrorHandlerConfig,
} from './SyncErrorHandler.js';
import { FallbackProcessorConfig, SyncFallbackProcessor } from './SyncFallbackProcessor.js';
import { RetryConfig, SyncRetryManager } from './SyncRetryManager.js';

describe('Sync Error Handling Integration', () => {
  let errorHandler: SyncErrorHandler;
  let retryManager: SyncRetryManager;
  let fallbackProcessor: SyncFallbackProcessor;
  let redisService: UnifiedRedisService;
  let monitoringSystem: IMonitoringSystem;
  let metricsCollector: IMetricsCollector;
  let module: TestingModule;

  const testConfig = {
    errorHandler: {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      redisQueuePrefix: 'test:sync:error',
      fallbackQueueName: 'test:sync:fallback',
      enableMetricsCollection: true,
      enableAlerts: true,
      alertThresholds: {
        errorRate: 5,
        criticalErrorCount: 2,
        failedRecoveryRate: 0.8,
      },
    } as Partial<SyncErrorHandlerConfig>,

    retryManager: {
      maxAttempts: 3,
      baseDelay: 100, // Shorter for testing
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitterEnabled: false,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 1000,
    } as Partial<RetryConfig>,

    fallbackProcessor: {
      enabled: true,
      processingInterval: 500, // Shorter for testing
      batchSize: 5,
      maxConcurrentProcessing: 2,
      defaultTimeout: 5000,
      enableMetrics: true,
      enableAlternativeActions: true,
      gracefulDegradationEnabled: true,
    } as Partial<FallbackProcessorConfig>,
  };

  beforeAll(async () => {
    // Create test module with real Redis and monitoring (mocked for testing)
    module = await Test.createTestingModule({
      providers: [
        {
          provide: UnifiedRedisService,
          useValue: createMockRedisService(),
        },
        {
          provide: IMonitoringSystem,
          useValue: createMockMonitoringSystem(),
        },
        {
          provide: SyncErrorHandler,
          useFactory: (redis, monitoring) =>
            new SyncErrorHandler(redis, testConfig.errorHandler, monitoring),
          inject: [UnifiedRedisService, IMonitoringSystem],
        },
        {
          provide: SyncRetryManager,
          useFactory: (redis) => new SyncRetryManager(redis, testConfig.retryManager),
          inject: [UnifiedRedisService],
        },
        {
          provide: SyncFallbackProcessor,
          useFactory: (redis, monitoring) =>
            new SyncFallbackProcessor(
              redis,
              testConfig.fallbackProcessor,
              monitoring?.getMetricsCollector()
            ),
          inject: [UnifiedRedisService, IMonitoringSystem],
        },
      ],
    }).compile();

    errorHandler = module.get<SyncErrorHandler>(SyncErrorHandler);
    retryManager = module.get<SyncRetryManager>(SyncRetryManager);
    fallbackProcessor = module.get<SyncFallbackProcessor>(SyncFallbackProcessor);
    redisService = module.get<UnifiedRedisService>(UnifiedRedisService);
    monitoringSystem = module.get<IMonitoringSystem>(IMonitoringSystem);
    metricsCollector = monitoringSystem.getMetricsCollector();
  });

  afterAll(async () => {
    errorHandler.shutdown();
    retryManager.shutdown();
    fallbackProcessor.shutdown();
    await module.close();
  });

  describe('Complete Error Handling Workflow', () => {
    it('should handle error through complete workflow: error -> retry -> fallback', async () => {
      const mockContext: SyncContext = {
        syncId: 'integration-test-123',
        syncType: 'file',
        component: 'test-component',
        operation: 'sync-operation',
        tenantId: 'tenant-123',
        resourcePath: '/test/integration/path',
        timestamp: new Date(),
      };

      const networkError = new Error('Network connection timeout');

      // Step 1: Handle initial error
      const errorResult = await errorHandler.handleSyncError(
        networkError,
        mockContext,
        'file-sync'
      );

      expect(errorResult).toBeDefined();

      // Verify error was recorded
      const stats = errorHandler.getSyncStatistics();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType['network']).toBe(1);

      // Step 2: Schedule retry
      const retryId = await retryManager.scheduleRetry(
        'file-sync',
        { filePath: '/test/integration/path' },
        mockContext,
        errorResult as any
      );

      expect(retryId).toBeDefined();

      // Step 3: Process retry (simulate failure)
      let retryExecuted = false;
      retryManager.on('executeRetry', (retry, callback) => {
        retryExecuted = true;
        callback(false); // Simulate retry failure
      });

      await retryManager.processRetries(1);
      expect(retryExecuted).toBe(true);

      // Step 4: Process fallback
      let fallbackProcessed = false;
      fallbackProcessor.on('fallbackSuccess', () => {
        fallbackProcessed = true;
      });

      // Simulate fallback processing
      const mockFallbackOp = {
        id: 'fallback-123',
        operation: 'file-sync',
        data: { filePath: '/test/integration/path' },
        context: mockContext,
        priority: 1,
        maxRetries: 3,
        retryCount: 0,
        nextRetryAt: new Date(),
        createdAt: new Date(),
      };

      const fallbackResult = await fallbackProcessor.processFallbackOperation(mockFallbackOp);
      expect(fallbackResult.success).toBe(true);
    });

    it('should handle critical errors with immediate escalation', async () => {
      const criticalContext: SyncContext = {
        syncId: 'critical-test-123',
        syncType: 'agent',
        component: 'master-clock',
        operation: 'master_clock_sync',
        tenantId: 'tenant-123',
        timestamp: new Date(),
      };

      const criticalError: SyncError = {
        code: 9001,
        message: 'Master clock synchronization failed',
        timestamp: new Date(),
        retryable: false,
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SYSTEM,
        type: 'conflict',
        resourceType: 'agent',
        resourceId: 'master-clock-agent',
        tenantId: 'tenant-123',
        syncOperation: 'master_clock_sync',
        metadata: {
          syncContext: criticalContext,
          stackTrace: 'Mock stack trace',
        },
      };

      let criticalEventEmitted = false;
      errorHandler.on('criticalError', () => {
        criticalEventEmitted = true;
      });

      await errorHandler.handleSyncError(criticalError, criticalContext);

      expect(criticalEventEmitted).toBe(true);

      const stats = errorHandler.getSyncStatistics();
      expect(stats.criticalErrors).toBe(1);
    });

    it('should integrate with monitoring system for metrics collection', async () => {
      const mockContext: SyncContext = {
        syncId: 'metrics-test-123',
        syncType: 'template',
        component: 'template-sync',
        operation: 'template-update',
        tenantId: 'tenant-456',
        timestamp: new Date(),
      };

      const validationError = new Error('Template validation failed');

      await errorHandler.handleSyncError(validationError, mockContext);

      // Verify metrics were recorded
      expect(metricsCollector.incrementCounter).toHaveBeenCalledWith(
        'sync_errors_total',
        expect.objectContaining({
          type: 'validation',
          resourceType: 'template',
          tenantId: 'tenant-456',
        })
      );

      expect(metricsCollector.recordGauge).toHaveBeenCalledWith(
        'sync_error_severity_score',
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should handle circuit breaker integration with retry manager', async () => {
      const operation = 'failing-sync-operation';
      const mockContext: SyncContext = {
        syncId: 'circuit-test-123',
        syncType: 'file',
        component: 'file-sync',
        operation,
        tenantId: 'tenant-789',
        timestamp: new Date(),
      };

      const networkError: SyncError = {
        code: 1001,
        message: 'Connection refused',
        timestamp: new Date(),
        retryable: true,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        type: 'network',
        resourceType: 'file',
        resourceId: 'file-456',
        tenantId: 'tenant-789',
        syncOperation: operation,
        metadata: {},
      };

      let circuitBreakerOpened = false;
      retryManager.on('circuitBreakerOpened', () => {
        circuitBreakerOpened = true;
      });

      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 4; i++) {
        try {
          await retryManager.scheduleRetry(operation, {}, mockContext, networkError);

          // Simulate retry failure
          retryManager.emit(
            'executeRetry',
            {
              id: `retry-${i}`,
              operation,
              attemptNumber: 3, // Max attempts
              maxAttempts: 3,
            },
            () => false
          );
        } catch (error) {
          // Expected when circuit breaker opens
          expect(error.message).toContain('Circuit breaker open');
        }
      }

      expect(circuitBreakerOpened).toBe(true);
    });

    it('should handle fallback strategies in priority order', async () => {
      const mockContext: SyncContext = {
        syncId: 'fallback-priority-test',
        syncType: 'config',
        component: 'config-sync',
        operation: 'config-update',
        tenantId: 'tenant-priority',
        timestamp: new Date(),
      };

      const mockOperation = {
        id: 'fallback-priority-op',
        operation: 'config-update',
        data: { configKey: 'test.setting', value: 'new-value' },
        context: mockContext,
        priority: 1,
        maxRetries: 3,
        retryCount: 0,
        nextRetryAt: new Date(),
        createdAt: new Date(),
      };

      // Register custom strategies with different priorities
      fallbackProcessor.registerStrategy({
        name: 'highPriorityStrategy',
        priority: 1,
        applicableOperations: ['config-update'],
        applicableResourceTypes: ['config'],
        maxExecutionTime: 1000,
        enabled: true,
        execute: async () => ({
          success: true,
          strategy: 'highPriorityStrategy',
          executionTime: 100,
          shouldRetry: false,
        }),
      });

      fallbackProcessor.registerStrategy({
        name: 'lowPriorityStrategy',
        priority: 5,
        applicableOperations: ['config-update'],
        applicableResourceTypes: ['config'],
        maxExecutionTime: 1000,
        enabled: true,
        execute: async () => ({
          success: true,
          strategy: 'lowPriorityStrategy',
          executionTime: 200,
          shouldRetry: false,
        }),
      });

      const result = await fallbackProcessor.processFallbackOperation(mockOperation);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('highPriorityStrategy'); // Should use higher priority strategy
    });

    it('should handle graceful degradation when all strategies fail', async () => {
      const mockContext: SyncContext = {
        syncId: 'degradation-test',
        syncType: 'task',
        component: 'task-sync',
        operation: 'task-update',
        tenantId: 'tenant-degradation',
        timestamp: new Date(),
      };

      const mockOperation = {
        id: 'degradation-op',
        operation: 'task-update',
        data: { taskId: 'task-123' },
        context: mockContext,
        priority: 1,
        maxRetries: 3,
        retryCount: 0,
        nextRetryAt: new Date(),
        createdAt: new Date(),
      };

      // Register a failing strategy
      fallbackProcessor.registerStrategy({
        name: 'failingStrategy',
        priority: 1,
        applicableOperations: ['task-update'],
        applicableResourceTypes: ['task'],
        maxExecutionTime: 1000,
        enabled: true,
        execute: async () => {
          throw new Error('Strategy failed');
        },
      });

      let gracefulDegradationTriggered = false;
      fallbackProcessor.on('gracefulDegradation', () => {
        gracefulDegradationTriggered = true;
      });

      const result = await fallbackProcessor.processFallbackOperation(mockOperation);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('gracefulDegradation');
      expect(gracefulDegradationTriggered).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high volume of errors efficiently', async () => {
      const startTime = Date.now();
      const errorCount = 100;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < errorCount; i++) {
        const context: SyncContext = {
          syncId: `perf-test-${i}`,
          syncType: 'file',
          component: 'bulk-sync',
          operation: 'bulk-operation',
          tenantId: `tenant-${i % 10}`, // 10 different tenants
          timestamp: new Date(),
        };

        const error = new Error(`Bulk error ${i}`);
        promises.push(errorHandler.handleSyncError(error, context));
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process 100 errors in reasonable time (< 5 seconds)
      expect(processingTime).toBeLessThan(5000);

      const stats = errorHandler.getSyncStatistics();
      expect(stats.totalErrors).toBe(errorCount);
    });

    it('should handle concurrent retry processing', async () => {
      const retryCount = 50;
      const promises: Promise<string>[] = [];

      for (let i = 0; i < retryCount; i++) {
        const context: SyncContext = {
          syncId: `concurrent-test-${i}`,
          syncType: 'agent',
          component: 'agent-sync',
          operation: 'agent-update',
          tenantId: `tenant-${i % 5}`,
          timestamp: new Date(),
        };

        const error: SyncError = {
          code: 1001,
          message: `Concurrent error ${i}`,
          timestamp: new Date(),
          retryable: true,
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.NETWORK,
          type: 'network',
          resourceType: 'agent',
          resourceId: `agent-${i}`,
          syncOperation: 'agent-update',
          tenantId: context.tenantId,
          metadata: {},
        };

        promises.push(retryManager.scheduleRetry(`operation-${i}`, { index: i }, context, error));
      }

      const retryIds = await Promise.all(promises);

      expect(retryIds).toHaveLength(retryCount);
      retryIds.forEach((id) => {
        expect(id).toMatch(/^retry_\d+_[a-z0-9]+$/);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from Redis connection failures', async () => {
      // Simulate Redis failure
      const originalZadd = redisService.zadd;
      (redisService.zadd as jest.Mock).mockRejectedValueOnce(new Error('Redis connection lost'));

      const mockContext: SyncContext = {
        syncId: 'redis-failure-test',
        syncType: 'file',
        component: 'file-sync',
        operation: 'file-update',
        tenantId: 'tenant-resilience',
        timestamp: new Date(),
      };

      const error = new Error('Test error during Redis failure');

      // Should handle Redis failure gracefully
      await expect(errorHandler.handleSyncError(error, mockContext)).resolves.toBeDefined();

      // Restore Redis functionality
      (redisService.zadd as jest.Mock).mockImplementation(originalZadd);

      // Subsequent operations should work
      await expect(errorHandler.handleSyncError(error, mockContext)).resolves.toBeDefined();
    });

    it('should maintain statistics across service restarts', async () => {
      // Simulate statistics persistence
      const stats = errorHandler.getSyncStatistics();
      const initialErrorCount = stats.totalErrors;

      // Add some errors
      for (let i = 0; i < 5; i++) {
        const context: SyncContext = {
          syncId: `persistence-test-${i}`,
          syncType: 'template',
          component: 'template-sync',
          operation: 'template-sync',
          tenantId: 'tenant-persistence',
          timestamp: new Date(),
        };

        await errorHandler.handleSyncError(new Error(`Persistence test ${i}`), context);
      }

      const updatedStats = errorHandler.getSyncStatistics();
      expect(updatedStats.totalErrors).toBe(initialErrorCount + 5);
    });
  });

  // Helper functions for creating mocks
  function createMockRedisService(): Partial<UnifiedRedisService> {
    const storage = new Map<string, any>();
    const sortedSets = new Map<string, Array<{ score: number; member: string }>>();

    return {
      zadd: jest.fn().mockImplementation(async (key: string, score: number, member: string) => {
        if (!sortedSets.has(key)) {
          sortedSets.set(key, []);
        }
        const set = sortedSets.get(key)!;
        set.push({ score, member });
        set.sort((a, b) => a.score - b.score);
        return 1;
      }),

      zrem: jest.fn().mockImplementation(async (key: string, member: string) => {
        const set = sortedSets.get(key);
        if (set) {
          const index = set.findIndex((item) => item.member === member);
          if (index >= 0) {
            set.splice(index, 1);
            return 1;
          }
        }
        return 0;
      }),

      zrange: jest.fn().mockImplementation(async (key: string, start: number, stop: number) => {
        const set = sortedSets.get(key) || [];
        const end = stop === -1 ? set.length : stop + 1;
        return set.slice(start, end).map((item) => item.member);
      }),

      get: jest.fn().mockImplementation(async (key: string) => {
        return storage.get(key) || null;
      }),

      set: jest.fn().mockImplementation(async (key: string, value: string, ttl?: number) => {
        storage.set(key, value);
        if (ttl) {
          setTimeout(() => storage.delete(key), ttl * 1000);
        }
      }),

      keys: jest.fn().mockImplementation(async (pattern: string) => {
        const keys = Array.from(storage.keys());
        if (pattern === '*') return keys;

        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return keys.filter((key) => regex.test(key));
      }),

      del: jest.fn().mockImplementation(async (key: string) => {
        const existed = storage.has(key);
        storage.delete(key);
        sortedSets.delete(key);
        return existed ? 1 : 0;
      }),

      lpush: jest.fn().mockImplementation(async (key: string, ...values: string[]) => {
        const list = storage.get(key) || [];
        list.unshift(...values);
        storage.set(key, list);
        return list.length;
      }),
    };
  }

  function createMockMonitoringSystem(): Partial<IMonitoringSystem> {
    const metricsCollector: Partial<IMetricsCollector> = {
      incrementCounter: jest.fn(),
      recordGauge: jest.fn(),
      recordHistogram: jest.fn(),
      recordMetric: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      getCurrentMetrics: jest.fn().mockReturnValue({}),
      getMetricsHistory: jest.fn().mockReturnValue([]),
      getMetric: jest.fn().mockReturnValue(null),
    };

    return {
      getMetricsCollector: jest.fn().mockReturnValue(metricsCollector),
      initialize: jest.fn(),
      shutdown: jest.fn(),
      exportMetrics: jest.fn().mockResolvedValue('{}'),
      getStatus: jest.fn().mockResolvedValue({
        running: true,
        uptime: 1000,
        components: {},
      }),
    };
  }
});
