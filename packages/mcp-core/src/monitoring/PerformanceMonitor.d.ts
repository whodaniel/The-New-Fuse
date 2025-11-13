/**
 * Performance Monitoring System
 */
import { EventEmitter } from 'events';
import { IPerformanceMonitor, PerformanceReport } from '../interfaces/IMonitoring';
import { PerformanceMetrics } from '../types/monitoring';
import { Logger } from '../utils/Logger';
export interface PerformanceMonitorConfig {
    /** Metrics collection interval (ms) */
    metricsInterval: number;
    /** Metrics retention period (ms) */
    retentionPeriod: number;
}
/**
 * Performance monitor implementation
 */
export declare class PerformanceMonitor extends EventEmitter implements IPerformanceMonitor {
    private readonly config;
    private readonly logger;
    private running;
    private monitoringTimer?;
    private startTime;
    private readonly requestTrackers;
    private readonly resourceAccessTrackers;
    private readonly toolExecutionTrackers;
    private readonly metricsHistory;
    private totalRequests;
    private successfulRequests;
    private failedRequests;
    private totalConnections;
    private activeConnections;
    private failedConnections;
    private resourceAccessCount;
    private cacheHits;
    private cacheMisses;
    private toolExecutionCount;
    private toolSuccessCount;
    private readonly responseTimes;
    private readonly connectionTimes;
    private readonly resourceReadTimes;
    private readonly toolExecutionTimes;
    constructor(config: PerformanceMonitorConfig, logger?: Logger);
    /**
     * Start monitoring
     */
    start(): Promise<void>;
    /**
     * Stop monitoring
     */
    stop(): Promise<void>;
    /**
     * Record request start
     */
    recordRequestStart(requestId: string): void;
    /**
     * Record request end
     */
    recordRequestEnd(requestId: string, success: boolean): void;
    /**
     * Record connection event
     */
    recordConnection(event: 'connect' | 'disconnect' | 'error'): void;
    /**
     * Record resource access
     */
    recordResourceAccess(uri: string, duration: number, cached: boolean): void;
    /**
     * Record tool execution
     */
    recordToolExecution(name: string, duration: number, success: boolean): void;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): PerformanceMetrics;
    /**
     * Get performance history
     */
    getPerformanceHistory(hours: number): PerformanceMetrics[];
    /**
     * Generate performance report
     */
    generateReport(timeWindow: number): Promise<PerformanceReport>;
    /**
     * Collect metrics and store in history
     */
    private collectMetrics;
    /**
     * Check for performance alerts
     */
    private checkPerformanceAlerts;
    /**
     * Analyze performance trends
     */
    private analyzeTrends;
    /**
     * Identify performance issues
     */
    private identifyIssues;
    /**
     * Generate performance recommendations
     */
    private generateRecommendations;
    /**
     * Calculate average of array
     */
    private calculateAverage;
    /**
     * Calculate percentile
     */
    private calculatePercentile;
    /**
     * Limit array size
     */
    private limitArraySize;
    /**
     * Get trend direction
     */
    private getTrend;
    /**
     * Calculate health score
     */
    private calculateHealthScore;
    /**
     * Get resource count (placeholder)
     */
    private getResourceCount;
    /**
     * Get tool count (placeholder)
     */
    private getToolCount;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map