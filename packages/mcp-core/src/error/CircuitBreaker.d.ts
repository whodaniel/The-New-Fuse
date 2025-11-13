/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
export declare enum CircuitState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open"
}
export interface CircuitBreakerConfig {
    /** Failure threshold to open circuit */
    failureThreshold: number;
    /** Success threshold to close circuit from half-open */
    successThreshold: number;
    /** Timeout before attempting to close circuit (ms) */
    timeout: number;
    /** Rolling window size for failure counting */
    rollingWindowSize: number;
    /** Rolling window time period (ms) */
    rollingWindowTime: number;
    /** Enable monitoring */
    enableMonitoring: boolean;
}
export interface CircuitBreakerStats {
    /** Current state */
    state: CircuitState;
    /** Total requests */
    totalRequests: number;
    /** Successful requests */
    successfulRequests: number;
    /** Failed requests */
    failedRequests: number;
    /** Rejected requests (circuit open) */
    rejectedRequests: number;
    /** Success rate percentage */
    successRate: number;
    /** Failure rate percentage */
    failureRate: number;
    /** Last state change timestamp */
    lastStateChange: Date;
    /** Time until next retry (for open state) */
    timeUntilRetry?: number;
}
export interface RequestResult<T> {
    /** Whether request was successful */
    success: boolean;
    /** Result data if successful */
    data?: T;
    /** Error if failed */
    error?: Error;
    /** Whether request was rejected by circuit breaker */
    rejected: boolean;
    /** Execution time in milliseconds */
    executionTime: number;
}
/**
 * Circuit Breaker implementation
 */
export declare class CircuitBreaker<T = any> extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly name;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private nextAttemptTime?;
    private readonly requestHistory;
    private totalRequests;
    private successfulRequests;
    private failedRequests;
    private rejectedRequests;
    private lastStateChange;
    constructor(name: string, config?: Partial<CircuitBreakerConfig>, logger?: Logger);
}
/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export declare class CircuitBreakerManager extends EventEmitter {
    private readonly circuitBreakers;
    private readonly logger;
    constructor(logger?: Logger);
    /**
     * Create or get a circuit breaker
     */
    getCircuitBreaker<T = any>(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker<T>;
    /**
     * Get all circuit breaker names
     */
    getNames(): string[];
    /**
     * Check overall system health
     */
    getSystemHealth(): {
        healthy: boolean;
        totalCircuits: number;
        healthyCircuits: number;
        openCircuits: number;
        halfOpenCircuits: number;
    };
}
//# sourceMappingURL=CircuitBreaker.d.ts.map