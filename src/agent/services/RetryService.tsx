import { Injectable, Logger } from "@nestjs/common";
import { RetryConfig } from '../../config/retry.config.js';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: Array<string | RegExp>;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(private readonly config: RetryConfig) {}

  async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = this.config.maxAttempts,
      initialDelay = this.config.initialDelay,
      maxDelay = this.config.maxDelay,
      backoffFactor = this.config.backoffFactor,
      retryableErrors = this.config.retryableErrors,
    } = options;

    let lastError: Error | null = null;
    let attempt = 1;
    let delay = initialDelay;

    while (attempt <= maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRetryableError(lastError, retryableErrors)) {
          throw lastError;
        }

        if (attempt === maxAttempts) {
          throw new Error(
            `Operation failed after ${maxAttempts} attempts. Last error: ${lastError.message}`
          );
        }

        this.logger.warn(
          `Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`
        );

        await this.sleep(delay);
        delay = Math.min(delay * backoffFactor, maxDelay);
        attempt++;
      }
    }

    throw lastError;
  }

  private isRetryableError(
    error: Error,
    retryableErrors: Array<string | RegExp>
  ): boolean {
    return retryableErrors.some((pattern) => {
      if (typeof pattern === "string") {
        return error.message.includes(pattern);
      }
      return pattern.test(error.message);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
