interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenRequests: number;
}
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private lastFailureTime;
    private halfOpenRequests;
    private readonly config;
    constructor(config?: Partial<CircuitBreakerConfig>);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private shouldAttemptReset;
    private onSuccess;
    private onFailure;
    isOpen(): boolean;
    isClosed(): boolean;
    isHalfOpen(): boolean;
    getState(): CircuitBreakerState;
    getFailureCount(): number;
    reset(): void;
}
export {};
//# sourceMappingURL=CircuitBreaker.d.ts.map