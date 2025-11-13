/**
 * Performance Validation System
 */
import { Logger } from '../utils/Logger';
import { LoadTestScenario } from './LoadTestRunner';
/**
 * Performance target configuration
 */
export interface PerformanceTargets {
    /** Maximum average response time (ms) */
    maxAvgResponseTime: number;
    /** Maximum P95 response time (ms) */
    maxP95ResponseTime: number;
    /** Maximum P99 response time (ms) */
    maxP99ResponseTime: number;
    /** Minimum requests per second */
    minRPS: number;
    /** Minimum success rate */
    minSuccessRate: number;
    /** Maximum error rate */
    maxErrorRate: number;
    /** Maximum memory usage (bytes) */
    maxMemoryUsage: number;
    /** Maximum CPU usage (percentage) */
    maxCPUUsage: number;
    /** Minimum concurrent connections */
    minConcurrentConnections: number;
}
/**
 * Performance validation result
 */
export interface ValidationResult {
    /** Test passed */
    passed: boolean;
    /** Test score (0-100) */
    score: number;
    /** Target validations */
    validations: TargetValidation[];
    /** Performance metrics */
    metrics: PerformanceMetrics;
    /** Recommendations */
    recommendations: string[];
}
/**
 * Target validation result
 */
export interface TargetValidation {
    /** Target name */
    target: string;
    /** Expected value */
    expected: number;
    /** Actual value */
    actual: number;
    /** Validation passed */
    passed: boolean;
    /** Deviation percentage */
    deviation: number;
}
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    /** Response time metrics */
    responseTime: {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        min: number;
        max: number;
    };
    /** Throughput metrics */
    throughput: {
        rps: number;
        bytesPerSecond: number;
    };
    /** Error metrics */
    errors: {
        rate: number;
        count: number;
        types: Record<string, number>;
    };
    /** Resource metrics */
    resources: {
        memoryUsage: number;
        cpuUsage: number;
        connections: number;
    };
    /** Scalability metrics */
    scalability: {
        concurrentUsers: number;
        linearScaling: boolean;
        bottlenecks: string[];
    };
}
/**
 * Performance validator
 */
export declare class PerformanceValidator {
    private readonly logger;
    private readonly loadTestRunner;
    constructor(logger?: Logger);
    /**
     * Validate performance against targets
     */
    validatePerformance(scenario: LoadTestScenario, targets: PerformanceTargets): Promise<ValidationResult>;
    /**
     * Run scalability test
     */
    runScalabilityTest(baseScenario: LoadTestScenario): Promise<{
        results: ValidationResult[];
        scalabilityAnalysis: ScalabilityAnalysis;
    }>;
    /**
     * Run stress test
     */
    runStressTest(baseScenario: LoadTestScenario): Promise<{
        breakingPoint: number;
        degradationPoint: number;
        recoveryTime: number;
        stressMetrics: PerformanceMetrics[];
    }>;
    /**
     * Extract metrics from test result
     */
    private extractMetrics;
    /**
     * Validate metrics against targets
     */
    private validateTargets;
    /**
     * Create target validation
     */
    private createValidation;
    /**
     * Calculate overall score
     */
    private calculateScore;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Scale scenario for different user counts
     */
    private scaleScenario;
    /**
     * Analyze scalability from test results
     */
    private analyzeScalability;
    /**
     * Helper methods (simplified implementations)
     */
    private extractErrorTypes;
    private getCurrentCPUUsage;
    private getCurrentConnectionCount;
    private extractConcurrentUsers;
    private checkLinearScaling;
    private identifyBottlenecks;
    private checkLinearScalingFromData;
    private findOptimalUserCount;
    private identifyScalingBottlenecks;
    private calculateScalabilityScore;
}
/**
 * Scalability analysis result
 */
export interface ScalabilityAnalysis {
    /** Linear scaling achieved */
    linearScaling: boolean;
    /** Optimal user count */
    optimalUserCount: number;
    /** Scaling bottlenecks */
    bottlenecks: string[];
    /** Throughput data points */
    throughputData: Array<{
        users: number;
        rps: number;
        responseTime: number;
    }>;
    /** Overall scalability score */
    scalabilityScore: number;
}
//# sourceMappingURL=PerformanceValidator.d.ts.map