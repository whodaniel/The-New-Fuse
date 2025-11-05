interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeout?: number;
}
export declare class CircuitBreakerService {
    private states;
    private readonly defaultOptions;
    execute<T>(key: string, operation: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T>;
    private getState;
    reset(key: string): void;
    resetAll(): void;
}
export {};
//# sourceMappingURL=circuitBreakerService.d.ts.map