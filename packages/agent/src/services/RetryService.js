"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryService = void 0;
const BaseService_1 = require("../core/BaseService");
const common_1 = require("@nestjs/common");
/**
 * Default retry options.
 */
const DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    initialDelayMs: 100,
    backoffMultiplier: 2,
    maxDelayMs: 30000, // 30 seconds
};
/**
 * Service providing utility for retrying asynchronous operations with exponential backoff.
 */
class RetryService extends BaseService_1.BaseService {
    logger;
    constructor() {
        super({ name: 'RetryService' });
        this.logger = new common_1.Logger('RetryService');
        this.logger.log('RetryService initialized.');
    }
    /**
     * Executes an asynchronous function with retry logic.
     * @param operation The asynchronous function to execute.
     * @param options Retry configuration options.
     * @returns A promise that resolves with the result of the operation or rejects if all retries fail.
     */
    async execute(operation, options) {
        const config = {
            ...DEFAULT_RETRY_OPTIONS,
            ...options,
        };
        let attempt = 0;
        let currentDelay = config.initialDelayMs;
        while (attempt < config.maxAttempts) {
            attempt++;
            try {
                this.logger.debug(`Attempt ${attempt} for operation...);
        const result = await operation();
        if (attempt > 1) {`, this.logger.log(`Operation succeeded on attempt ${attempt}`.));
            }
            finally {
            }
            return result;
        }
        try { }
        catch (error) {
            this.logger.warn(Attempt, $, { attempt }, failed, $, { error, instanceof: Error ? error.message : String(error) });
            if (attempt >= config.maxAttempts) {
                `
          this.logger.error(Operation failed after ${attempt}`;
                attempts.Giving;
                up.;
                ;
                throw error; // Rethrow the last error
            }
            if (config.isRetryable && !config.isRetryable(error)) {
                this.logger.error(Error, is, not, retryable.Giving, up, after, attempt, $, { attempt }. `);
          throw error;
        }

        const delay = Math.min(currentDelay, config.maxDelayMs);

        if (config.onRetry) {
          try {
            config.onRetry(attempt, delay, error as Error);
          } catch (onRetryError) {
            this.logger.error(Error in onRetry callback: ${onRetryError.message});
            // Continue with the retry despite the callback error
          }
        }` `
        this.logger.log(`, Waiting, $, { delay }, ms, before, next, retry(attempt, $, { attempt } + 1));
            }
            `);
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
            ;
        }
    }
}
exports.RetryService = RetryService;
//# sourceMappingURL=RetryService.js.map