/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerConfig {
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Success threshold to close circuit from half-open */
  successThreshold: number;
  /** Timeout before attempting to close circuit (ms) */
  timeout: number;
  /** Rolling window size for failure counting */
  rollingWindowSize: number;
  /** Rolling window time period (ms) */
  rollingWindowTime: number;
  /** Enable monitoring */
  enableMonitoring: boolean;
}

export interface CircuitBreakerStats {
  /** Current state */
  state: CircuitState;
  /** Total requests */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Rejected requests (circuit open) */
  rejectedRequests: number;
  /** Success rate percentage */
  successRate: number;
  /** Failure rate percentage */
  failureRate: number;
  /** Last state change timestamp */
  lastStateChange: Date;
  /** Time until next retry (for open state) */
  timeUntilRetry?: number;
}

export interface RequestResult<T> {
  /** Whether request was successful */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error if failed */
  error?: Error;
  /** Whether request was rejected by circuit breaker */
  rejected: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker<T = any> extends EventEmitter {
  private readonly config: CircuitBreakerConfig;
  private readonly logger: Logger;
  private readonly name: string;
  
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  
  // Rolling window for failure tracking
  private readonly requestHistory: Array<{ timestamp: Date; success: boolean }> = [];
  
  // Statistics
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private rejectedRequests = 0;
  private lastStateChange = new Date();

  constructor(
    name: string,
    config: Partial<CircuitBreakerConfig> = {},
    logger?: Logger
  ) {
    super();
    
    this.name = name;
    this.config = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
      rollingWindowSize: 10,
      rollingWindowTime: 60000, // 1 minute
      enableMonitoring: true,
      ...config
    };
    
    this.logger = logger || new Logger(`CircuitBreaker:${name}`);
    
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<R = T>(fn: () => Promise<R>): Promise<RequestResult<R>> {
    const startTime = Date.now();
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (!this.canAttemptReset()) {
        this.rejectedRequests++;
        this.emit('requestRejected', this.name, this.state);
        
        return {
          success: false,
          rejected: true,
          executionTime: Date.now() - startTime,
          error: new Error(`Circuit breaker is OPEN for ${this.name}`)
        };
      } else {
        // Transition to half-open
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }

    try {
      const result = await fn();
      const executionTime = Date.now() - startTime;
      
      this.onSuccess();
      
      return {
        success: true,
        data: result,
        rejected: false,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        rejected: false,
        executionTime
      };
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    const now = Date.now();
    const timeUntilRetry = this.nextAttemptTime ? 
      Math.max(0, this.nextAttemptTime.getTime() - now) : undefined;

    return {
      state: this.state,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      rejectedRequests: this.rejectedRequests,
      successRate: this.totalRequests > 0 ? 
        (this.successfulRequests / this.totalRequests) * 100 : 0,
      failureRate: this.totalRequests > 0 ? 
        (this.failedRequests / this.totalRequests) * 100 : 0,
      lastStateChange: this.lastStateChange,
      timeUntilRetry
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.requestHistory.length = 0;
    
    this.logger.info(`Circuit breaker ${this.name} manually reset`);
    this.emit('manualReset', this.name);
  }

  /**
   * Get circuit breaker name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.successfulRequests++;
    this.addToHistory(true);

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }

    this.emit('requestSuccess', this.name, this.state);
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error): void {
    this.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.addToHistory(false);

    this.emit('requestFailure', this.name, this.state, error);

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      this.transitionTo(CircuitState.OPEN);
      this.successCount = 0;
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    // Simple threshold check
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Rolling window check
    const recentFailures = this.getRecentFailures();
    const recentRequests = this.getRecentRequests();
    
    if (recentRequests >= this.config.rollingWindowSize) {
      const failureRate = recentFailures / recentRequests;
      return failureRate >= (this.config.failureThreshold / this.config.rollingWindowSize);
    }

    return false;
  }

  /**
   * Check if we can attempt to reset the circuit
   */
  private canAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
      return false;
    }

    return Date.now() >= this.nextAttemptTime.getTime();
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();

    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
    } else if (newState === CircuitState.CLOSED) {
      this.nextAttemptTime = undefined;
    }

    this.logger.info(`Circuit breaker ${this.name} transitioned from ${oldState} to ${newState}`);
    this.emit('stateChange', this.name, oldState, newState);
  }

  /**
   * Add request result to history
   */
  private addToHistory(success: boolean): void {
    const now = new Date();
    this.requestHistory.push({ timestamp: now, success });

    // Clean up old entries
    const cutoff = new Date(now.getTime() - this.config.rollingWindowTime);
    const firstValidIndex = this.requestHistory.findIndex(entry => entry.timestamp >= cutoff);
    
    if (firstValidIndex > 0) {
      this.requestHistory.splice(0, firstValidIndex);
    }

    // Limit size
    if (this.requestHistory.length > this.config.rollingWindowSize * 2) {
      this.requestHistory.splice(0, this.requestHistory.length - this.config.rollingWindowSize);
    }
  }

  /**
   * Get recent failure count
   */
  private getRecentFailures(): number {
    const cutoff = new Date(Date.now() - this.config.rollingWindowTime);
    return this.requestHistory
      .filter(entry => entry.timestamp >= cutoff && !entry.success)
      .length;
  }

  /**
   * Get recent request count
   */
  private getRecentRequests(): number {
    const cutoff = new Date(Date.now() - this.config.rollingWindowTime);
    return this.requestHistory
      .filter(entry => entry.timestamp >= cutoff)
      .length;
  }

  /**
   * Start monitoring (emit periodic stats)
   */
  private startMonitoring(): void {
    const monitoringInterval = setInterval(() => {
      this.emit('stats', this.name, this.getStats());
    }, 30000); // Every 30 seconds

    // Clean up on process exit
    process.once('exit', () => {
      clearInterval(monitoringInterval);
    });
  }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager extends EventEmitter {
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    super();
    this.logger = logger || new Logger('CircuitBreakerManager');
  }

  /**
   * Create or get a circuit breaker
   */
  getCircuitBreaker<T = any>(
    name: string, 
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker<T> {
    let circuitBreaker = this.circuitBreakers.get(name);
    
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker<T>(name, config, this.logger);
      this.circuitBreakers.set(name, circuitBreaker);
      
      // Forward events
      circuitBreaker.on('stateChange', (...args) => this.emit('stateChange', ...args));
      circuitBreaker.on('requestFailure', (...args) => this.emit('requestFailure', ...args));
      circuitBreaker.on('requestSuccess', (...args) => this.emit('requestSuccess', ...args));
      circuitBreaker.on('requestRejected', (...args) => this.emit('requestRejected', ...args));
      
      this.logger.debug(`Created circuit breaker: ${name}`);
    }
    
    return circuitBreaker as CircuitBreaker<T>;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      stats[name] = circuitBreaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
    }
    
    this.logger.info('All circuit breakers reset');
    this.emit('allReset');
  }

  /**
   * Get circuit breaker by name
   */
  getByName(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Remove circuit breaker
   */
  remove(name: string): boolean {
    const removed = this.circuitBreakers.delete(name);
    if (removed) {
      this.logger.debug(`Removed circuit breaker: ${name}`);
    }
    return removed;
  }

  /**
   * Get all circuit breaker names
   */
  getNames(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }

  /**
   * Check overall system health
   */
  getSystemHealth(): {
    healthy: boolean;
    totalCircuits: number;
    healthyCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
  } {
    const stats = this.getAllStats();
    const totalCircuits = Object.keys(stats).length;
    
    let healthyCircuits = 0;
    let openCircuits = 0;
    let halfOpenCircuits = 0;
    
    for (const stat of Object.values(stats)) {
      switch (stat.state) {
        case CircuitState.CLOSED:
          healthyCircuits++;
          break;
        case CircuitState.OPEN:
          openCircuits++;
          break;
        case CircuitState.HALF_OPEN:
          halfOpenCircuits++;
          break;
      }
    }
    
    return {
      healthy: openCircuits === 0,
      totalCircuits,
      healthyCircuits,
      openCircuits,
      halfOpenCircuits
    };
  }
}