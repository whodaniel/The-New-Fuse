/**
 * Integration tests for System Resilience components
 * Tests circuit breaker, graceful degradation, and failover working together
 */

import { CircuitBreaker, CircuitState, CircuitBreakerManager } from './CircuitBreaker.js';
import { GracefulDegradationManager, ServiceLevel, DegradationConfig } from './GracefulDegradation.js';
import { FailoverManager, ServiceEndpoint } from './FailoverManager.js';
import { MCPErrorHandler } from './MCPErrorHandler.js';
import { ErrorMonitor } from './ErrorMonitor.js';
import { MCPErrorClass, MCPErrorCode, ErrorSeverity } from '../types/error.js';
import { Logger } from '../utils/Logger.js';

describe('System Resilience Integration', () => {
  let mockLogger: jest.Mocked<Logger>;
  let circuitBreakerManager: CircuitBreakerManager;
  let degradationManager: GracefulDegradationManager;
  let failoverManager: FailoverManager;
  let errorHandler: MCPErrorHandler;
  let errorMonitor: ErrorMonitor;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLogLevel: jest.fn(),
      getLogLevel: jest.fn()
    } as any;

    circuitBreakerManager = new CircuitBreakerManager(mockLogger);
    
    const degradationConfig: DegradationConfig = {
      serviceName: 'test-service',
      levels: {
        [ServiceLevel.FULL]: {
          name: ServiceLevel.FULL,
          description: 'Full service',
          availableFeatures: ['read', 'write', 'delete'],
          disabledFeatures: [],
          fallbackHandlers: new Map()
        },
        [ServiceLevel.DEGRADED]: {
          name: ServiceLevel.DEGRADED,
          description: 'Degraded service',
          availableFeatures: ['read', 'write'],
          disabledFeatures: ['delete'],
          fallbackHandlers: new Map()
        },
        [ServiceLevel.MINIMAL]: {
          name: ServiceLevel.MINIMAL,
          description: 'Minimal service',
          availableFeatures: ['read'],
          disabledFeatures: ['write', 'delete'],
          fallbackHandlers: new Map()
        },
        [ServiceLevel.OFFLINE]: {
          name: ServiceLevel.OFFLINE,
          description: 'Service offline',
          availableFeatures: [],
          disabledFeatures: ['read', 'write', 'delete'],
          fallbackHandlers: new Map()
        }
      },
      healthCheckInterval: 100,
      enableAutoRecovery: true,
      recoveryCheckInterval: 200
    };

    degradationManager = new GracefulDegradationManager(degradationConfig, mockLogger);
    
    failoverManager = new FailoverManager(
      {
        serviceName: 'test-service',
        healthCheckInterval: 100,
        healthCheckTimeout: 1000,
        maxRetryAttempts: 3,
        retryDelay: 100,
        enableAutoFailback: true,
        failbackDelay: 500,
        loadBalancingStrategy: 'priority'
      },
      degradationManager,
      mockLogger
    );

    errorHandler = new MCPErrorHandler({
      enableAutoRecovery: true,
      maxRecoveryAttempts: 2,
      statisticsInterval: 0,
      enableLogging: true
    }, mockLogger);

    errorMonitor = new ErrorMonitor({
      metricsInterval: 100,
      retentionPeriod: 60000,
      enableAlerting: true,
      alertInterval: 50
    }, mockLogger);
  });

  afterEach(() => {
    circuitBreakerManager.resetAll();
    degradationManager.shutdown();
    failoverManager.shutdown();
    errorHandler.shutdown();
    errorMonitor.shutdown();
  });

  describe('Circuit Breaker Integration', () => {
    it('should integrate circuit breaker with error handling', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('test-service');
      let callCount = 0;

      // Function that fails multiple times then succeeds
      const unreliableFunction = async () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error(`Call ${callCount} failed`);
        }
        return `Success on call ${callCount}`;
      };

      // Execute multiple times to trigger circuit breaker
      const results = [];
      for (let i = 0; i < 6; i++) {
        const result = await circuitBreaker.execute(unreliableFunction);
        results.push(result);
        
        if (result.success) {
          break;
        }
        
        // Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Should have some failures and eventually success or circuit open
      const failures = results.filter(r => !r.success && !r.rejected);
      const rejections = results.filter(r => r.rejected);
      const successes = results.filter(r => r.success);

      expect(failures.length).toBeGreaterThan(0);
      expect(rejections.length + successes.length).toBeGreaterThan(0);
    });

    it('should coordinate circuit breaker with graceful degradation', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('test-service');
      
      // Register fallback handler for degraded mode
      degradationManager.registerFallbackHandler(
        ServiceLevel.DEGRADED,
        'read',
        {
          name: 'cached-read',
          description: 'Read from cache',
          handler: async () => 'cached-data',
          priority: 1,
          available: true
        }
      );

      let serviceCallCount = 0;
      const failingService = async () => {
        serviceCallCount++;
        throw new Error('Service unavailable');
      };

      // Execute operation with both circuit breaker and degradation
      const result = await degradationManager.executeOperation(
        'read',
        { id: 'test' },
        async () => {
          const cbResult = await circuitBreaker.execute(failingService);
          if (!cbResult.success) {
            throw cbResult.error || new Error('Circuit breaker failure');
          }
          return cbResult.data;
        }
      );

      // Should get fallback result
      expect(result).toBe('cached-data');
      expect(serviceCallCount).toBeGreaterThan(0);
    });
  });

  describe('Failover Integration', () => {
    it('should integrate failover with circuit breakers', async () => {
      // Add multiple endpoints
      const endpoints: Omit<ServiceEndpoint, 'healthy' | 'lastHealthCheck' | 'responseTime' | 'errorCount'>[] = [
        { id: 'primary', url: 'http://primary:8080', priority: 1 },
        { id: 'secondary', url: 'http://secondary:8080', priority: 2 },
        { id: 'tertiary', url: 'http://tertiary:8080', priority: 3 }
      ];

      endpoints.forEach(endpoint => failoverManager.addEndpoint(endpoint));

      let primaryCalls = 0;
      let secondaryCalls = 0;
      let tertiaryCalls = 0;

      const serviceCall = async (endpoint: ServiceEndpoint) => {
        switch (endpoint.id) {
          case 'primary':
            primaryCalls++;
            if (primaryCalls <= 3) {
              throw new Error('Primary service down');
            }
            return 'primary-response';
          
          case 'secondary':
            secondaryCalls++;
            if (secondaryCalls <= 2) {
              throw new Error('Secondary service down');
            }
            return 'secondary-response';
          
          case 'tertiary':
            tertiaryCalls++;
            return 'tertiary-response';
          
          default:
            throw new Error('Unknown endpoint');
        }
      };

      const result = await failoverManager.executeWithFailover(serviceCall);
      
      // Should eventually succeed with tertiary
      expect(result).toBe('tertiary-response');
      expect(primaryCalls).toBeGreaterThan(0);
      expect(secondaryCalls).toBeGreaterThan(0);
      expect(tertiaryCalls).toBeGreaterThan(0);
    });

    it('should trigger degradation when all endpoints fail', async () => {
      failoverManager.addEndpoint({ id: 'only', url: 'http://only:8080', priority: 1 });

      const alwaysFailingService = async () => {
        throw new Error('All services down');
      };

      let degradationTriggered = false;
      degradationManager.on('serviceDegraded', () => {
        degradationTriggered = true;
      });

      try {
        await failoverManager.executeWithFailover(alwaysFailingService);
      } catch (error) {
        // Expected to fail
      }

      // Wait for degradation to be triggered
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(degradationTriggered).toBe(true);
      expect(degradationManager.getServiceStatus().currentLevel).not.toBe(ServiceLevel.FULL);
    });
  });

  describe('Error Monitoring Integration', () => {
    it('should monitor errors across all resilience components', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('monitored-service');
      
      // Generate various types of errors
      const errors = [
        new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, 'Connection timeout'),
        new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Service unavailable'),
        new MCPErrorClass(MCPErrorCode.RESOURCE_NOT_FOUND, 'Resource not found'),
        new MCPErrorClass(MCPErrorCode.SYSTEM_OVERLOADED, 'System overloaded', { severity: ErrorSeverity.CRITICAL })
      ];

      // Record errors in monitor
      errors.forEach(error => errorMonitor.recordError(error));

      // Also trigger circuit breaker failures
      for (let i = 0; i < 5; i++) {
        await circuitBreaker.execute(async () => {
          throw new Error(`Failure ${i + 1}`);
        });
      }

      // Wait for metrics to be updated
      await new Promise(resolve => setTimeout(resolve, 150));

      const metrics = errorMonitor.getCurrentMetrics();
      
      expect(metrics.totalErrors).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThan(0);
      expect(metrics.healthScore).toBeLessThan(100);
    });

    it('should trigger alerts based on system resilience state', async () => {
      let alertsTriggered = 0;
      
      errorMonitor.registerAlertRule({
        name: 'system-resilience-alert',
        description: 'System resilience compromised',
        severity: 'high',
        cooldown: 1000,
        condition: (metrics) => metrics.healthScore < 80,
        action: async () => {
          alertsTriggered++;
        }
      });

      // Generate enough errors to trigger alert
      for (let i = 0; i < 10; i++) {
        errorMonitor.recordError(
          new MCPErrorClass(MCPErrorCode.SYSTEM_OVERLOADED, `Error ${i}`, { severity: ErrorSeverity.HIGH })
        );
      }

      // Wait for alert processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(alertsTriggered).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Resilience Scenarios', () => {
    it('should handle cascading failures gracefully', async () => {
      // Set up complete resilience stack
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('e2e-service');
      
      failoverManager.addEndpoint({ id: 'primary', url: 'http://primary:8080', priority: 1 });
      failoverManager.addEndpoint({ id: 'backup', url: 'http://backup:8080', priority: 2 });

      degradationManager.registerFallbackHandler(
        ServiceLevel.MINIMAL,
        'read',
        {
          name: 'emergency-cache',
          description: 'Emergency cache fallback',
          handler: async () => 'emergency-data',
          priority: 1,
          available: true
        }
      );

      let primaryFailures = 0;
      let backupFailures = 0;

      const cascadingFailureService = async (endpoint: ServiceEndpoint) => {
        if (endpoint.id === 'primary') {
          primaryFailures++;
          throw new Error('Primary cascade failure');
        } else if (endpoint.id === 'backup') {
          backupFailures++;
          if (backupFailures <= 2) {
            throw new Error('Backup cascade failure');
          }
          return 'backup-success';
        }
        throw new Error('Unknown endpoint');
      };

      // Execute with full resilience stack
      let finalResult;
      try {
        finalResult = await failoverManager.executeWithFailover(cascadingFailureService);
      } catch (error) {
        // If failover fails, try degradation
        finalResult = await degradationManager.executeOperation(
          'read',
          {},
          async () => {
            throw error;
          }
        );
      }

      // Should get some result (either backup success or emergency fallback)
      expect(finalResult).toBeDefined();
      expect(typeof finalResult).toBe('string');
      expect(primaryFailures).toBeGreaterThan(0);
    });

    it('should recover from failures automatically', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('recovery-service');
      
      let callCount = 0;
      let recoveryDetected = false;

      const recoveringService = async () => {
        callCount++;
        if (callCount <= 5) {
          throw new Error(`Failure ${callCount}`);
        }
        recoveryDetected = true;
        return 'recovered';
      };

      // Initial failures should open circuit
      for (let i = 0; i < 6; i++) {
        await circuitBreaker.execute(recoveringService);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Wait for circuit breaker timeout and recovery
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try again - should attempt recovery
      const result = await circuitBreaker.execute(recoveringService);
      
      if (result.success) {
        expect(result.data).toBe('recovered');
        expect(recoveryDetected).toBe(true);
      }
    });

    it('should provide comprehensive system health status', async () => {
      // Set up multiple services with different health states
      const healthyCircuit = circuitBreakerManager.getCircuitBreaker('healthy-service');
      const unhealthyCircuit = circuitBreakerManager.getCircuitBreaker('unhealthy-service');

      // Make healthy service succeed
      await healthyCircuit.execute(async () => 'success');

      // Make unhealthy service fail multiple times
      for (let i = 0; i < 6; i++) {
        await unhealthyCircuit.execute(async () => {
          throw new Error('Service down');
        });
      }

      // Add endpoints to failover manager
      failoverManager.addEndpoint({ id: 'healthy', url: 'http://healthy:8080', priority: 1 });
      failoverManager.addEndpoint({ id: 'unhealthy', url: 'http://unhealthy:8080', priority: 2 });
      
      // Mark one as unhealthy
      failoverManager.markEndpointUnhealthy('unhealthy', new Error('Service down'));

      // Generate some errors for monitoring
      errorMonitor.recordError(new MCPErrorClass(MCPErrorCode.SERVICE_UNAVAILABLE, 'Service down'));
      errorMonitor.recordError(new MCPErrorClass(MCPErrorCode.CONNECTION_TIMEOUT, 'Timeout'));

      await new Promise(resolve => setTimeout(resolve, 150));

      // Get comprehensive health status
      const circuitBreakerHealth = circuitBreakerManager.getSystemHealth();
      const failoverStats = failoverManager.getStats();
      const degradationStatus = degradationManager.getServiceStatus();
      const errorMetrics = errorMonitor.getCurrentMetrics();

      expect(circuitBreakerHealth.totalCircuits).toBe(2);
      expect(circuitBreakerHealth.openCircuits).toBeGreaterThan(0);
      
      expect(failoverStats.totalEndpoints).toBe(2);
      expect(failoverStats.healthyEndpoints).toBeLessThan(2);
      
      expect(degradationStatus.serviceName).toBe('test-service');
      expect(degradationStatus.errorCount).toBeGreaterThanOrEqual(0);
      
      expect(errorMetrics.totalErrors).toBeGreaterThan(0);
      expect(errorMetrics.healthScore).toBeLessThan(100);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance under concurrent load', async () => {
      const circuitBreaker = circuitBreakerManager.getCircuitBreaker('load-test-service');
      
      let successCount = 0;
      let failureCount = 0;

      const loadTestService = async () => {
        // Simulate variable response times and occasional failures
        const delay = Math.random() * 10;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (Math.random() < 0.1) { // 10% failure rate
          throw new Error('Random failure');
        }
        
        return 'success';
      };

      // Execute concurrent requests
      const promises = Array.from({ length: 50 }, async () => {
        const result = await circuitBreaker.execute(loadTestService);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
        return result;
      });

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(50);
      expect(successCount + failureCount).toBe(50);
      expect(successCount).toBeGreaterThan(0); // Should have some successes
      
      // Circuit breaker should still be functional
      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(50);
    });
  });
});