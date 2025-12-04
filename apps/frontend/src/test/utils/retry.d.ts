export interface RetryOptions {
    maxAttempts?: number;
    backoff?: number;
    maxBackoff?: number;
    timeout?: number;
}
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
