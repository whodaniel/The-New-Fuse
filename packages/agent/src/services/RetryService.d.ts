import { BaseService } from '../core/BaseService';
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
 * Service providing utility for retrying asynchronous operations with exponential backoff.
 */
export declare class RetryService extends BaseService {
    private logger;
    constructor();
    /**
     * Executes an asynchronous function with retry logic.
     * @param operation The asynchronous function to execute.
     * @param options Retry configuration options.
     * @returns A promise that resolves with the result of the operation or rejects if all retries fail.
     */
    execute<T>(operation: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T>;
}
//# sourceMappingURL=RetryService.d.ts.map