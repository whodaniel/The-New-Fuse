import { ReconnectionStrategy } from '../types/index.js';
export declare class ExponentialBackoffStrategy implements ReconnectionStrategy {
    private readonly logger;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    constructor(maxAttempts?: number, initialDelay?: number, maxDelay?: number, backoffMultiplier?: number);
    calculateDelay(attemptNumber: number): number;
    shouldRetry(attemptNumber: number): boolean;
}
export declare class LinearBackoffStrategy implements ReconnectionStrategy {
    private readonly logger;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    constructor(maxAttempts?: number, initialDelay?: number, maxDelay?: number, increment?: number);
    calculateDelay(attemptNumber: number): number;
    shouldRetry(attemptNumber: number): boolean;
}
export declare class FibonacciBackoffStrategy implements ReconnectionStrategy {
    private readonly logger;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    constructor(maxAttempts?: number, initialDelay?: number, maxDelay?: number);
    private fibonacci;
    calculateDelay(attemptNumber: number): number;
    shouldRetry(attemptNumber: number): boolean;
}
export declare class ReconnectionManager {
    private readonly strategy;
    private readonly logger;
    private attemptCount;
    private reconnectTimeout?;
    private isReconnecting;
    constructor(strategy: ReconnectionStrategy);
    attemptReconnection(reconnectFn: () => Promise<void>, onSuccess?: () => void, onFailure?: (error: Error) => void): Promise<void>;
    cancel(): void;
    reset(): void;
    getAttemptCount(): number;
    isAttemptingReconnection(): boolean;
}
//# sourceMappingURL=reconnection-strategy.d.ts.map