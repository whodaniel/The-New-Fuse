import { Injectable } from '@nestjs/common';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

@Injectable()
export class CircuitBreakerService {
  private states: Map<string, CircuitBreakerState> = new Map();
  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
  };

  async execute<T>(
    key: string,
    operation: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ): Promise<T> {
    const { failureThreshold, resetTimeout } = {
      ...this.defaultOptions,
      ...options,
    };

    const state = this.getState(key);

    if (state.isOpen) {
      if (Date.now() - state.lastFailureTime >= resetTimeout) {
        state.isOpen = false;
        state.failures = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      state.failures = 0;
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailureTime = Date.now();

      if (state.failures >= failureThreshold) {
        state.isOpen = true;
      }

      throw error;
    }
  }

  private getState(key: string): CircuitBreakerState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        failures: 0,
        lastFailureTime: 0,
        isOpen: false,
      });
    }
    return this.states.get(key);
  }

  reset(key: string): void {
    this.states.delete(key);
  }

  resetAll(): void {
    this.states.clear();
  }
}