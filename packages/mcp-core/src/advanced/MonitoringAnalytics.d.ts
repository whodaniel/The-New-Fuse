import { EventEmitter } from 'events';
export interface AgentMetrics {
    agentId: string;
    timestamp: number;
    performance: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        successRate: number;
        cpuUsage?: number;
        memoryUsage?: number;
    };
    tasks: {
        completed: number;
        failed: number;
        pending: number;
        averageExecutionTime: number;
    };
    communication: {
        messagesSent: number;
        messagesReceived: number;
        collaborations: number;
    };
    capabilities: {
        activeCapabilities: string[];
        utilizationRate: Record<string, number>;
    };
}
export interface SystemMetrics {
    timestamp: number;
    overall: {
        totalAgents: number;
        activeAgents: number;
        totalTasks: number;
        systemLoad: number;
        networkLatency: number;
    };
    performance: {
        averageResponseTime: number;
        totalThroughput: number;
        systemErrorRate: number;
        resourceUtilization: {
            cpu: number;
            memory: number;
            network: number;
        };
    };
    health: {
        status: 'healthy' | 'degraded' | 'critical';
        issues: string[];
        uptime: number;
    };
}
export interface Alert {
    id: string;
    type: 'performance' | 'error' | 'security' | 'resource' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    agentId?: string;
    title: string;
    description: string;
    timestamp: number;
    resolved: boolean;
    resolvedAt?: number;
    metadata: Record<string, any>;
}
export interface PerformanceThreshold {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
    duration?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface AnalyticsQuery {
    agentIds?: string[];
    timeRange: {
        start: number;
        end: number;
    };
    metrics: string[];
    aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
    groupBy?: 'agent' | 'time' | 'capability';
    interval?: number;
}
export interface AnalyticsResult {
    query: AnalyticsQuery;
    data: Array<{
        timestamp?: number;
        agentId?: string;
        capability?: string;
        values: Record<string, number>;
    }>;
    summary: {
        totalDataPoints: number;
        timeRange: {
            start: number;
            end: number;
        };
        aggregatedValues: Record<string, number>;
    };
}
export declare class MonitoringAnalyticsEngine extends EventEmitter {
    private agentMetrics;
    private systemMetrics;
    private alerts;
    private thresholds;
    private isMonitoring;
    private metricsInterval?;
    private alertCheckInterval?;
    private retentionPeriod;
    constructor();
    /**
     * Start monitoring
     */
    startMonitoring(intervalMs?: number): Promise<void>;
    /**
     * Stop monitoring
     */
    stopMonitoring(): Promise<void>;
    /**
     * Record agent metrics
     */
    recordAgentMetrics(metrics: AgentMetrics): Promise<void>;
    /**
     * Get agent metrics
     */
    getAgentMetrics(agentId: string, timeRange?: {
        start: number;
        end: number;
    }): AgentMetrics[];
    /**
     * Get system metrics
     */
    getSystemMetrics(timeRange?: {
        start: number;
        end: number;
    }): SystemMetrics[];
    /**
     * Execute analytics query
     */
    executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult>;
    /**
     * Create alert
     */
    createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<string>;
    /**
     * Resolve alert
     */
    resolveAlert(alertId: string, resolution?: string): Promise<void>;
    /**
     * Get active alerts
     */
    getActiveAlerts(severity?: Alert['severity']): Alert[];
    /**
     * Add performance threshold
     */
    addThreshold(threshold: PerformanceThreshold): void;
    /**
     * Remove performance threshold
     */
    removeThreshold(index: number): void;
    /**
     * Get performance insights
     */
    getPerformanceInsights(agentId?: string): Promise<{
        trends: Array<{
            metric: string;
            trend: 'improving' | 'degrading' | 'stable';
            change: number;
        }>;
        recommendations: string[];
        bottlenecks: Array<{
            area: string;
            severity: number;
            description: string;
        }>;
    }>;
    /**
     * Export metrics data
     */
    exportMetrics(format: 'json' | 'csv', timeRange?: {
        start: number;
        end: number;
    }): Promise<string>;
    /**
     * Collect system metrics
     */
    private collectSystemMetrics;
    /**
     * Check alerts against thresholds
     */
    private checkAlerts;
    /**
     * Check agent-specific thresholds
     */
    private checkAgentThresholds;
    /**
     * Setup default performance thresholds
     */
    private setupDefaultThresholds;
    /**
     * Helper methods for analytics
     */
    private groupByAgent;
    private groupByTime;
    private groupByCapability;
    private aggregateMetrics;
    private aggregateMetricValues;
    private extractMetricValue;
    private calculateSummaryValues;
    private evaluateThreshold;
    private evaluateCondition;
    private analyzeTrends;
    private generateRecommendations;
    private identifyBottlenecks;
    private convertToCSV;
    private getActiveAgentsCount;
    private getTotalTasksCount;
    private getSystemLoad;
    private getNetworkLatency;
    private calculateAverageResponseTime;
    private calculateTotalThroughput;
    private calculateSystemErrorRate;
    private getResourceUtilization;
    private determineSystemHealth;
    private getSystemIssues;
    private getSystemUptime;
    private generateAlertId;
}
export default MonitoringAnalyticsEngine;
//# sourceMappingURL=MonitoringAnalytics.d.ts.map