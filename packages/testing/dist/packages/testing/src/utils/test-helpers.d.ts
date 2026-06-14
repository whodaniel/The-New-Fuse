/**
 * Common Test Helpers
 *
 * Shared utilities for testing across the monorepo.
 */
/**
 * Wait for a condition to be true
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, options?: {
    timeout?: number;
    interval?: number;
}): Promise<void>;
/**
 * Sleep for a specified duration
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Create a mock function with TypeScript support
 */
export declare function mockFn<T extends (...args: any[]) => any>(): jest.Mock<ReturnType<T>, Parameters<T>>;
/**
 * Flush all pending promises
 */
export declare function flushPromises(): Promise<void>;
/**
 * Create a deferred promise
 */
export interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
}
export declare function createDeferred<T>(): Deferred<T>;
/**
 * Generate a random string
 */
export declare function randomString(length?: number): string;
/**
 * Generate a random email
 */
export declare function randomEmail(): string;
/**
 * Generate a random UUID (simple version)
 */
export declare function randomUUID(): string;
/**
 * Create a spy object with all methods as jest.Mock
 */
export declare function createSpyObj<T extends Record<string, any>>(baseName: string, methodNames: (keyof T)[]): {
    [K in keyof T]: jest.Mock;
};
/**
 * Assert that a function throws an error
 */
export declare function expectThrowsAsync(fn: () => Promise<any>, errorMessageOrType?: string | RegExp | (new (...args: any[]) => Error)): Promise<void>;
/**
 * Suppress console output during test
 */
export declare function suppressConsole(methods?: ('log' | 'warn' | 'error' | 'info')[]): () => void;
/**
 * Create a mock date
 */
export declare function mockDate(date: Date | string | number): () => void;
//# sourceMappingURL=test-helpers.d.ts.map