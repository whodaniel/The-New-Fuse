/**
 * Unit tests for CircuitBreaker
 */

import { Logger } from '../utils/Logger';
import { CircuitBreaker, CircuitBreakerManager, CircuitState } from './CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLogLevel: jest.fn(),
      getLogLevel: jest.fn(),
    } as any;

    circuitBreaker = new CircuitBreaker(
      'test-circuit',
      {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        enableMonitoring: false,
      },
      mockLogger
    );
  });

  describe('Basic Functionality', () => {
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.isHealthy()).toBe(true);
    });

    it('should execute successful operations', async () => {
      const successfulOperation = async () => 'success';

      const result = await circuitBreaker.execute(successfulOperation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.rejected).toBe(false);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle failed operations', async () => {
      const failingOperation = async () => {
        throw new Error('Operation failed');
      };

      const result = await circuitBreaker.execute(failingOperation);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Operation failed');
      expect(result.rejected).toBe(false);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('State Transitions', () => {
    it('should open circuit after failure threshold', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // Execute failures up to threshold
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(failingOperation);
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.isHealthy()).toBe(false);
    });

    it('should reject requests when circuit is open', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(failingOperation);
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Next request should be rejected
      const result = await circuitBreaker.execute(async () => 'should not execute');

      expect(result.success).toBe(false);
      expect(result.rejected).toBe(true);
      expect(result.error?.message).toContain('Circuit breaker is OPEN');
    });

    it('should transition to half-open after timeout', async () => {
      const shortTimeoutCircuit = new CircuitBreaker(
        'short-timeout',
        {
          failureThreshold: 2,
          timeout: 50, // 50ms timeout
        },
        mockLogger
      );

      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await shortTimeoutCircuit.execute(failingOperation);
      }

      expect(shortTimeoutCircuit.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Next request should transition to half-open
      const result = await shortTimeoutCircuit.execute(async () => 'test');

      // Should have attempted the operation (not rejected)
      expect(result.rejected).toBe(false);
    });

    it('should close circuit after successful operations in half-open state', async () => {
      const shortTimeoutCircuit = new CircuitBreaker(
        'half-open-test',
        {
          failureThreshold: 2,
          successThreshold: 2,
          timeout: 50,
        },
        mockLogger
      );

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await shortTimeoutCircuit.execute(async () => {
          throw new Error('Failure');
        });
      }

      expect(shortTimeoutCircuit.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Execute successful operations
      for (let i = 0; i < 2; i++) {
        const result = await shortTimeoutCircuit.execute(async () => 'success');
        if (i === 0) {
          expect(shortTimeoutCircuit.getState()).toBe(CircuitState.HALF_OPEN);
        }
      }

      expect(shortTimeoutCircuit.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in half-open state', async () => {
      const shortTimeoutCircuit = new CircuitBreaker(
        'reopen-test',
        {
          failureThreshold: 2,
          timeout: 50,
        },
        mockLogger
      );

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await shortTimeoutCircuit.execute(async () => {
          throw new Error('Failure');
        });
      }

      expect(shortTimeoutCircuit.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Fail in half-open state
      await shortTimeoutCircuit.execute(async () => {
        throw new Error('Still failing');
      });

      expect(shortTimeoutCircuit.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistics', () => {
    it('should track request statistics', async () => {
      const successfulOperation = async () => 'success';
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // Execute mixed operations
      await circuitBreaker.execute(successfulOperation);
      await circuitBreaker.execute(successfulOperation);
      await circuitBreaker.execute(failingOperation);

      const stats = circuitBreaker.getStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.failureRate).toBeCloseTo(33.33, 1);
    });

    it('should track rejected requests', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(failingOperation);
      }

      // Execute rejected request
      await circuitBreaker.execute(async () => 'should not execute');

      const stats = circuitBreaker.getStats();

      expect(stats.rejectedRequests).toBe(1);
      expect(stats.state).toBe(CircuitState.OPEN);
    });
  });

  describe('Events', () => {
    it('should emit state change events', (done) => {
      circuitBreaker.once('stateChange', (name, oldState, newState) => {
        expect(name).toBe('test-circuit');
        expect(oldState).toBe(CircuitState.CLOSED);
        expect(newState).toBe(CircuitState.OPEN);
        done();
      });

      // Trigger state change
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      Promise.all([
        circuitBreaker.execute(failingOperation),
        circuitBreaker.execute(failingOperation),
        circuitBreaker.execute(failingOperation),
      ]);
    });

    it('should emit request events', async () => {
      const events: string[] = [];

      circuitBreaker.on('requestSuccess', () => events.push('success'));
      circuitBreaker.on('requestFailure', () => events.push('failure'));
      circuitBreaker.on('requestRejected', () => events.push('rejected'));

      // Execute operations
      await circuitBreaker.execute(async () => 'success');
      await circuitBreaker.execute(async () => {
        throw new Error('failure');
      });

      expect(events).toContain('success');
      expect(events).toContain('failure');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset circuit to closed state', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await circuitBreaker.execute(failingOperation);
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset the circuit
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.isHealthy()).toBe(true);

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });

    it('should emit manual reset event', (done) => {
      circuitBreaker.once('manualReset', (name) => {
        expect(name).toBe('test-circuit');
        done();
      });

      circuitBreaker.reset();
    });
  });

  describe('Rolling Window', () => {
    it('should use rolling window for failure detection', async () => {
      const rollingWindowCircuit = new CircuitBreaker(
        'rolling-window',
        {
          failureThreshold: 3,
          rollingWindowSize: 5,
          rollingWindowTime: 1000,
        },
        mockLogger
      );

      // Execute mixed operations within rolling window
      await rollingWindowCircuit.execute(async () => 'success');
      await rollingWindowCircuit.execute(async () => {
        throw new Error('failure');
      });
      await rollingWindowCircuit.execute(async () => {
        throw new Error('failure');
      });
      await rollingWindowCircuit.execute(async () => {
        throw new Error('failure');
      });

      // Should open due to failure rate in rolling window
      expect(rollingWindowCircuit.getState()).toBe(CircuitState.OPEN);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLogLevel: jest.fn(),
      getLogLevel: jest.fn(),
    } as any;

    manager = new CircuitBreakerManager(mockLogger);
  });

  describe('Circuit Breaker Management', () => {
    it('should create and manage multiple circuit breakers', () => {
      const cb1 = manager.getCircuitBreaker('service1');
      const cb2 = manager.getCircuitBreaker('service2');
      const cb1Again = manager.getCircuitBreaker('service1');

      expect(cb1).toBeDefined();
      expect(cb2).toBeDefined();
      expect(cb1).toBe(cb1Again); // Should return same instance
      expect(cb1).not.toBe(cb2);

      expect(manager.getNames()).toEqual(['service1', 'service2']);
    });

    it('should get circuit breaker by name', () => {
      const cb = manager.getCircuitBreaker('test-service');
      const retrieved = manager.getByName('test-service');

      expect(retrieved).toBe(cb);
      expect(manager.getByName('non-existent')).toBeUndefined();
    });

    it('should remove circuit breakers', () => {
      manager.getCircuitBreaker('removable');
      expect(manager.getNames()).toContain('removable');

      const removed = manager.remove('removable');
      expect(removed).toBe(true);
      expect(manager.getNames()).not.toContain('removable');

      const removedAgain = manager.remove('removable');
      expect(removedAgain).toBe(false);
    });

    it('should reset all circuit breakers', async () => {
      const cb1 = manager.getCircuitBreaker('service1');
      const cb2 = manager.getCircuitBreaker('service2');

      // Open both circuits
      for (let i = 0; i < 5; i++) {
        await cb1.execute(async () => {
          throw new Error('failure');
        });
        await cb2.execute(async () => {
          throw new Error('failure');
        });
      }

      expect(cb1.getState()).toBe(CircuitState.OPEN);
      expect(cb2.getState()).toBe(CircuitState.OPEN);

      manager.resetAll();

      expect(cb1.getState()).toBe(CircuitState.CLOSED);
      expect(cb2.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('System Health', () => {
    it('should provide system health overview', async () => {
      const cb1 = manager.getCircuitBreaker('healthy-service');
      const cb2 = manager.getCircuitBreaker('unhealthy-service');

      // Keep one healthy, make one unhealthy
      await cb1.execute(async () => 'success');

      for (let i = 0; i < 5; i++) {
        await cb2.execute(async () => {
          throw new Error('failure');
        });
      }

      const health = manager.getSystemHealth();

      expect(health.totalCircuits).toBe(2);
      expect(health.healthyCircuits).toBe(1);
      expect(health.openCircuits).toBe(1);
      expect(health.healthy).toBe(false); // System not healthy due to open circuit
    });

    it('should get all circuit breaker statistics', async () => {
      const cb1 = manager.getCircuitBreaker('service1');
      const cb2 = manager.getCircuitBreaker('service2');

      await cb1.execute(async () => 'success');
      await cb2.execute(async () => {
        throw new Error('failure');
      });

      const allStats = manager.getAllStats();

      expect(Object.keys(allStats)).toEqual(['service1', 'service2']);
      expect(allStats['service1'].successfulRequests).toBe(1);
      expect(allStats['service2'].failedRequests).toBe(1);
    });
  });

  describe('Event Forwarding', () => {
    it('should forward events from circuit breakers', (done) => {
      const cb = manager.getCircuitBreaker('event-test');

      manager.once('requestSuccess', (name, state) => {
        expect(name).toBe('event-test');
        done();
      });

      cb.execute(async () => 'success');
    });
  });
});
