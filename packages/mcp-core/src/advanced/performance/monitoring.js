"use strict";
/**
 * Advanced Performance Monitoring System
 * Provides real-time performance tracking, alerting, and analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ALERT_RULES = exports.PerformanceMonitoringSystem = void 0;
exports.createPerformanceMonitor = createPerformanceMonitor;
exports.recordResponseTime = recordResponseTime;
exports.recordError = recordError;
exports.recordThroughput = recordThroughput;
exports.recordResourceUsage = recordResourceUsage;
const events_1 = require("events");
// Performance Monitoring System
class PerformanceMonitoringSystem extends events_1.EventEmitter {
    metrics = new Map();
    alerts = new Map();
    alertRules = new Map();
    alertTimers = new Map();
    config;
    cleanupInterval;
    alertCheckInterval;
    constructor(config = {}) {
        super();
        this.config = {
            metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
            alertCheckInterval: 5000, // 5 seconds
            maxMetricsInMemory: 10000,
            enableRealTimeUpdates: true,
            exportInterval: 60000, // 1 minute
            ...config
        };
        this.startCleanupProcess();
        this.startAlertChecking();
    }
    // Metric Recording
    recordMetric(metric) {
        const key = this.getMetricKey(metric);
        const metrics = this.metrics.get(key) || [];
        metrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Limit metrics in memory
        if (metrics.length > this.config.maxMetricsInMemory) {
            metrics.splice(0, metrics.length - this.config.maxMetricsInMemory);
        }
        this.metrics.set(key, metrics);
        if (this.config.enableRealTimeUpdates) {
            this.emit('metric', metric);
        }
        // Check alerts for this metric
        this.checkAlertsForMetric(metric);
    }
    // Batch metric recording
    recordMetrics(metrics) {
        metrics.forEach(metric => this.recordMetric(metric));
    }
    // Get metrics by name and time range
    getMetrics(name, startTime, endTime, labels) {
        const key = this.getMetricKey({ name, labels });
        const metrics = this.metrics.get(key) || [];
        return metrics.filter(metric => {
            if (startTime && metric.timestamp < startTime)
                return false;
            if (endTime && metric.timestamp > endTime)
                return false;
            return true;
        });
    }
    // Get aggregated metrics
    getAggregatedMetrics(name, aggregation, startTime, endTime, labels) {
        const metrics = this.getMetrics(name, startTime, endTime, labels);
        const values = metrics.map(m => m.value);
        switch (aggregation) {
            case 'avg':
                return values.reduce((a, b) => a + b, 0) / values.length || 0;
            case 'sum':
                return values.reduce((a, b) => a + b, 0);
            case 'min':
                return Math.min(...values) || 0;
            case 'max':
                return Math.max(...values) || 0;
            case 'count':
                return values.length;
            case 'p50':
                return this.percentile(values, 0.5);
            case 'p95':
                return this.percentile(values, 0.95);
            case 'p99':
                return this.percentile(values, 0.99);
            default:
                return 0;
        }
    }
    // Alert Management
    addAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
        this.emit('alertRuleAdded', rule);
    }
    removeAlertRule(ruleId) {
        this.alertRules.delete(ruleId);
        this.clearAlertTimer(ruleId);
        this.emit('alertRuleRemoved', ruleId);
    }
    updateAlertRule(ruleId, updates) {
        const rule = this.alertRules.get(ruleId);
        if (rule) {
            const updatedRule = { ...rule, ...updates };
            this.alertRules.set(ruleId, updatedRule);
            this.emit('alertRuleUpdated', updatedRule);
        }
    }
    getAlertRules() {
        return Array.from(this.alertRules.values());
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            this.emit('alertResolved', alert);
        }
    }
    // Dashboard Data
    getDashboard() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        // Get recent metrics
        const recentMetrics = [];
        for (const metrics of this.metrics.values()) {
            recentMetrics.push(...metrics.filter(m => m.timestamp > oneHourAgo));
        }
        // Calculate summary statistics
        const responseTimeMetrics = recentMetrics.filter(m => m.name === 'response_time');
        const errorMetrics = recentMetrics.filter(m => m.name === 'error_count');
        const requestMetrics = recentMetrics.filter(m => m.name === 'request_count');
        const avgResponseTime = responseTimeMetrics.length > 0
            ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
            : 0;
        const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
        const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        const throughput = requestMetrics.length > 0
            ? requestMetrics.reduce((sum, m) => sum + m.value, 0) / (60 * 60) // per second
            : 0;
        return {
            metrics: recentMetrics.slice(-100), // Last 100 metrics
            alerts: this.getActiveAlerts(),
            summary: {
                totalMetrics: recentMetrics.length,
                activeAlerts: this.getActiveAlerts().length,
                avgResponseTime,
                errorRate,
                throughput
            }
        };
    }
    // Health Check
    getHealthStatus() {
        const checks = [];
        let overallStatus = 'healthy';
        // Check active alerts
        const activeAlerts = this.getActiveAlerts();
        const criticalAlerts = activeAlerts.filter(a => a.rule.severity === 'critical');
        const highAlerts = activeAlerts.filter(a => a.rule.severity === 'high');
        if (criticalAlerts.length > 0) {
            overallStatus = 'critical';
            checks.push({
                name: 'Critical Alerts',
                status: 'fail',
                message: `${criticalAlerts.length} critical alerts active`
            });
        }
        else {
            checks.push({
                name: 'Critical Alerts',
                status: 'pass',
                message: 'No critical alerts'
            });
        }
        if (highAlerts.length > 0 && overallStatus === 'healthy') {
            overallStatus = 'warning';
            checks.push({
                name: 'High Priority Alerts',
                status: 'fail',
                message: `${highAlerts.length} high priority alerts active`
            });
        }
        else {
            checks.push({
                name: 'High Priority Alerts',
                status: 'pass',
                message: 'No high priority alerts'
            });
        }
        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
        if (memoryUsageMB > 500) {
            if (overallStatus === 'healthy')
                overallStatus = 'warning';
            checks.push({
                name: 'Memory Usage',
                status: 'fail',
                message: `High memory usage: ${memoryUsageMB.toFixed(2)}MB`
            });
        }
        else {
            checks.push({
                name: 'Memory Usage',
                status: 'pass',
                message: `Memory usage: ${memoryUsageMB.toFixed(2)}MB`
            });
        }
        return { status: overallStatus, checks };
    }
    // Export metrics (for external systems)
    exportMetrics(format = 'json') {
        if (format === 'prometheus') {
            return this.exportPrometheusFormat();
        }
        const allMetrics = [];
        for (const metrics of this.metrics.values()) {
            allMetrics.push(...metrics);
        }
        return JSON.stringify({
            timestamp: Date.now(),
            metrics: allMetrics,
            alerts: Array.from(this.alerts.values())
        }, null, 2);
    }
    // Cleanup and shutdown
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
        }
        for (const timer of this.alertTimers.values()) {
            clearTimeout(timer);
        }
        this.removeAllListeners();
    }
    // Private methods
    getMetricKey(metric) {
        const labels = metric.labels ? JSON.stringify(metric.labels) : '';
        return `${metric.name}:${labels}`;
    }
    percentile(values, p) {
        if (values.length === 0)
            return 0;
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[Math.max(0, index)];
    }
    checkAlertsForMetric(metric) {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled || rule.metric !== metric.name)
                continue;
            const shouldAlert = this.evaluateAlertCondition(rule, metric.value);
            if (shouldAlert) {
                this.triggerAlert(rule, metric.value);
            }
            else {
                this.clearAlertTimer(rule.id);
            }
        }
    }
    evaluateAlertCondition(rule, value) {
        switch (rule.condition) {
            case 'gt': return value > rule.threshold;
            case 'gte': return value >= rule.threshold;
            case 'lt': return value < rule.threshold;
            case 'lte': return value <= rule.threshold;
            case 'eq': return value === rule.threshold;
            default: return false;
        }
    }
    triggerAlert(rule, value) {
        // Check if alert is already active
        const existingAlert = Array.from(this.alerts.values())
            .find(a => a.rule.id === rule.id && !a.resolved);
        if (existingAlert)
            return;
        // Set timer for alert duration
        if (!this.alertTimers.has(rule.id)) {
            const timer = setTimeout(() => {
                const alert = {
                    id: `${rule.id}-${Date.now()}`,
                    rule,
                    value,
                    timestamp: Date.now()
                };
                this.alerts.set(alert.id, alert);
                this.emit('alert', alert);
                this.alertTimers.delete(rule.id);
            }, rule.duration);
            this.alertTimers.set(rule.id, timer);
        }
    }
    clearAlertTimer(ruleId) {
        const timer = this.alertTimers.get(ruleId);
        if (timer) {
            clearTimeout(timer);
            this.alertTimers.delete(ruleId);
        }
    }
    startCleanupProcess() {
        this.cleanupInterval = setInterval(() => {
            const cutoff = Date.now() - this.config.metricsRetentionPeriod;
            for (const [key, metrics] of this.metrics.entries()) {
                const filtered = metrics.filter(m => m.timestamp > cutoff);
                if (filtered.length === 0) {
                    this.metrics.delete(key);
                }
                else {
                    this.metrics.set(key, filtered);
                }
            }
            // Clean up resolved alerts older than 24 hours
            const alertCutoff = Date.now() - 24 * 60 * 60 * 1000;
            for (const [id, alert] of this.alerts.entries()) {
                if (alert.resolved && alert.resolvedAt && alert.resolvedAt < alertCutoff) {
                    this.alerts.delete(id);
                }
            }
        }, 60000); // Run every minute
    }
    startAlertChecking() {
        this.alertCheckInterval = setInterval(() => {
            // This could be used for more complex alert checking logic
            // For now, alerts are checked when metrics are recorded
        }, this.config.alertCheckInterval);
    }
    exportPrometheusFormat() {
        const lines = [];
        for (const [key, metrics] of this.metrics.entries()) {
            const latestMetric = metrics[metrics.length - 1];
            if (!latestMetric)
                continue;
            const metricName = latestMetric.name.replace(/[^a-zA-Z0-9_]/g, '_');
            const labels = latestMetric.labels
                ? Object.entries(latestMetric.labels)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(',')
                : '';
            const labelStr = labels ? `{${labels}}` : '';
            lines.push(`${metricName}${labelStr} ${latestMetric.value} ${latestMetric.timestamp}`);
        }
        return lines.join('\n');
    }
}
exports.PerformanceMonitoringSystem = PerformanceMonitoringSystem;
// Predefined Alert Rules
exports.DEFAULT_ALERT_RULES = [
    {
        id: 'high_response_time',
        name: 'High Response Time',
        metric: 'response_time',
        condition: 'gt',
        threshold: 2000, // 2 seconds
        duration: 30000, // 30 seconds
        severity: 'high',
        enabled: true
    },
    {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5, // 5%
        duration: 60000, // 1 minute
        severity: 'critical',
        enabled: true
    },
    {
        id: 'low_throughput',
        name: 'Low Throughput',
        metric: 'throughput',
        condition: 'lt',
        threshold: 10, // 10 requests/second
        duration: 120000, // 2 minutes
        severity: 'medium',
        enabled: true
    },
    {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        metric: 'memory_usage',
        condition: 'gt',
        threshold: 80, // 80%
        duration: 300000, // 5 minutes
        severity: 'high',
        enabled: true
    },
    {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        metric: 'cpu_usage',
        condition: 'gt',
        threshold: 80, // 80%
        duration: 300000, // 5 minutes
        severity: 'high',
        enabled: true
    }
];
// Monitoring Helper Functions
function createPerformanceMonitor(config) {
    const monitor = new PerformanceMonitoringSystem(config);
    // Add default alert rules
    exports.DEFAULT_ALERT_RULES.forEach(rule => monitor.addAlertRule(rule));
    return monitor;
}
function recordResponseTime(monitor, duration, endpoint) {
    monitor.recordMetric({
        name: 'response_time',
        value: duration,
        timestamp: Date.now(),
        labels: endpoint ? { endpoint } : undefined,
        unit: 'ms'
    });
}
function recordError(monitor, error, component) {
    monitor.recordMetric({
        name: 'error_count',
        value: 1,
        timestamp: Date.now(),
        labels: {
            error_type: error.name,
            component: component || 'unknown'
        }
    });
}
function recordThroughput(monitor, count, operation) {
    monitor.recordMetric({
        name: 'throughput',
        value: count,
        timestamp: Date.now(),
        labels: operation ? { operation } : undefined,
        unit: 'ops/sec'
    });
}
function recordResourceUsage(monitor) {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    monitor.recordMetrics([
        {
            name: 'memory_usage',
            value: (usage.heapUsed / usage.heapTotal) * 100,
            timestamp: Date.now(),
            unit: 'percent'
        },
        {
            name: 'memory_heap_used',
            value: usage.heapUsed,
            timestamp: Date.now(),
            unit: 'bytes'
        },
        {
            name: 'memory_heap_total',
            value: usage.heapTotal,
            timestamp: Date.now(),
            unit: 'bytes'
        },
        {
            name: 'cpu_user_time',
            value: cpuUsage.user,
            timestamp: Date.now(),
            unit: 'microseconds'
        },
        {
            name: 'cpu_system_time',
            value: cpuUsage.system,
            timestamp: Date.now(),
            unit: 'microseconds'
        }
    ]);
}
//# sourceMappingURL=monitoring.js.map