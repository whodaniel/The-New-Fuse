/**
 * Build metrics collection and reporting system
 */
import { BaseMetricsCollector } from '@the-new-fuse/core-monitoring';
import { IBuildMetricsCollector } from '../interfaces/index.js';
import { BuildEventData, BuildMetrics, MemoryUsage } from '../types/index.js';
/**
 * Detailed build statistics
 */
export interface DetailedBuildMetrics extends BuildMetrics {
    /** Build start timestamp */
    startTime: number;
    /** Build end timestamp */
    endTime: number;
    /** Memory usage samples collected during build */
    memorySnapshots: MemoryUsage[];
    /** Build events timeline */
    events: BuildEventData[];
    /** Per-stage metrics */
    stageMetrics: StageMetrics[];
    /** Performance statistics */
    performanceStats: PerformanceStats;
}
/**
 * Per-stage build metrics
 */
export interface StageMetrics {
    /** Stage identifier */
    stageId: string;
    /** Stage start time */
    startTime: number;
    /** Stage end time */
    endTime: number;
    /** Stage duration in milliseconds */
    duration: number;
    /** Packages built in this stage */
    packages: string[];
    /** Peak memory usage during stage */
    peakMemoryUsage: number;
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
}
/**
 * Performance statistics
 */
export interface PerformanceStats {
    /** Average build time per package in milliseconds */
    avgBuildTimePerPackage: number;
    /** Memory efficiency score (0-100) */
    memoryEfficiencyScore: number;
    /** Concurrency utilization percentage */
    concurrencyUtilization: number;
    /** Time spent in memory cleanup */
    cleanupTime: number;
    /** Number of memory threshold violations */
    memoryViolations: number;
}
/**
 * Build metrics collector implementation
 */
export declare class BuildMetricsCollector extends BaseMetricsCollector<DetailedBuildMetrics> implements IBuildMetricsCollector {
    private isCollecting;
    private buildMetrics;
    private currentStage;
    private memoryMonitoringInterval;
    private readonly monitoringIntervalMs;
    constructor(monitoringInterval?: number);
    /**
     * Start collecting metrics (implements IMetricsCollector interface)
     */
    start(): Promise<void>;
    /**
     * Stop collecting metrics (implements IMetricsCollector interface)
     */
    stop(): Promise<void>;
    /**
     * Start collecting build metrics
     */
    startCollection(): void;
    /**
     * Stop collecting build metrics
     */
    stopCollection(): void;
    /**
     * Record a build event
     */
    recordEvent(event: BuildEventData): void;
    /**
     * Get collected metrics (implements base class abstract method)
     */
    getCurrentMetrics(): DetailedBuildMetrics;
    /**
     * Get collected metrics (legacy method for backward compatibility)
     */
    getMetrics(): DetailedBuildMetrics;
    /**
     * Collect metrics (implements base class abstract method)
     */
    protected collectMetrics(): void;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Record memory usage snapshot
     */
    recordMemorySnapshot(usage: MemoryUsage): void;
    /**
     * Record successful package build
     */
    recordSuccessfulBuild(packageName: string, duration: number): void;
    /**
     * Record failed package build
     */
    recordFailedBuild(packageName: string, error: string): void;
    /**
     * Generate build report
     */
    generateReport(): string;
    /**
     * Start monitoring memory usage
     */
    private startMemoryMonitoring;
    /**
     * Stop monitoring memory usage
     */
    private stopMemoryMonitoring;
    /**
     * Start a new build stage
     */
    private startStage;
    /**
     * Finish the current build stage
     */
    private finishCurrentStage;
    /**
     * Calculate performance statistics
     */
    private calculatePerformanceStats;
}
//# sourceMappingURL=BuildMetricsCollector.d.ts.map