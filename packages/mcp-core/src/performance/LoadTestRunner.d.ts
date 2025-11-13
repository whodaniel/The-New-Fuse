/**
 * Advanced Load Testing System
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
/**
 * Load test scenario configuration
 */
export interface LoadTestScenario {
    /** Scenario name */
    name: string;
    /** Scenario description */
    description?: string;
    /** Test phases */
    phases: LoadTestPhase[];
    /** Global configuration */
    global?: {
        /** Base URL */
        baseUrl?: string;
        /** Default headers */
        headers?: Record<string, string>;
        /** Default timeout */
        timeout?: number;
    };
}
/**
 * Load test phase configuration
 */
export interface LoadTestPhase {
    /** Phase name */
    name: string;
    /** Phase duration (ms) */
    duration: number;
    /** Virtual users configuration */
    users: {
        /** Number of users to start with */
        start: number;
        /** Number of users to end with */
        end: number;
        /** Ramp-up strategy */
        rampUp: 'linear' | 'exponential' | 'step';
    };
    /** Requests per second limit */
    rpsLimit?: number;
    /** Test operations */
    operations: LoadTestOperation[];
}
/**
 * Load test operation
 */
export interface LoadTestOperation {
    /** Operation name */
    name: string;
    /** Operation weight (probability) */
    weight: number;
    /** Request configuration */
    request: {
        /** HTTP method */
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
        /** URL path */
        path: string;
        /** Request headers */
        headers?: Record<string, string>;
        /** Request body */
        body?: any;
        /** Query parameters */
        query?: Record<string, string>;
    };
    /** Validation rules */
    validation?: {
        /** Expected status codes */
        statusCodes?: number[];
        /** Response time threshold (ms) */
        maxResponseTime?: number;
        /** Response body validation */
        bodyValidation?: (body: any) => boolean;
    };
    /** Think time (ms) */
    thinkTime?: number;
}
/**
 * Load test result
 */
export interface LoadTestResult {
    /** Test scenario */
    scenario: LoadTestScenario;
    /** Test start time */
    startTime: Date;
    /** Test end time */
    endTime: Date;
    /** Total duration (ms) */
    duration: number;
    /** Phase results */
    phases: PhaseResult[];
    /** Overall statistics */
    overall: TestStatistics;
    /** Performance timeline */
    timeline: TimelinePoint[];
    /** Error summary */
    errors: ErrorSummary[];
}
/**
 * Phase result
 */
export interface PhaseResult {
    /** Phase name */
    name: string;
    /** Phase duration (ms) */
    duration: number;
    /** Phase statistics */
    statistics: TestStatistics;
    /** Operation results */
    operations: OperationResult[];
}
/**
 * Operation result
 */
export interface OperationResult {
    /** Operation name */
    name: string;
    /** Total executions */
    executions: number;
    /** Success count */
    successes: number;
    /** Failure count */
    failures: number;
    /** Success rate */
    successRate: number;
    /** Response time statistics */
    responseTime: {
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
}
/**
 * Test statistics
 */
export interface TestStatistics {
    /** Total requests */
    totalRequests: number;
    /** Successful requests */
    successfulRequests: number;
    /** Failed requests */
    failedRequests: number;
    /** Success rate */
    successRate: number;
    /** Requests per second */
    rps: number;
    /** Response time statistics */
    responseTime: {
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
    /** Throughput (bytes/sec) */
    throughput: number;
}
/**
 * Timeline point
 */
export interface TimelinePoint {
    /** Timestamp */
    timestamp: Date;
    /** Active users */
    activeUsers: number;
    /** Requests per second */
    rps: number;
    /** Average response time */
    avgResponseTime: number;
    /** Error rate */
    errorRate: number;
}
/**
 * Error summary
 */
export interface ErrorSummary {
    /** Error type */
    type: string;
    /** Error message */
    message: string;
    /** Occurrence count */
    count: number;
    /** First occurrence */
    firstOccurrence: Date;
    /** Last occurrence */
    lastOccurrence: Date;
}
/**
 * Advanced load test runner
 */
export declare class LoadTestRunner extends EventEmitter {
    private readonly logger;
    private running;
    private virtualUsers;
    private results;
    private timeline;
    private errors;
    constructor(logger?: Logger);
    /**
     * Run load test scenario
     */
    runScenario(scenario: LoadTestScenario): Promise<LoadTestResult>;
    /**
     * Stop running test
     */
    stop(): void;
    /**
     * Run a single phase
     */
    private runPhase;
    /**
     * Ramp up virtual users
     */
    private rampUpUsers;
    /**
     * Capture timeline point
     */
    private captureTimelinePoint;
    /**
     * Record error
     */
    private recordError;
    /**
     * Calculate overall statistics
     */
    private calculateOverallStatistics;
    /**
     * Calculate phase statistics
     */
    private calculatePhaseStatistics;
    /**
     * Calculate operation results
     */
    private calculateOperationResults;
    /**
     * Calculate percentile
     */
    private percentile;
    /**
     * Cleanup resources
     */
    private cleanup;
}
//# sourceMappingURL=LoadTestRunner.d.ts.map