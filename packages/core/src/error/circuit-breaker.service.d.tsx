export declare class CircuitBreakerService {
    private readonly logger;
    private readonly circuits;
    private readonly config;
    executeWithCircuitBreaker<T>(): Promise<void>;
}
