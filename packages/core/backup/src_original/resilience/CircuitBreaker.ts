interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenRequests = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      halfOpenRequests: config.halfOpenRequests || 3
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen() && !this.shouldAttemptReset()) {
      throw new Error('Circuit breaker is OPEN');
    }

    if (this.isHalfOpen() && this.halfOpenRequests >= this.config.halfOpenRequests) {
      throw new Error('Circuit breaker is HALF_OPEN - too many requests');
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

  private shouldAttemptReset(): boolean {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
      this.state = 'HALF_OPEN';
      this.halfOpenRequests = 0;
      return true;
    }
    return false;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.halfOpenRequests = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  isOpen(): boolean {
    return this.state === 'OPEN';
  }

  isClosed(): boolean {
    return this.state === 'CLOSED';
  }

  isHalfOpen(): boolean {
    return this.state === 'HALF_OPEN';
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenRequests = 0;
    this.lastFailureTime = 0;
  }
}