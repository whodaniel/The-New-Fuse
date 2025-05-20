interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenRequests: number;
}
export declare class CircuitBreaker {
    private config;
    private state;
    private failures;
    private lastFailureTime?;
    constructor(config: CircuitBreakerConfig);
    execute<T>(): Promise<void>;
}
export {};
