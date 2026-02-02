/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures in distributed systems by
 * temporarily rejecting operations when failure threshold is exceeded.
 */

import { Logger } from './logger.js';
import { CircuitBreakerConfig, CircuitBreakerState } from './types.js';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenCalls: number = 0;
  private logger: Logger;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    logger?: Logger
  ) {
    this.logger =
      logger ||
      new Logger({
        level: 'info',
        format: 'pretty',
        output: 'console',
        includeTraceId: true,
      });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if we should transition to HALF_OPEN
      if (Date.now() - this.lastFailureTime >= this.config.timeoutMs) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker '${this.name}' is OPEN`,
          this.name,
          this.state
        );
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new CircuitBreakerError(
        `Circuit breaker '${this.name}' HALF_OPEN limit reached`,
        this.name,
        this.state
      );
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
        this.logger.info(`Circuit breaker '${this.name}' closed after successful recovery`, {
          circuitBreaker: this.name,
          state: this.state,
        });
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
      this.logger.warn(
        `Circuit breaker '${this.name}' opened after ${this.failureCount} failures`,
        {
          circuitBreaker: this.name,
          failureCount: this.failureCount,
          state: this.state,
        }
      );
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenCalls = 0;
    } else if (newState === 'HALF_OPEN') {
      this.halfOpenCalls = 0;
      this.successCount = 0;
    }

    this.logger.debug(`Circuit breaker '${this.name}' transitioned: ${oldState} -> ${newState}`, {
      circuitBreaker: this.name,
      from: oldState,
      to: newState,
    });
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getMetrics(): {
    state: CircuitBreakerState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Force the circuit breaker to a specific state
   */
  forceState(state: CircuitBreakerState): void {
    this.transitionTo(state);
    this.logger.info(`Circuit breaker '${this.name}' manually set to ${state}`, {
      circuitBreaker: this.name,
      state,
    });
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitBreakerName: string,
    public readonly state: CircuitBreakerState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// Default configuration
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeoutMs: 60000, // 1 minute
  halfOpenMaxCalls: 3,
};

// Registry for managing multiple circuit breakers
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {
    this.defaultConfig = defaultConfig;
  }

  get(name: string): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, this.defaultConfig));
    }
    return this.breakers.get(name)!;
  }

  create(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const breaker = new CircuitBreaker(name, mergedConfig);
    this.breakers.set(name, breaker);
    return breaker;
  }

  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  getMetrics(): Record<string, ReturnType<CircuitBreaker['getMetrics']>> {
    const metrics: Record<string, ReturnType<CircuitBreaker['getMetrics']>> = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }
}

// Singleton registry
let registry: CircuitBreakerRegistry | null = null;

export function getCircuitBreakerRegistry(): CircuitBreakerRegistry {
  if (!registry) {
    registry = new CircuitBreakerRegistry();
  }
  return registry;
}
