import { BaseService } from '../core/BaseService.js'; // Corrected import path
import { Logger } from '@packages/utils'; // Assuming Logger is available

/**
 * Options for configuring retry behavior.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts. */
  maxAttempts: number;
  /** Initial delay in milliseconds before the first retry. */
  initialDelayMs: number;
  /** Multiplier for exponential backoff (e.g., 2 for doubling the delay). */
  backoffMultiplier?: number;
  /** Maximum delay in milliseconds between retries. */
  maxDelayMs?: number;
  /** Optional function to determine if an error is retryable. Defaults to always retry. */
  isRetryable?: (error: Error) => boolean;
  /** Optional callback executed before each retry attempt. */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

/**
 * Default retry options.
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'isRetryable' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  backoffMultiplier: 2,
  maxDelayMs: 30000, // 30 seconds
};

/**
 * Service providing utility for retrying asynchronous operations with exponential backoff.
 */
export class RetryService extends BaseService {
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('RetryService');
    this.logger.info('RetryService initialized.');
  }

  /**
   * Executes an asynchronous function with retry logic.
   * @param operation The asynchronous function to execute.
   * @param options Retry configuration options.
   * @returns A promise that resolves with the result of the operation or rejects if all retries fail.
   */
  async execute<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const config: Required<Omit<RetryOptions, 'isRetryable' | 'onRetry'>> & Pick<RetryOptions, 'isRetryable' | 'onRetry'> = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    };

    let attempt = 0;
    let currentDelay = config.initialDelayMs;

    while (attempt < config.maxAttempts) {
      attempt++;
      try {
        this.logger.debug(`Attempt ${attempt} for operation...`);
        const result = await operation();
        if (attempt > 1) {
          this.logger.info(`Operation succeeded on attempt ${attempt}.`);
        }
        return result;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed: ${error.message}`, error);

        if (attempt >= config.maxAttempts) {
          this.logger.error(`Operation failed after ${attempt} attempts. Giving up.`);
          throw error; // Rethrow the last error
        }

        if (config.isRetryable && !config.isRetryable(error as Error)) {
          this.logger.error(`Error is not retryable. Giving up after attempt ${attempt}.`);
          throw error;
        }

        const delay = Math.min(currentDelay, config.maxDelayMs);

        if (config.onRetry) {
          try {
            config.onRetry(attempt, delay, error as Error);
          } catch (onRetryError) {
            this.logger.error(`Error in onRetry callback: ${onRetryError.message}`, onRetryError);
            // Continue with the retry despite the callback error
          }
        }

        this.logger.info(`Waiting ${delay}ms before next retry (attempt ${attempt + 1})...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Calculate next delay
        currentDelay = Math.min(
          currentDelay * (config.backoffMultiplier ?? DEFAULT_RETRY_OPTIONS.backoffMultiplier),
          config.maxDelayMs
        );
      }
    }

    // This line should theoretically be unreachable due to the throw in the loop,
    // but it satisfies TypeScript's need for a return path.
    throw new Error('Retry logic failed unexpectedly.');
  }

  /**
   * Utility function to create a delay promise.
   * @param ms Delay duration in milliseconds.
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
