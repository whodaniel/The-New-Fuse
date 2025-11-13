"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringAnalyticsEngine = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
class MonitoringAnalyticsEngine extends events_1.EventEmitter {
    agentMetrics = new Map();
    systemMetrics = [];
    alerts = new Map();
    thresholds = [];
    isMonitoring = false;
    metricsInterval;
    alertCheckInterval;
    retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    constructor() {
        super();
        this.setupDefaultThresholds();
    }
    /**
     * Start monitoring
     */
    async startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            throw new Error('Monitoring is already active');
        }
        this.isMonitoring = true;
        // Start metrics collection
        this.metricsInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, intervalMs);
        // Start alert checking
        this.alertCheckInterval = setInterval(() => {
            this.checkAlerts();
        }, intervalMs / 2);
        this.emit('monitoringStarted', { interval: intervalMs });
    }
    /**
     * Stop monitoring
     */
    async stopMonitoring() {
        if (!this.isMonitoring)
            return;
        this.isMonitoring = false;
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = undefined;
        }
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
            this.alertCheckInterval = undefined;
        }
        this.emit('monitoringStopped');
    }
    /**
     * Record agent metrics
     */
    async recordAgentMetrics(metrics) {
        const agentHistory = this.agentMetrics.get(metrics.agentId) || [];
        agentHistory.push(metrics);
        // Maintain retention period
        const cutoffTime = Date.now() - this.retentionPeriod;
        const filteredHistory = agentHistory.filter(m => m.timestamp > cutoffTime);
        this.agentMetrics.set(metrics.agentId, filteredHistory);
        this.emit('agentMetricsRecorded', metrics);
        // Check for threshold violations
        this.checkAgentThresholds(metrics);
    }
    /**
     * Get agent metrics
     */
    getAgentMetrics(agentId, timeRange) {
        const metrics = this.agentMetrics.get(agentId) || [];
        if (!timeRange)
            return metrics;
        return metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
    }
    /**
     * Get system metrics
     */
    getSystemMetrics(timeRange) {
        if (!timeRange)
            return this.systemMetrics;
        return this.systemMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
    }
    /**
     * Execute analytics query
     */
    async executeQuery(query) {
        const results = {
            query,
            data: [],
            summary: {
                totalDataPoints: 0,
                timeRange: query.timeRange,
                aggregatedValues: {}
            }
        };
        // Collect relevant metrics
        const relevantMetrics = [];
        if (query.agentIds) {
            for (const agentId of query.agentIds) {
                const agentMetrics = this.getAgentMetrics(agentId, query.timeRange);
                relevantMetrics.push(...agentMetrics);
            }
        }
        else {
            // Get all agent metrics
            for (const agentMetrics of this.agentMetrics.values()) {
                const filteredMetrics = agentMetrics.filter(m => m.timestamp >= query.timeRange.start && m.timestamp <= query.timeRange.end);
                relevantMetrics.push(...filteredMetrics);
            }
        }
        // Process metrics based on query
        if (query.groupBy === 'agent') {
            results.data = this.groupByAgent(relevantMetrics, query);
        }
        else if (query.groupBy === 'time') {
            results.data = this.groupByTime(relevantMetrics, query);
        }
        else if (query.groupBy === 'capability') {
            results.data = this.groupByCapability(relevantMetrics, query);
        }
        else {
            results.data = this.aggregateMetrics(relevantMetrics, query);
        }
        // Calculate summary
        results.summary.totalDataPoints = relevantMetrics.length;
        results.summary.aggregatedValues = this.calculateSummaryValues(results.data, query);
        return results;
    }
    /**
     * Create alert
     */
    async createAlert(alert) {
        const alertId = this.generateAlertId();
        const fullAlert = {
            ...alert,
            id: alertId,
            timestamp: Date.now(),
            resolved: false
        };
        this.alerts.set(alertId, fullAlert);
        this.emit('alertCreated', fullAlert);
        return alertId;
    }
    /**
     * Resolve alert
     */
    async resolveAlert(alertId, resolution) {
        const alert = this.alerts.get(alertId);
        if (!alert || alert.resolved)
            return;
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        if (resolution) {
            alert.metadata.resolution = resolution;
        }
        this.emit('alertResolved', alert);
    }
    /**
     * Get active alerts
     */
    getActiveAlerts(severity) {
        const alerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
        if (severity) {
            return alerts.filter(a => a.severity === severity);
        }
        return alerts;
    }
    /**
     * Add performance threshold
     */
    addThreshold(threshold) {
        this.thresholds.push(threshold);
        this.emit('thresholdAdded', threshold);
    }
    /**
     * Remove performance threshold
     */
    removeThreshold(index) {
        if (index >= 0 && index < this.thresholds.length) {
            const removed = this.thresholds.splice(index, 1)[0];
            this.emit('thresholdRemoved', removed);
        }
    }
    /**
     * Get performance insights
     */
    async getPerformanceInsights(agentId) {
        const insights = {
            trends: [],
            recommendations: [],
            bottlenecks: []
        };
        // Analyze trends
        const metricsToAnalyze = agentId ?
            this.getAgentMetrics(agentId) :
            Array.from(this.agentMetrics.values()).flat();
        if (metricsToAnalyze.length > 1) {
            insights.trends = this.analyzeTrends(metricsToAnalyze);
            insights.recommendations = this.generateRecommendations(metricsToAnalyze);
            insights.bottlenecks = this.identifyBottlenecks(metricsToAnalyze);
        }
        return insights;
    }
    /**
     * Export metrics data
     */
    async exportMetrics(format, timeRange) {
        const allMetrics = Array.from(this.agentMetrics.values()).flat();
        const filteredMetrics = timeRange ?
            allMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
            allMetrics;
        if (format === 'json') {
            return JSON.stringify({
                exportTimestamp: Date.now(),
                timeRange,
                agentMetrics: filteredMetrics,
                systemMetrics: timeRange ?
                    this.systemMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end) :
                    this.systemMetrics
            }, null, 2);
        }
        else {
            return this.convertToCSV(filteredMetrics);
        }
    }
    /**
     * Collect system metrics
     */
    async collectSystemMetrics() {
        const systemMetrics = {
            timestamp: Date.now(),
            overall: {
                totalAgents: this.agentMetrics.size,
                activeAgents: this.getActiveAgentsCount(),
                totalTasks: this.getTotalTasksCount(),
                systemLoad: await this.getSystemLoad(),
                networkLatency: await this.getNetworkLatency()
            },
            performance: {
                averageResponseTime: this.calculateAverageResponseTime(),
                totalThroughput: this.calculateTotalThroughput(),
                systemErrorRate: this.calculateSystemErrorRate(),
                resourceUtilization: await this.getResourceUtilization()
            },
            health: {
                status: this.determineSystemHealth(),
                issues: this.getSystemIssues(),
                uptime: this.getSystemUptime()
            }
        };
        this.systemMetrics.push(systemMetrics);
        // Maintain retention period
        const cutoffTime = Date.now() - this.retentionPeriod;
        this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);
        this.emit('systemMetricsCollected', systemMetrics);
    }
    /**
     * Check alerts against thresholds
     */
    checkAlerts() {
        for (const threshold of this.thresholds) {
            this.evaluateThreshold(threshold);
        }
    }
    /**
     * Check agent-specific thresholds
     */
    checkAgentThresholds(metrics) {
        for (const threshold of this.thresholds) {
            const value = this.extractMetricValue(metrics, threshold.metric);
            if (value !== undefined && this.evaluateCondition(value, threshold)) {
                this.createAlert({
                    type: 'performance',
                    severity: threshold.severity,
                    agentId: metrics.agentId,
                    title: `Threshold Violation: ${threshold.metric}`,
                    description: `Agent ${metrics.agentId} ${threshold.metric} is ${value}, which violates threshold ${threshold.operator} ${threshold.value}`,
                    metadata: { threshold, value, metric: threshold.metric }
                });
            }
        }
    }
    /**
     * Setup default performance thresholds
     */
    setupDefaultThresholds() {
        this.thresholds = [
            { metric: 'performance.responseTime', operator: '>', value: 5000, severity: 'high' },
            { metric: 'performance.errorRate', operator: '>', value: 0.1, severity: 'medium' },
            { metric: 'performance.successRate', operator: '<', value: 0.9, severity: 'high' },
            { metric: 'performance.cpuUsage', operator: '>', value: 80, severity: 'medium' },
            { metric: 'performance.memoryUsage', operator: '>', value: 85, severity: 'high' }
        ];
    }
    /**
     * Helper methods for analytics
     */
    groupByAgent(metrics, query) {
        const grouped = new Map();
        for (const metric of metrics) {
            const existing = grouped.get(metric.agentId) || [];
            existing.push(metric);
            grouped.set(metric.agentId, existing);
        }
        return Array.from(grouped.entries()).map(([agentId, agentMetrics]) => ({
            agentId,
            values: this.aggregateMetricValues(agentMetrics, query)
        }));
    }
    groupByTime(metrics, query) {
        const interval = query.interval || 3600000; // 1 hour default
        const grouped = new Map();
        for (const metric of metrics) {
            const timeSlot = Math.floor(metric.timestamp / interval) * interval;
            const existing = grouped.get(timeSlot) || [];
            existing.push(metric);
            grouped.set(timeSlot, existing);
        }
        return Array.from(grouped.entries()).map(([timestamp, timeMetrics]) => ({
            timestamp,
            values: this.aggregateMetricValues(timeMetrics, query)
        }));
    }
    groupByCapability(metrics, query) {
        const grouped = new Map();
        for (const metric of metrics) {
            for (const capability of metric.capabilities.activeCapabilities) {
                const existing = grouped.get(capability) || [];
                existing.push(metric);
                grouped.set(capability, existing);
            }
        }
        return Array.from(grouped.entries()).map(([capability, capabilityMetrics]) => ({
            capability,
            values: this.aggregateMetricValues(capabilityMetrics, query)
        }));
    }
    aggregateMetrics(metrics, query) {
        return [{
                values: this.aggregateMetricValues(metrics, query)
            }];
    }
    aggregateMetricValues(metrics, query) {
        const values = {};
        for (const metricName of query.metrics) {
            const metricValues = metrics
                .map(m => this.extractMetricValue(m, metricName))
                .filter(v => v !== undefined);
            if (metricValues.length > 0) {
                switch (query.aggregation) {
                    case 'sum':
                        values[metricName] = metricValues.reduce((a, b) => a + b, 0);
                        break;
                    case 'min':
                        values[metricName] = Math.min(...metricValues);
                        break;
                    case 'max':
                        values[metricName] = Math.max(...metricValues);
                        break;
                    case 'count':
                        values[metricName] = metricValues.length;
                        break;
                    case 'avg':
                    default:
                        values[metricName] = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;
                        break;
                }
            }
        }
        return values;
    }
    extractMetricValue(metrics, path) {
        const parts = path.split('.');
        let current = metrics;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return typeof current === 'number' ? current : undefined;
    }
    calculateSummaryValues(data, query) {
        const summary = {};
        for (const metricName of query.metrics) {
            const values = data
                .map(d => d.values[metricName])
                .filter(v => v !== undefined);
            if (values.length > 0) {
                summary[`${metricName}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
                summary[`${metricName}_min`] = Math.min(...values);
                summary[`${metricName}_max`] = Math.max(...values);
                summary[`${metricName}_sum`] = values.reduce((a, b) => a + b, 0);
            }
        }
        return summary;
    }
    evaluateThreshold(threshold) {
        // Implementation would check current metrics against threshold
        // This is a simplified version
    }
    evaluateCondition(value, threshold) {
        switch (threshold.operator) {
            case '>': return value > threshold.value;
            case '<': return value < threshold.value;
            case '>=': return value >= threshold.value;
            case '<=': return value <= threshold.value;
            case '==': return value === threshold.value;
            case '!=': return value !== threshold.value;
            default: return false;
        }
    }
    analyzeTrends(metrics) {
        // Simplified trend analysis
        return [
            { metric: 'responseTime', trend: 'stable', change: 0 },
            { metric: 'errorRate', trend: 'improving', change: -0.02 }
        ];
    }
    generateRecommendations(metrics) {
        return [
            'Consider optimizing response time for better performance',
            'Monitor memory usage trends to prevent resource exhaustion'
        ];
    }
    identifyBottlenecks(metrics) {
        return [
            { area: 'Network', severity: 3, description: 'High network latency detected' },
            { area: 'CPU', severity: 2, description: 'CPU usage spikes during peak hours' }
        ];
    }
    convertToCSV(metrics) {
        const headers = ['timestamp', 'agentId', 'responseTime', 'throughput', 'errorRate', 'successRate'];
        const rows = metrics.map(m => [
            m.timestamp,
            m.agentId,
            m.performance.responseTime,
            m.performance.throughput,
            m.performance.errorRate,
            m.performance.successRate
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    // System metrics helper methods
    getActiveAgentsCount() { return 0; }
    getTotalTasksCount() { return 0; }
    async getSystemLoad() { return 0.5; }
    async getNetworkLatency() { return 50; }
    calculateAverageResponseTime() { return 1000; }
    calculateTotalThroughput() { return 100; }
    calculateSystemErrorRate() { return 0.01; }
    async getResourceUtilization() {
        return { cpu: 50, memory: 60, network: 30 };
    }
    determineSystemHealth() { return 'healthy'; }
    getSystemIssues() { return []; }
    getSystemUptime() { return Date.now(); }
    generateAlertId() {
        return `alert_${Date.now()}_${(0, crypto_1.createHash)('md5').update(Math.random().toString()).digest('hex').substring(0, 8)}`;
    }
}
exports.MonitoringAnalyticsEngine = MonitoringAnalyticsEngine;
exports.default = MonitoringAnalyticsEngine;
//# sourceMappingURL=MonitoringAnalytics.js.map