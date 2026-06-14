/**
 * MCP-specific monitoring system implementation
 * Extends the base monitoring system with MCP-specific functionality
 */
import { BaseMonitoringConfig, Logger } from '@the-new-fuse/core-monitoring';
import { PerformanceMetrics } from '../types/monitoring.js';
/**
 * MCP monitoring configuration
 */
export interface MCPMonitoringConfig extends BaseMonitoringConfig {
    trackConnections?: boolean;
    trackResources?: boolean;
    trackTools?: boolean;
    trackRequests?: boolean;
}
declare const MCPMonitoringSystem_base: any;
/**
 * MCP monitoring system implementation
 */
export declare class MCPMonitoringSystem extends MCPMonitoringSystem_base<PerformanceMetrics, MCPMonitoringConfig> {
    constructor(logger?: Logger);
    /**
     * Create MCP-specific metrics collector
     */
    protected createMetricsCollector(): any;
    /**
     * Format MCP metrics for Prometheus export
     */
    protected formatPrometheusMetrics(metrics: PerformanceMetrics): string;
    /**
     * Get MCP-specific status information
     */
    getMCPStatus(): Promise<{
        connections: number;
        resources: number;
        tools: number;
        requests: number;
    }>;
    /**
     * Record MCP-specific events
     */
    recordConnectionEvent(event: 'connect' | 'disconnect' | 'error'): void;
    recordResourceAccess(uri: string, duration: number, cached: boolean): void;
    recordToolExecution(name: string, duration: number, success: boolean): void;
    recordRequestStart(requestId: string): void;
    recordRequestEnd(requestId: string, success: boolean): void;
}
export {};
//# sourceMappingURL=MCPMonitoringSystem.d.ts.map