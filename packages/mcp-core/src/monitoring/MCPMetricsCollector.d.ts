/**
 * MCP-specific metrics collector
 * Extends the base metrics collector with MCP-specific functionality
 */
import { BaseMetricsCollector, BaseMetricsCollectorConfig, Logger } from '@tnf/core-monitoring';
import { PerformanceMetrics } from '../types/monitoring.js';
/**
 * MCP metrics collector implementation
 */
export declare class MCPMetricsCollector extends BaseMetricsCollector<PerformanceMetrics> {
    private readonly requestTimes;
    private requestCount;
    private successfulRequests;
    private failedRequests;
    private connectionCount;
    private activeConnections;
    private resourceAccessCount;
    private cacheHits;
    private cacheMisses;
    private toolExecutionCount;
    private toolSuccessCount;
    private startTime;
    constructor(config: BaseMetricsCollectorConfig, logger?: Logger);
    /**
     * Get current MCP metrics
     */
    getCurrentMetrics(): PerformanceMetrics;
    /**
     * Collect MCP-specific metrics
     */
    protected collectMetrics(): void;
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
    recordConnectionEvent(event: 'connect' | 'disconnect' | 'error'): void;
    /**
     * Record resource access
     */
    recordResourceAccess(uri: string, duration: number, cached: boolean): void;
    /**
     * Record tool execution
     */
    recordToolExecution(name: string, duration: number, success: boolean): void;
    /**
     * Calculate system health score
     */
    private calculateHealthScore;
    /**
     * Get resource count (placeholder - would be injected from resource manager)
     */
    private getResourceCount;
    /**
     * Get tool count (placeholder - would be injected from tool manager)
     */
    private getToolCount;
}
//# sourceMappingURL=MCPMetricsCollector.d.ts.map