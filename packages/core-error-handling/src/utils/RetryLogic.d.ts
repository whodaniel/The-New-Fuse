/**
 * Retry Logic for Critical Operations
 *
 * @description
 * Provides utilities for implementing retry logic with various strategies
 * including exponential backoff, jitter, and circuit breaker patterns.
 */
import { Logger } from './Logger.js';
/**
 * Retry configuration options
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Initial delay in milliseconds */
    initialDelay: number;
    /** Maximum delay in milliseconds */
    maxDelay?: number;
    /** Backoff multiplier for exponential backoff */
    backoffMultiplier?: number;
    /** Add jitter to delays (prevents thundering herd) */
    jitter?: boolean;
    /** Only retry on specific error types */
    retryableErrors?: Array<new (...args: any[]) => Error>;
    /** Custom function to determine if error is retryable */
    shouldRetry?: (error: Error, attempt: number) => boolean;
    /** Callback called before each retry */
    onRetry?: (error: Error, attempt: number, delay: number) => void | Promise<void>;
    /** Timeout for each attempt in milliseconds */
    timeout?: number;
}
/**
 * Retry result
 */
export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
}
/**
 * Retry statistics
 */
export interface RetryStatistics {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageAttempts: number;
    averageDuration: number;
}
/**
 * Retry handler with various strategies
 */
export declare class RetryHandler {
    private readonly logger;
    private readonly statistics;
    constructor(logger?: Logger);
    /**
     * Execute operation with retry logic
     */
    execute<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>, operationName?: string): Promise<RetryResult<T>>;
    /**
     * Execute with exponential backoff
     */
    withExponentialBackoff<T>(operation: () => Promise<T>, maxAttempts?: number, initialDelay?: number, operationName?: string): Promise<T>;
    /**
     * Execute with linear backoff
     */
    withLinearBackoff<T>(operation: () => Promise<T>, maxAttempts?: number, delay?: number, operationName?: string): Promise<T>;
    /**
     * Execute with custom retry predicate
     */
    withCustomRetry<T>(operation: () => Promise<T>, shouldRetry: (error: Error, attempt: number) => boolean, maxAttempts?: number, operationName?: string): Promise<T>;
    /**
     * Get retry statistics for an operation
     */
    getStatistics(operationName: string): RetryStatistics | undefined;
    /**
     * Get all retry statistics
     */
    getAllStatistics(): Map<string, RetryStatistics>;
    /**
     * Clear statistics
     */
    clearStatistics(operationName?: string): void;
    /**
     * Merge user config with defaults
     */
    private mergeConfig;
    /**
     * Calculate delay for next retry attempt
     */
    private calculateDelay;
    /**
     * Determine if should retry
     */
    private shouldRetry;
    /**
     * Execute operation with timeout
     */
    private executeWithTimeout;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Update retry statistics
     */
    private updateStatistics;
}
/**
 * Circuit Breaker for preventing cascading failures
 */
export declare class CircuitBreaker<T> {
    private readonly operation;
    private readonly config;
    private readonly logger;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private nextAttemptTime?;
    constructor(operation: () => Promise<T>, config: {
        failureThreshold: number;
        resetTimeout: number;
        halfOpenRequests?: number;
        operationName?: string;
    });
    /**
     * Execute operation with circuit breaker
     */
    execute(): Promise<T>;
    /**
     * Get current state
     */
    getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    /**
     * Reset circuit breaker
     */
    reset(): void;
    /**
     * Handle successful execution
     */
    private onSuccess;
    /**
     * Handle failed execution
     */
    private onFailure;
    /**
     * Check if should attempt reset
     */
    private shouldAttemptReset;
}
/**
 * Global retry handler instance
 */
export declare const retryHandler: RetryHandler;
/**
 * Convenience function for retrying operations
 */
export declare function retry<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>, operationName?: string): Promise<T>;
/**
 * Decorator for automatic retry
 */
export declare function Retry(config?: Partial<RetryConfig>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Circuit breaker decorator
 */
export declare function WithCircuitBreaker(config: {
    failureThreshold: number;
    resetTimeout: number;
}): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=RetryLogic.d.ts.map