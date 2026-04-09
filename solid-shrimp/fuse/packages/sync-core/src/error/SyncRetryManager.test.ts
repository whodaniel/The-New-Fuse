/**
 * Tests for SyncRetryManager
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { 
  SyncRetryManager, 
  RetryConfig, 
  RetryAttempt, 
  CircuitBreakerState 
} from './SyncRetryManager.js';
import { SyncError, SyncContext } from './SyncErrorHandler.js';
import { ErrorSeverity, ErrorCategory } from '@the-new-fuse/core-error-handling';

describe('SyncRetryManager', () => {
  let retryManager: SyncRetryManager;
  let redisService: jest.Mocked<UnifiedRedisService>;
  let logger: jest.Mocked<Logger>;

  const mockConfig: Partial<RetryConfig> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitterEnabled: false, // Disable for predictable testing
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerTimeout: 5000
  };

  const mockSyncContext: SyncContext = {
    syncId: 'test-sync-123',
    syncType: 'file',
    component: 'test-component',
    operation: 'sync-operation',
    tenantId: 'tenant-123',
    resourcePath: '/test/path',
    timestamp: new Date()
  };

  const mockSyncError: SyncError = {
    code: 1001,
    message: 'Network timeout',
    timestamp: new Date(),
    retryable: true,
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.NETWORK,
    type: 'network',
    resourceType: 'file',
    resourceId: 'file-123',
    syncOperation: 'sync',
    tenantId: 'tenant-123',
    metadata: {}
  };

  beforeEach(async () => {
    // Mock Redis service
    redisService = {
      zadd: jest.fn(),
      zrem: jest.fn(),
      zrange: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      keys: jest.fn(),
      del: jest.fn()
    } as any;

    // Mock logger
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn()
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SyncRetryManager,
          useFactory: () => new SyncRetryManager(redisService, mockConfig, logger)
        }
      ]
    }).compile();

    retryManager = module.get<SyncRetryManager>(SyncRetryManager);
  });

  afterEach(() => {
    retryManager.shutdown();
  });

  describe('Retry Scheduling', () => {
    it('should schedule retry for failed operation', async () => {
      const retryId = await retryManager.scheduleRetry(
        'sync-operation',
        { test: 'data' },
        mockSyncContext,
        mockSyncError
      );

      expect(retryId).toMatch(/^retry_\d+_[a-z0-9]+$/);
      expect(redisService.zadd).toHaveBeenCalledWith(
        'sync:retry:queue',
        expect.any(Number),
        expect.stringContaining(retryId)
      );
    });

    it('should calculate correct retry delay with exponential backoff', async () => {
      const retryId = await retryManager.scheduleRetry(
        'sync-operation',
        { test: 'data' },
        mockSyncContext,
        mockSyncError
      );

      const [[, score, retryData]] = (redisService.zadd as jest.Mock).mock.calls;
      const retry: RetryAttempt = JSON.parse(retryData);
      
      // First attempt should have base delay (1000ms)
      const expectedTime = Date.now() + 1000;
      const actualTime = retry.nextRetryAt.getTime();
      
      expect(actualTime).toBeGreaterThanOrEqual(expectedTime - 100);
      expect(actualTime).toBeLessThanOrEqual(expectedTime + 100);
    });

    it('should respect maximum delay limit', async () => {
      const customConfig = { ...mockConfig, maxDelay: 2000 };
      const customRetryManager = new SyncRetryManager(redisService, customConfig, logger);

      try {
        await customRetryManager.scheduleRetry(
          'sync-operation',
          { test: 'data' },
          mockSyncContext,
          mockSyncError,
          { maxAttempts: 10 } // This would normally cause very high delays
        );

        const [[, score, retryData]] = (redisService.zadd as jest.Mock).mock.calls;
        const retry: RetryAttempt = JSON.parse(retryData);
        
        // Should not exceed maxDelay
        const delay = retry.nextRetryAt.getTime() - Date.now();
        expect(delay).toBeLessThanOrEqual(2000);
      } finally {
        customRetryManager.shutdown();
      }
    });

    it('should throw error when circuit breaker is open', async () => {
      // First, trigger circuit breaker by failing multiple times
      const operation = 'failing-operation';
      
      for (let i = 0; i < 3; i++) {
        try {
          await retryManager.scheduleRetry(operation, {}, mockSyncContext, mockSyncError);
        } catch (e) {
          // Expected to fail when circuit breaker opens
        }
      }

      // Now scheduling should fail due to open circuit breaker
      await expect(
        retryManager.scheduleRetry(operation, {}, mockSyncContext, mockSyncError)
      ).rejects.toThrow('Circuit breaker open');
    });
  });

  describe('Retry Processing', () => {
    it('should process retries that are ready', async () => {
      const pastTime = new Date(Date.now() - 1000);
      const mockRetry: RetryAttempt = {
        id: 'retry-123',
        operation: 'sync',
        data: { test: 'data' },
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: pastTime,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockRetry)]);
      redisService.zrem.mockResolvedValue(1);

      const executeEventSpy = jest.fn();
      retryManager.on('executeRetry', executeEventSpy);

      await retryManager.processRetries(1);

      expect(redisService.zrange).toHaveBeenCalledWith('sync:retry:queue', 0, 0);
      expect(redisService.zrem).toHaveBeenCalledWith('sync:retry:queue', JSON.stringify(mockRetry));
      expect(executeEventSpy).toHaveBeenCalledWith(mockRetry, expect.any(Function));
    });

    it('should skip retries that are not ready yet', async () => {
      const futureTime = new Date(Date.now() + 10000);
      const mockRetry: RetryAttempt = {
        id: 'retry-123',
        operation: 'sync',
        data: { test: 'data' },
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: futureTime,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockRetry)]);

      await retryManager.processRetries(1);

      expect(redisService.zrem).not.toHaveBeenCalled();
    });

    it('should handle successful retry execution', async () => {
      const mockRetry: RetryAttempt = {
        id: 'retry-123',
        operation: 'sync',
        data: { test: 'data' },
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockRetry)]);
      redisService.zrem.mockResolvedValue(1);

      const successEventSpy = jest.fn();
      retryManager.on('retrySuccess', successEventSpy);

      // Mock successful execution
      retryManager.on('executeRetry', (retry, callback) => {
        callback(true); // Simulate success
      });

      await retryManager.processRetries(1);

      expect(successEventSpy).toHaveBeenCalledWith(mockRetry);
    });

    it('should reschedule failed retry if attempts remain', async () => {
      const mockRetry: RetryAttempt = {
        id: 'retry-123',
        operation: 'sync',
        data: { test: 'data' },
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockRetry)]);
      redisService.zrem.mockResolvedValue(1);

      const rescheduledEventSpy = jest.fn();
      retryManager.on('retryRescheduled', rescheduledEventSpy);

      // Mock failed execution
      retryManager.on('executeRetry', (retry, callback) => {
        callback(false); // Simulate failure
      });

      await retryManager.processRetries(1);

      expect(rescheduledEventSpy).toHaveBeenCalled();
      expect(redisService.zadd).toHaveBeenCalledTimes(2); // Original + rescheduled
    });

    it('should mark retry as exhausted when max attempts reached', async () => {
      const mockRetry: RetryAttempt = {
        id: 'retry-123',
        operation: 'sync',
        data: { test: 'data' },
        context: mockSyncContext,
        attemptNumber: 3,
        maxAttempts: 3,
        nextRetryAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockRetry)]);
      redisService.zrem.mockResolvedValue(1);

      const exhaustedEventSpy = jest.fn();
      retryManager.on('retryExhausted', exhaustedEventSpy);

      // Mock failed execution
      retryManager.on('executeRetry', (retry, callback) => {
        callback(false); // Simulate failure
      });

      await retryManager.processRetries(1);

      expect(exhaustedEventSpy).toHaveBeenCalledWith(mockRetry);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const operation = 'failing-operation';
      
      const openedEventSpy = jest.fn();
      retryManager.on('circuitBreakerOpened', openedEventSpy);

      // Simulate failures to trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        const mockRetry: RetryAttempt = {
          id: `retry-${i}`,
          operation,
          data: {},
          context: mockSyncContext,
          attemptNumber: 3, // Max attempts reached
          maxAttempts: 3,
          nextRetryAt: new Date(Date.now() - 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        redisService.zrange.mockResolvedValueOnce([JSON.stringify(mockRetry)]);
        redisService.zrem.mockResolvedValue(1);

        // Mock failed execution
        retryManager.on('executeRetry', (retry, callback) => {
          callback(false);
        });

        await retryManager.processRetries(1);
      }

      expect(openedEventSpy).toHaveBeenCalled();
    });

    it('should transition circuit breaker from half-open to closed on success', async () => {
      const operation = 'recovering-operation';
      
      // First open the circuit breaker
      const states = retryManager.getCircuitBreakerStates();
      states.set(operation, {
        operation,
        state: 'half-open',
        failureCount: 3,
        successCount: 0
      });

      const closedEventSpy = jest.fn();
      retryManager.on('circuitBreakerClosed', closedEventSpy);

      const mockRetry: RetryAttempt = {
        id: 'retry-123',
        operation,
        data: {},
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockRetry)]);
      redisService.zrem.mockResolvedValue(1);

      // Mock successful execution
      retryManager.on('executeRetry', (retry, callback) => {
        callback(true);
      });

      await retryManager.processRetries(1);

      expect(closedEventSpy).toHaveBeenCalled();
    });

    it('should reset circuit breaker manually', async () => {
      const operation = 'test-operation';
      
      // Set up an open circuit breaker
      const states = retryManager.getCircuitBreakerStates();
      states.set(operation, {
        operation,
        state: 'open',
        failureCount: 5,
        successCount: 0,
        lastFailureAt: new Date(),
        nextAttemptAt: new Date(Date.now() + 10000)
      });

      const resetEventSpy = jest.fn();
      retryManager.on('circuitBreakerReset', resetEventSpy);

      await retryManager.resetCircuitBreaker(operation);

      const breaker = states.get(operation);
      expect(breaker?.state).toBe('closed');
      expect(breaker?.failureCount).toBe(0);
      expect(resetEventSpy).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track retry statistics', async () => {
      // Schedule a retry
      await retryManager.scheduleRetry(
        'test-operation',
        { test: 'data' },
        mockSyncContext,
        mockSyncError
      );

      const stats = await retryManager.getStatistics();
      
      expect(stats.totalRetries).toBeGreaterThan(0);
      expect(stats.operationStats['test-operation']).toBeDefined();
    });

    it('should persist statistics to Redis', async () => {
      await retryManager.scheduleRetry(
        'test-operation',
        { test: 'data' },
        mockSyncContext,
        mockSyncError
      );

      // Statistics should be persisted
      expect(redisService.set).toHaveBeenCalledWith(
        'sync:retry:stats',
        expect.any(String),
        3600
      );
    });

    it('should load statistics from Redis', async () => {
      const mockStats = {
        totalRetries: 10,
        successfulRetries: 8,
        failedRetries: 2
      };

      redisService.get.mockResolvedValue(JSON.stringify(mockStats));

      const stats = await retryManager.getStatistics();
      
      expect(stats.totalRetries).toBe(10);
      expect(stats.successfulRetries).toBe(8);
      expect(stats.failedRetries).toBe(2);
    });
  });

  describe('Queue Management', () => {
    it('should clear retry queue', async () => {
      const mockRetries = ['retry1', 'retry2', 'retry3'];
      redisService.zrange.mockResolvedValue(mockRetries);

      const count = await retryManager.clearRetryQueue();

      expect(count).toBe(3);
      expect(redisService.del).toHaveBeenCalledWith('sync:retry:queue');
    });

    it('should process retries in batches', async () => {
      const mockRetries = Array(5).fill(null).map((_, i) => JSON.stringify({
        id: `retry-${i}`,
        operation: 'sync',
        data: {},
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      redisService.zrange.mockResolvedValue(mockRetries);
      redisService.zrem.mockResolvedValue(1);

      await retryManager.processRetries(3); // Process only 3 out of 5

      expect(redisService.zrange).toHaveBeenCalledWith('sync:retry:queue', 0, 2);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultManager = new SyncRetryManager(redisService);
      
      expect(defaultManager).toBeDefined();
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        maxAttempts: 10,
        circuitBreakerEnabled: false
      };
      
      const customManager = new SyncRetryManager(redisService, customConfig);
      
      expect(customManager).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      redisService.zadd.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        retryManager.scheduleRetry(
          'test-operation',
          { test: 'data' },
          mockSyncContext,
          mockSyncError
        )
      ).rejects.toThrow('Redis connection failed');
    });

    it('should continue processing other retries when one fails', async () => {
      const validRetry = {
        id: 'retry-valid',
        operation: 'sync',
        data: {},
        context: mockSyncContext,
        attemptNumber: 1,
        maxAttempts: 3,
        nextRetryAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const invalidRetry = 'invalid-json';

      redisService.zrange.mockResolvedValue([JSON.stringify(validRetry), invalidRetry]);
      redisService.zrem.mockResolvedValue(1);

      const executeEventSpy = jest.fn();
      retryManager.on('executeRetry', executeEventSpy);

      await retryManager.processRetries(2);

      // Should still process the valid retry despite the invalid one
      expect(executeEventSpy).toHaveBeenCalledWith(validRetry, expect.any(Function));
    });
  });

  describe('Event Emission', () => {
    it('should emit retryScheduled event', async () => {
      const eventSpy = jest.fn();
      retryManager.on('retryScheduled', eventSpy);

      await retryManager.scheduleRetry(
        'test-operation',
        { test: 'data' },
        mockSyncContext,
        mockSyncError
      );

      expect(eventSpy).toHaveBeenCalledWith({
        retryAttempt: expect.objectContaining({
          operation: 'test-operation',
          attemptNumber: 1
        }),
        error: mockSyncError
      });
    });

    it('should emit circuit breaker events', async () => {
      const openedSpy = jest.fn();
      const closedSpy = jest.fn();
      const resetSpy = jest.fn();

      retryManager.on('circuitBreakerOpened', openedSpy);
      retryManager.on('circuitBreakerClosed', closedSpy);
      retryManager.on('circuitBreakerReset', resetSpy);

      // These would be triggered by the actual retry processing logic
      // The specific test implementation would depend on the circuit breaker logic
    });
  });
});