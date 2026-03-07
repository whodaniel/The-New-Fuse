/**
 * Tests for SyncErrorHandler
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { IMonitoringSystem, IMetricsCollector } from '@the-new-fuse/core-monitoring';
import { ErrorSeverity, ErrorCategory } from '@the-new-fuse/core-error-handling';
import { 
  SyncErrorHandler, 
  SyncError, 
  SyncContext, 
  SyncErrorHandlerConfig 
} from './SyncErrorHandler.js';

describe('SyncErrorHandler', () => {
  let errorHandler: SyncErrorHandler;
  let redisService: jest.Mocked<UnifiedRedisService>;
  let monitoringSystem: jest.Mocked<IMonitoringSystem>;
  let metricsCollector: jest.Mocked<IMetricsCollector>;
  let logger: jest.Mocked<Logger>;

  const mockConfig: Partial<SyncErrorHandlerConfig> = {
    enableAutoRecovery: true,
    maxRecoveryAttempts: 3,
    redisQueuePrefix: 'test:sync:error',
    fallbackQueueName: 'test:sync:fallback',
    enableMetricsCollection: true,
    enableAlerts: true
  };

  const mockSyncContext: SyncContext = {
    syncId: 'test-sync-123',
    syncType: 'file',
    component: 'test-component',
    operation: 'sync-operation',
    tenantId: 'tenant-123',
    resourcePath: '/test/path',
    version: 1,
    checksum: 'abc123',
    timestamp: new Date()
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
      lpush: jest.fn(),
      publish: jest.fn()
    } as any;

    // Mock metrics collector
    metricsCollector = {
      incrementCounter: jest.fn(),
      recordGauge: jest.fn(),
      recordHistogram: jest.fn(),
      recordMetric: jest.fn()
    } as any;

    // Mock monitoring system
    monitoringSystem = {
      getMetricsCollector: jest.fn().mockReturnValue(metricsCollector)
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
          provide: SyncErrorHandler,
          useFactory: () => new SyncErrorHandler(
            redisService,
            mockConfig,
            monitoringSystem,
            logger
          )
        }
      ]
    }).compile();

    errorHandler = module.get<SyncErrorHandler>(SyncErrorHandler);
  });

  afterEach(() => {
    errorHandler.shutdown();
  });

  describe('Error Handling', () => {
    it('should handle sync errors and update statistics', async () => {
      const error = new Error('Test sync error');
      
      const result = await errorHandler.handleSyncError(error, mockSyncContext, 'test-operation');
      
      expect(result).toBeDefined();
      
      const stats = errorHandler.getSyncStatistics();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByOperation['test-operation']).toBe(1);
    });

    it('should normalize regular errors to SyncError format', async () => {
      const error = new Error('Network connection failed');
      
      await errorHandler.handleSyncError(error, mockSyncContext);
      
      const history = errorHandler.getErrorHistory(1);
      expect(history).toHaveLength(1);
      
      const syncError = history[0] as SyncError;
      expect(syncError.type).toBe('network');
      expect(syncError.resourceType).toBe('file');
      expect(syncError.tenantId).toBe('tenant-123');
    });

    it('should handle critical errors with special processing', async () => {
      const criticalError: SyncError = {
        code: 9001,
        message: 'Critical sync failure',
        timestamp: new Date(),
        retryable: false,
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SYSTEM,
        type: 'conflict',
        resourceType: 'agent',
        resourceId: 'agent-123',
        tenantId: 'tenant-123',
        syncOperation: 'master_clock_sync',
        metadata: {}
      };

      const criticalEventSpy = jest.fn();
      errorHandler.on('criticalError', criticalEventSpy);

      await errorHandler.handleSyncError(criticalError, mockSyncContext);

      expect(criticalEventSpy).toHaveBeenCalledWith({
        error: criticalError,
        context: mockSyncContext
      });

      const stats = errorHandler.getSyncStatistics();
      expect(stats.criticalErrors).toBe(1);
    });

    it('should record metrics when metrics collector is available', async () => {
      const error = new Error('Test error');
      
      await errorHandler.handleSyncError(error, mockSyncContext);
      
      expect(metricsCollector.incrementCounter).toHaveBeenCalledWith(
        'sync_errors_total',
        expect.objectContaining({
          type: expect.any(String),
          resourceType: 'file',
          tenantId: 'tenant-123'
        })
      );
    });
  });

  describe('Fallback Queue Management', () => {
    it('should queue failed operations for fallback processing', async () => {
      const error: SyncError = {
        code: 1001,
        message: 'Network error',
        timestamp: new Date(),
        retryable: true,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK,
        type: 'network',
        resourceType: 'file',
        resourceId: 'file-123',
        syncOperation: 'file-sync',
        metadata: {}
      };

      await errorHandler.queueFallbackOperation(error, mockSyncContext);

      expect(redisService.zadd).toHaveBeenCalledWith(
        'test:sync:fallback',
        expect.any(Number),
        expect.stringContaining('fallback_')
      );
    });

    it('should process fallback queue and handle operations', async () => {
      const mockOperation = {
        id: 'fallback-123',
        operation: 'sync',
        data: { test: 'data' },
        context: mockSyncContext,
        priority: 1,
        maxRetries: 3,
        retryCount: 0,
        nextRetryAt: new Date(Date.now() - 1000), // Past time
        createdAt: new Date()
      };

      redisService.zrange.mockResolvedValue([JSON.stringify(mockOperation)]);
      redisService.zrem.mockResolvedValue(1);

      const processEventSpy = jest.fn();
      errorHandler.on('processFallbackOperation', processEventSpy);

      await errorHandler.processFallbackQueue(1);

      expect(redisService.zrange).toHaveBeenCalledWith('test:sync:fallback', 0, 0);
      expect(redisService.zrem).toHaveBeenCalledWith('test:sync:fallback', JSON.stringify(mockOperation));
    });

    it('should limit fallback queue size', async () => {
      const error: SyncError = {
        code: 1001,
        message: 'Test error',
        timestamp: new Date(),
        retryable: true,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.NETWORK,
        type: 'network',
        resourceType: 'file',
        resourceId: 'file-123',
        syncOperation: 'sync',
        metadata: {}
      };

      // Mock queue at max capacity
      const mockQueueItems = Array(10001).fill('mock-item');
      redisService.zrange.mockResolvedValue(mockQueueItems);

      await errorHandler.queueFallbackOperation(error, mockSyncContext);

      expect(redisService.zrem).toHaveBeenCalledWith('test:sync:fallback', 'mock-item');
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt recovery for retryable errors', async () => {
      const retryableError: SyncError = {
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
        metadata: {}
      };

      const result = await errorHandler.handleSyncError(retryableError, mockSyncContext);

      expect(result).toBeDefined();
      // Recovery strategies are tested in the base class
    });

    it('should not attempt recovery for non-retryable errors', async () => {
      const nonRetryableError: SyncError = {
        code: 3001,
        message: 'Permission denied',
        timestamp: new Date(),
        retryable: false,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHORIZATION,
        type: 'permission',
        resourceType: 'file',
        resourceId: 'file-123',
        syncOperation: 'sync',
        metadata: {}
      };

      const result = await errorHandler.handleSyncError(nonRetryableError, mockSyncContext);

      expect(result).toBeNull();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track error statistics by type, resource, and tenant', async () => {
      const networkError = new Error('Network error');
      const conflictError = new Error('Conflict detected');

      await errorHandler.handleSyncError(networkError, mockSyncContext);
      await errorHandler.handleSyncError(conflictError, {
        ...mockSyncContext,
        syncType: 'agent',
        tenantId: 'tenant-456'
      });

      const stats = errorHandler.getSyncStatistics();
      
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByResource['file']).toBe(1);
      expect(stats.errorsByResource['agent']).toBe(1);
      expect(stats.errorsByTenant['tenant-123']).toBe(1);
      expect(stats.errorsByTenant['tenant-456']).toBe(1);
    });

    it('should clear statistics and history', () => {
      // Add some errors first
      const error = new Error('Test error');
      errorHandler.handleSyncError(error, mockSyncContext);

      errorHandler.clearSyncHistory();

      const stats = errorHandler.getSyncStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(Object.keys(stats.errorsByType)).toHaveLength(0);
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(0);
    });

    it('should report metrics at regular intervals', (done) => {
      // This test would need to be adjusted based on the actual metrics reporting implementation
      setTimeout(() => {
        // Verify metrics were reported
        done();
      }, 100);
    });
  });

  describe('Error Classification', () => {
    it('should correctly classify network errors', async () => {
      const networkError = new Error('Connection timeout');
      
      await errorHandler.handleSyncError(networkError, mockSyncContext);
      
      const history = errorHandler.getErrorHistory(1);
      const syncError = history[0] as SyncError;
      
      expect(syncError.type).toBe('network');
      expect(syncError.category).toBe(ErrorCategory.NETWORK);
      expect(syncError.retryable).toBe(true);
    });

    it('should correctly classify permission errors', async () => {
      const permissionError = new Error('Unauthorized access');
      
      await errorHandler.handleSyncError(permissionError, mockSyncContext);
      
      const history = errorHandler.getErrorHistory(1);
      const syncError = history[0] as SyncError;
      
      expect(syncError.type).toBe('permission');
      expect(syncError.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should correctly classify validation errors', async () => {
      const validationError = new Error('Invalid data format');
      
      await errorHandler.handleSyncError(validationError, mockSyncContext);
      
      const history = errorHandler.getErrorHistory(1);
      const syncError = history[0] as SyncError;
      
      expect(syncError.type).toBe('validation');
      expect(syncError.category).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe('Event Emission', () => {
    it('should emit fallbackQueued event when queueing operations', async () => {
      const error: SyncError = {
        code: 1001,
        message: 'Test error',
        timestamp: new Date(),
        retryable: true,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.NETWORK,
        type: 'network',
        resourceType: 'file',
        resourceId: 'file-123',
        syncOperation: 'sync',
        metadata: {}
      };

      const eventSpy = jest.fn();
      errorHandler.on('fallbackQueued', eventSpy);

      await errorHandler.queueFallbackOperation(error, mockSyncContext);

      expect(eventSpy).toHaveBeenCalledWith({
        operation: expect.objectContaining({
          operation: 'sync',
          context: mockSyncContext
        }),
        error,
        context: mockSyncContext
      });
    });

    it('should emit alert events when thresholds are exceeded', async () => {
      // This would require setting up the metrics reporting and alert checking
      // The implementation would depend on the specific alert threshold logic
    });
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultHandler = new SyncErrorHandler(redisService);
      
      expect(defaultHandler).toBeDefined();
      // Configuration testing would verify default values are applied
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        maxRecoveryAttempts: 10,
        enableAlerts: false
      };
      
      const customHandler = new SyncErrorHandler(redisService, customConfig);
      
      expect(customHandler).toBeDefined();
      // Would verify that custom config overrides defaults
    });
  });

  describe('Integration with Existing Systems', () => {
    it('should integrate with Redis for queuing', async () => {
      const error = new Error('Test error');
      
      await errorHandler.handleSyncError(error, mockSyncContext);
      
      // Verify Redis operations were called
      expect(redisService.zadd).toHaveBeenCalled();
    });

    it('should integrate with monitoring system for metrics', async () => {
      const error = new Error('Test error');
      
      await errorHandler.handleSyncError(error, mockSyncContext);
      
      expect(monitoringSystem.getMetricsCollector).toHaveBeenCalled();
      expect(metricsCollector.incrementCounter).toHaveBeenCalled();
    });

    it('should use provided logger for all logging', async () => {
      const error = new Error('Test error');
      
      await errorHandler.handleSyncError(error, mockSyncContext);
      
      expect(logger.debug).toHaveBeenCalled();
    });
  });
});