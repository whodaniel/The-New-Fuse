/**
 * MCP-specific monitoring system implementation
 * Extends the base monitoring system with MCP-specific functionality
 */
import { BaseMonitoringSystem, Logger } from '@tnf/core-monitoring';
import { MCPMetricsCollector } from './MCPMetricsCollector.js';
/**
 * MCP monitoring system implementation
 */
export class MCPMonitoringSystem extends BaseMonitoringSystem {
    constructor(logger) {
        super(logger || new Logger('MCPMonitoringSystem'));
    }
    /**
     * Create MCP-specific metrics collector
     */
    createMetricsCollector() {
        if (!this.config) {
            throw new Error('Configuration not set');
        }
        return new MCPMetricsCollector({
            interval: this.config.metricsInterval,
            retentionPeriod: this.config.retentionPeriod,
            storage: this.config.storage || { type: 'memory' }
        }, this.logger);
    }
    /**
     * Format MCP metrics for Prometheus export
     */
    formatPrometheusMetrics(metrics) {
        const lines = [];
        // Helper function to add metric
        const addMetric = (name, value, labels) => {
            const labelStr = labels ?
                `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
            lines.push(`mcp_${name}${labelStr} ${value}`);
        };
        // Request metrics
        addMetric('requests_total', metrics.requests.total);
        addMetric('requests_successful', metrics.requests.successful);
        addMetric('requests_failed', metrics.requests.failed);
        addMetric('requests_per_second', metrics.requests.rps);
        addMetric('response_time_avg_ms', metrics.requests.avgResponseTime);
        addMetric('response_time_p95_ms', metrics.requests.p95ResponseTime);
        addMetric('response_time_p99_ms', metrics.requests.p99ResponseTime);
        // Connection metrics
        addMetric('connections_active', metrics.connections.active);
        addMetric('connections_total', metrics.connections.total);
        addMetric('connections_failed', metrics.connections.failed);
        addMetric('connection_time_avg_ms', metrics.connections.avgConnectionTime);
        // Resource metrics
        addMetric('resources_total', metrics.resources.total);
        addMetric('resource_access_count', metrics.resources.accessCount);
        addMetric('resource_cache_hit_rate', metrics.resources.cacheHitRate);
        addMetric('resource_read_time_avg_ms', metrics.resources.avgReadTime);
        // Tool metrics
        addMetric('tools_total', metrics.tools.total);
        addMetric('tool_execution_count', metrics.tools.executionCount);
        addMetric('tool_execution_time_avg_ms', metrics.tools.avgExecutionTime);
        addMetric('tool_success_rate', metrics.tools.successRate);
        // System metrics
        addMetric('memory_usage_bytes', metrics.system.memoryUsage);
        addMetric('cpu_usage_percent', metrics.system.cpuUsage);
        addMetric('uptime_ms', metrics.system.uptime);
        addMetric('health_score', metrics.system.healthScore);
        return lines.join('\n');
    }
    /**
     * Get MCP-specific status information
     */
    async getMCPStatus() {
        const metrics = this.getMetricsCollector().getCurrentMetrics();
        return {
            connections: metrics.connections.active,
            resources: metrics.resources.total,
            tools: metrics.tools.total,
            requests: metrics.requests.total
        };
    }
    /**
     * Record MCP-specific events
     */
    recordConnectionEvent(event) {
        const collector = this.getMetricsCollector();
        collector.recordConnectionEvent(event);
    }
    recordResourceAccess(uri, duration, cached) {
        const collector = this.getMetricsCollector();
        collector.recordResourceAccess(uri, duration, cached);
    }
    recordToolExecution(name, duration, success) {
        const collector = this.getMetricsCollector();
        collector.recordToolExecution(name, duration, success);
    }
    recordRequestStart(requestId) {
        const collector = this.getMetricsCollector();
        collector.recordRequestStart(requestId);
    }
    recordRequestEnd(requestId, success) {
        const collector = this.getMetricsCollector();
        collector.recordRequestEnd(requestId, success);
    }
}
//# sourceMappingURL=MCPMonitoringSystem.js.map