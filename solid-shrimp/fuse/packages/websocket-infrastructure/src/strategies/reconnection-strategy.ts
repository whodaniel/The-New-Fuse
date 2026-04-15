import { Logger } from '@nestjs/common';
import { ReconnectionStrategy } from '../types';

/**
 * Exponential backoff reconnection strategy
 */
export class ExponentialBackoffStrategy implements ReconnectionStrategy {
  private readonly logger = new Logger(ExponentialBackoffStrategy.name);

  public maxAttempts: number;
  public initialDelay: number;
  public maxDelay: number;
  public backoffMultiplier: number;

  constructor(
    maxAttempts: number = 10,
    initialDelay: number = 1000,
    maxDelay: number = 30000,
    backoffMultiplier: number = 2
  ) {
    this.maxAttempts = maxAttempts;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.backoffMultiplier = backoffMultiplier;
  }

  /**
   * Calculate delay for next reconnection attempt
   */
  public calculateDelay(attemptNumber: number): number {
    if (attemptNumber >= this.maxAttempts) {
      return -1; // No more attempts
    }

    const delay = Math.min(
      this.initialDelay * Math.pow(this.backoffMultiplier, attemptNumber),
      this.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Check if should retry
   */
  public shouldRetry(attemptNumber: number): boolean {
    return attemptNumber < this.maxAttempts;
  }
}

/**
 * Linear backoff reconnection strategy
 */
export class LinearBackoffStrategy implements ReconnectionStrategy {
  private readonly logger = new Logger(LinearBackoffStrategy.name);

  public maxAttempts: number;
  public initialDelay: number;
  public maxDelay: number;
  public backoffMultiplier: number;

  constructor(
    maxAttempts: number = 10,
    initialDelay: number = 1000,
    maxDelay: number = 10000,
    increment: number = 1000
  ) {
    this.maxAttempts = maxAttempts;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.backoffMultiplier = increment;
  }

  /**
   * Calculate delay for next reconnection attempt
   */
  public calculateDelay(attemptNumber: number): number {
    if (attemptNumber >= this.maxAttempts) {
      return -1;
    }

    const delay = Math.min(
      this.initialDelay + attemptNumber * this.backoffMultiplier,
      this.maxDelay
    );

    return delay;
  }

  /**
   * Check if should retry
   */
  public shouldRetry(attemptNumber: number): boolean {
    return attemptNumber < this.maxAttempts;
  }
}

/**
 * Fibonacci backoff reconnection strategy
 */
export class FibonacciBackoffStrategy implements ReconnectionStrategy {
  private readonly logger = new Logger(FibonacciBackoffStrategy.name);

  public maxAttempts: number;
  public initialDelay: number;
  public maxDelay: number;
  public backoffMultiplier: number = 1;

  constructor(maxAttempts: number = 10, initialDelay: number = 1000, maxDelay: number = 30000) {
    this.maxAttempts = maxAttempts;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
  }

  /**
   * Calculate Fibonacci number
   */
  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    let a = 1,
      b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  /**
   * Calculate delay for next reconnection attempt
   */
  public calculateDelay(attemptNumber: number): number {
    if (attemptNumber >= this.maxAttempts) {
      return -1;
    }

    const fib = this.fibonacci(attemptNumber);
    const delay = Math.min(this.initialDelay * fib, this.maxDelay);

    return delay;
  }

  /**
   * Check if should retry
   */
  public shouldRetry(attemptNumber: number): boolean {
    return attemptNumber < this.maxAttempts;
  }
}

/**
 * Reconnection manager that handles reconnection logic
 */
export class ReconnectionManager {
  private readonly logger = new Logger(ReconnectionManager.name);
  private attemptCount: number = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private isReconnecting: boolean = false;

  constructor(private readonly strategy: ReconnectionStrategy) {}

  /**
   * Attempt reconnection with strategy
   */
  public async attemptReconnection(
    reconnectFn: () => Promise<void>,
    onSuccess?: () => void,
    onFailure?: (error: Error) => void
  ): Promise<void> {
    if (this.isReconnecting) {
      this.logger.debug('Reconnection already in progress');
      return;
    }

    this.isReconnecting = true;

    const delay = this.strategy.calculateDelay(this.attemptCount);

    if (delay === -1) {
      this.logger.error('Maximum reconnection attempts reached');
      this.isReconnecting = false;
      if (onFailure) {
        onFailure(new Error('Maximum reconnection attempts reached'));
      }
      return;
    }

    this.logger.log(
      `Reconnection attempt ${this.attemptCount + 1}/${this.strategy.maxAttempts} in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await reconnectFn();
        this.logger.log('Reconnection successful');
        this.reset();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        this.attemptCount++;
        this.isReconnecting = false;
        this.logger.error(`Reconnection attempt ${this.attemptCount} failed: ${error}`);

        if (this.strategy.shouldRetry(this.attemptCount)) {
          await this.attemptReconnection(reconnectFn, onSuccess, onFailure);
        } else if (onFailure) {
          onFailure(error as Error);
        }
      }
    }, delay);
  }

  /**
   * Cancel ongoing reconnection
   */
  public cancel(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.isReconnecting = false;
    this.logger.log('Reconnection cancelled');
  }

  /**
   * Reset reconnection state
   */
  public reset(): void {
    this.attemptCount = 0;
    this.isReconnecting = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  /**
   * Get current attempt count
   */
  public getAttemptCount(): number {
    return this.attemptCount;
  }

  /**
   * Check if reconnecting
   */
  public isAttemptingReconnection(): boolean {
    return this.isReconnecting;
  }
}
