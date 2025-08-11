interface CircuitBreakerConfig {
  // Implementation needed
}
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export class CircuitBreaker {
  // Implementation needed
}
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenRequests = 0;
  private readonly config: CircuitBreakerConfig;
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
  // Implementation needed
}
    this.config = {
  // Implementation needed
}
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      halfOpenRequests: config.halfOpenRequests || 3
    };
  }

  async execute<T>(operation() => Promise<T>): Promise<T> {
  // Implementation needed
}
    if (this.isOpen() && !this.shouldAttemptReset()) {
  // Implementation needed
}
      throw new Error('Circuit breaker is OPEN');
    }

    if (this.isHalfOpen() && this.halfOpenRequests >= this.config.halfOpenRequests) {
  // Implementation needed
}
      throw new Error('Circuit breaker is HALF_OPEN - too many requests');
    }

    try {
  // Implementation needed
}
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
  // Implementation needed
}
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
  // Implementation needed
}
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
  // Implementation needed
}
      this.state = 'HALF_OPEN';
      this.halfOpenRequests = 0;
      return true;
    }
    return false;
  }

  private onSuccess(): void {
  // Implementation needed
}
    this.failureCount = 0;
    this.halfOpenRequests = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
  // Implementation needed
}
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN') {
  // Implementation needed
}
      this.state = 'OPEN';
    } else if (this.failureCount >= this.config.failureThreshold) {
  // Implementation needed
}
      this.state = 'OPEN';
    }
  }

  isOpen(): boolean {
  // Implementation needed
}
    return this.state === 'OPEN';
  }

  isClosed(): boolean {
  // Implementation needed
}
    return this.state === 'CLOSED';
  }

  isHalfOpen(): boolean {
  // Implementation needed
}
    return this.state === 'HALF_OPEN';
  }

  getState(): CircuitBreakerState {
  // Implementation needed
}
    return this.state;
  }

  getFailureCount(): number {
  // Implementation needed
}
    return this.failureCount;
  }

  reset(): void {
  // Implementation needed
}
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenRequests = 0;
    this.lastFailureTime = 0;
  }
}