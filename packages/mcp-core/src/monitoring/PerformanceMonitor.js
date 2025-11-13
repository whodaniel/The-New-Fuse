/**
 * Performance Monitoring System
 */
import { EventEmitter } from 'events';
import { AlertSeverity } from '../types/monitoring';
import { Logger } from '../utils/Logger';
/**
 * Performance monitor implementation
 */
export class PerformanceMonitor extends EventEmitter {
    config;
    logger;
    running = false;
    monitoringTimer;
    startTime = Date.now();
    // Tracking data
    requestTrackers = new Map();
    resourceAccessTrackers = new Map();
    toolExecutionTrackers = new Map();
    metricsHistory = [];
    // Counters
    totalRequests = 0;
    successfulRequests = 0;
    failedRequests = 0;
    totalConnections = 0;
    activeConnections = 0;
    failedConnections = 0;
    resourceAccessCount = 0;
    cacheHits = 0;
    cacheMisses = 0;
    toolExecutionCount = 0;
    toolSuccessCount = 0;
    // Performance data
    responseTimes = [];
    connectionTimes = [];
    resourceReadTimes = [];
    toolExecutionTimes = [];
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger('PerformanceMonitor');
    }
    /**
     * Start monitoring
     */
    async start() {
        if (this.running) {
            this.logger.warn('Performance monitor is already running');
            return;
        }
        this.logger.info('Starting performance monitor', {
            metricsInterval: this.config.metricsInterval,
            retentionPeriod: this.config.retentionPeriod
        });
        this.running = true;
        this.startTime = Date.now();
        // Start monitoring timer
        this.monitoringTimer = setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsInterval);
        // Initial metrics collection
        this.collectMetrics();
        this.logger.info('Performance monitor started');
        this.emit('started');
    }
    /**
     * Stop monitoring
     */
    async stop() {
        if (!this.running) {
            this.logger.warn('Performance monitor is not running');
            return;
        }
        this.logger.info('Stopping performance monitor');
        this.running = false;
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = undefined;
        }
        this.logger.info('Performance monitor stopped');
        this.emit('stopped');
    }
    /**
     * Record request start
     */
    recordRequestStart(requestId) {
        this.requestTrackers.set(requestId, {
            startTime: Date.now()
        });
        this.totalRequests++;
    }
    /**
     * Record request end
     */
    recordRequestEnd(requestId, success) {
        const tracker = this.requestTrackers.get(requestId);
        if (!tracker) {
            this.logger.warn(`Request tracker not found: ${requestId}`);
            return;
        }
        const endTime = Date.now();
        const duration = endTime - tracker.startTime;
        tracker.endTime = endTime;
        tracker.success = success;
        // Record response time
        this.responseTimes.push(duration);
        this.limitArraySize(this.responseTimes, 10000);
        // Update counters
        if (success) {
            this.successfulRequests++;
        }
        else {
            this.failedRequests++;
        }
        // Clean up tracker
        this.requestTrackers.delete(requestId);
        this.emit('requestCompleted', {
            requestId,
            duration,
            success
        });
    }
    /**
     * Record connection event
     */
    recordConnection(event) {
        const timestamp = Date.now();
        switch (event) {
            case 'connect':
                this.totalConnections++;
                this.activeConnections++;
                this.emit('connectionEvent', { event, timestamp });
                break;
            case 'disconnect':
                this.activeConnections = Math.max(0, this.activeConnections - 1);
                this.emit('connectionEvent', { event, timestamp });
                break;
            case 'error':
                this.failedConnections++;
                this.emit('connectionEvent', { event, timestamp });
                break;
        }
    }
    /**
     * Record resource access
     */
    recordResourceAccess(uri, duration, cached) {
        const accessId = `${uri}_${Date.now()}`;
        this.resourceAccessTrackers.set(accessId, {
            uri,
            startTime: Date.now() - duration,
            endTime: Date.now(),
            cached
        });
        // Record access time
        this.resourceReadTimes.push(duration);
        this.limitArraySize(this.resourceReadTimes, 5000);
        // Update counters
        this.resourceAccessCount++;
        if (cached) {
            this.cacheHits++;
        }
        else {
            this.cacheMisses++;
        }
        this.emit('resourceAccessed', {
            uri,
            duration,
            cached
        });
        // Clean up tracker after a delay
        setTimeout(() => {
            this.resourceAccessTrackers.delete(accessId);
        }, 60000); // Keep for 1 minute
    }
    /**
     * Record tool execution
     */
    recordToolExecution(name, duration, success) {
        const executionId = `${name}_${Date.now()}`;
        this.toolExecutionTrackers.set(executionId, {
            name,
            startTime: Date.now() - duration,
            endTime: Date.now(),
            success
        });
        // Record execution time
        this.toolExecutionTimes.push(duration);
        this.limitArraySize(this.toolExecutionTimes, 5000);
        // Update counters
        this.toolExecutionCount++;
        if (success) {
            this.toolSuccessCount++;
        }
        this.emit('toolExecuted', {
            name,
            duration,
            success
        });
        // Clean up tracker after a delay
        setTimeout(() => {
            this.toolExecutionTrackers.delete(executionId);
        }, 60000); // Keep for 1 minute
    }
    /**
     * Get current performance metrics
     */
    getCurrentMetrics() {
        const now = Date.now();
        const uptime = now - this.startTime;
        const uptimeSeconds = uptime / 1000;
        // Calculate response time statistics
        const avgResponseTime = this.calculateAverage(this.responseTimes);
        const p95ResponseTime = this.calculatePercentile(this.responseTimes, 0.95);
        const p99ResponseTime = this.calculatePercentile(this.responseTimes, 0.99);
        // Calculate rates
        const rps = uptimeSeconds > 0 ? this.totalRequests / uptimeSeconds : 0;
        const cacheHitRate = (this.cacheHits + this.cacheMisses) > 0 ?
            this.cacheHits / (this.cacheHits + this.cacheMisses) : 0;
        const toolSuccessRate = this.toolExecutionCount > 0 ?
            this.toolSuccessCount / this.toolExecutionCount : 0;
        // Calculate averages
        const avgConnectionTime = this.calculateAverage(this.connectionTimes);
        const avgResourceReadTime = this.calculateAverage(this.resourceReadTimes);
        const avgToolExecutionTime = this.calculateAverage(this.toolExecutionTimes);
        // Get system metrics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const cpuPercent = uptimeSeconds > 0 ?
            (cpuUsage.user + cpuUsage.system) / 1000000 / uptimeSeconds * 100 : 0;
        return {
            requests: {
                total: this.totalRequests,
                successful: this.successfulRequests,
                failed: this.failedRequests,
                rps,
                avgResponseTime,
                p95ResponseTime,
                p99ResponseTime
            },
            connections: {
                active: this.activeConnections,
                total: this.totalConnections,
                failed: this.failedConnections,
                avgConnectionTime
            },
            resources: {
                total: this.getResourceCount(),
                accessCount: this.resourceAccessCount,
                cacheHitRate,
                avgReadTime: avgResourceReadTime
            },
            tools: {
                total: this.getToolCount(),
                executionCount: this.toolExecutionCount,
                avgExecutionTime: avgToolExecutionTime,
                successRate: toolSuccessRate
            },
            system: {
                memoryUsage: memoryUsage.heapUsed,
                cpuUsage: Math.min(cpuPercent, 100),
                uptime,
                healthScore: this.calculateHealthScore()
            }
        };
    }
    /**
     * Get performance history
     */
    getPerformanceHistory(hours) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.metricsHistory
            .filter(entry => entry.timestamp >= cutoff)
            .map(entry => entry.metrics);
    }
    /**
     * Generate performance report
     */
    async generateReport(timeWindow) {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - timeWindow * 60 * 60 * 1000);
        const currentMetrics = this.getCurrentMetrics();
        const historicalMetrics = this.getPerformanceHistory(timeWindow);
        // Analyze trends
        const trends = this.analyzeTrends(historicalMetrics);
        // Identify issues
        const issues = this.identifyIssues(currentMetrics);
        // Generate recommendations
        const recommendations = this.generateRecommendations(currentMetrics, trends, issues);
        return {
            period: {
                start: startTime,
                end: endTime,
                duration: timeWindow * 60 * 60 * 1000
            },
            summary: currentMetrics,
            trends,
            issues,
            recommendations
        };
    }
    /**
     * Collect metrics and store in history
     */
    collectMetrics() {
        const metrics = this.getCurrentMetrics();
        const timestamp = new Date();
        this.metricsHistory.push({ metrics, timestamp });
        // Clean up old metrics
        const cutoff = new Date(Date.now() - this.config.retentionPeriod);
        const initialLength = this.metricsHistory.length;
        this.metricsHistory.splice(0, this.metricsHistory.findIndex(entry => entry.timestamp >= cutoff));
        if (this.metricsHistory.length < initialLength) {
            this.logger.debug(`Cleaned up ${initialLength - this.metricsHistory.length} old metrics entries`);
        }
        this.emit('performanceUpdate', metrics);
        // Check for performance alerts
        this.checkPerformanceAlerts(metrics);
    }
    /**
     * Check for performance alerts
     */
    checkPerformanceAlerts(metrics) {
        const alerts = [];
        // High response time alert
        if (metrics.requests.avgResponseTime > 1000) {
            alerts.push({
                type: 'high-response-time',
                severity: AlertSeverity.MEDIUM,
                message: `Average response time is ${metrics.requests.avgResponseTime.toFixed(2)}ms`,
                data: { avgResponseTime: metrics.requests.avgResponseTime }
            });
        }
        // High error rate alert
        const errorRate = metrics.requests.total > 0 ?
            metrics.requests.failed / metrics.requests.total : 0;
        if (errorRate > 0.1) {
            alerts.push({
                type: 'high-error-rate',
                severity: AlertSeverity.HIGH,
                message: `Error rate is ${(errorRate * 100).toFixed(2)}%`,
                data: { errorRate }
            });
        }
        // Low cache hit rate alert
        if (metrics.resources.cacheHitRate < 0.5 && metrics.resources.accessCount > 100) {
            alerts.push({
                type: 'low-cache-hit-rate',
                severity: AlertSeverity.LOW,
                message: `Cache hit rate is ${(metrics.resources.cacheHitRate * 100).toFixed(2)}%`,
                data: { cacheHitRate: metrics.resources.cacheHitRate }
            });
        }
        // High memory usage alert
        const memoryUsageGB = metrics.system.memoryUsage / (1024 * 1024 * 1024);
        if (memoryUsageGB > 0.8) {
            alerts.push({
                type: 'high-memory-usage',
                severity: AlertSeverity.MEDIUM,
                message: `Memory usage is ${memoryUsageGB.toFixed(2)}GB`,
                data: { memoryUsage: metrics.system.memoryUsage }
            });
        }
        // Emit alerts
        alerts.forEach(alert => {
            this.emit('performanceAlert', alert);
        });
    }
    /**
     * Analyze performance trends
     */
    analyzeTrends(historicalMetrics) {
        if (historicalMetrics.length < 2) {
            return {
                responseTime: 'stable',
                throughput: 'stable',
                errorRate: 'stable',
                availability: 'stable'
            };
        }
        const recent = historicalMetrics.slice(-5); // Last 5 data points
        const older = historicalMetrics.slice(0, 5); // First 5 data points
        const recentAvgResponseTime = this.calculateAverage(recent.map(m => m.requests.avgResponseTime));
        const olderAvgResponseTime = this.calculateAverage(older.map(m => m.requests.avgResponseTime));
        const recentThroughput = this.calculateAverage(recent.map(m => m.requests.rps));
        const olderThroughput = this.calculateAverage(older.map(m => m.requests.rps));
        const recentErrorRate = this.calculateAverage(recent.map(m => m.requests.total > 0 ? m.requests.failed / m.requests.total : 0));
        const olderErrorRate = this.calculateAverage(older.map(m => m.requests.total > 0 ? m.requests.failed / m.requests.total : 0));
        return {
            responseTime: this.getTrend(olderAvgResponseTime, recentAvgResponseTime, true),
            throughput: this.getTrend(olderThroughput, recentThroughput, false),
            errorRate: this.getTrend(olderErrorRate, recentErrorRate, true),
            availability: 'stable' // Simplified for now
        };
    }
    /**
     * Identify performance issues
     */
    identifyIssues(metrics) {
        const issues = [];
        // High response time
        if (metrics.requests.avgResponseTime > 1000) {
            issues.push({
                type: 'performance',
                description: 'High average response time',
                severity: AlertSeverity.MEDIUM,
                impact: 'User experience degradation',
                recommendation: 'Investigate slow operations and optimize performance'
            });
        }
        // High error rate
        const errorRate = metrics.requests.total > 0 ?
            metrics.requests.failed / metrics.requests.total : 0;
        if (errorRate > 0.05) {
            issues.push({
                type: 'reliability',
                description: 'High error rate',
                severity: errorRate > 0.1 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
                impact: 'Service reliability concerns',
                recommendation: 'Review error logs and fix underlying issues'
            });
        }
        // Low cache hit rate
        if (metrics.resources.cacheHitRate < 0.7 && metrics.resources.accessCount > 50) {
            issues.push({
                type: 'efficiency',
                description: 'Low cache hit rate',
                severity: AlertSeverity.LOW,
                impact: 'Increased resource access latency',
                recommendation: 'Review caching strategy and cache invalidation policies'
            });
        }
        // High memory usage
        const memoryUsageGB = metrics.system.memoryUsage / (1024 * 1024 * 1024);
        if (memoryUsageGB > 0.8) {
            issues.push({
                type: 'resource',
                description: 'High memory usage',
                severity: AlertSeverity.MEDIUM,
                impact: 'Potential memory exhaustion',
                recommendation: 'Monitor memory leaks and optimize memory usage'
            });
        }
        return issues;
    }
    /**
     * Generate performance recommendations
     */
    generateRecommendations(metrics, trends, issues) {
        const recommendations = [];
        // Response time recommendations
        if (metrics.requests.avgResponseTime > 500) {
            recommendations.push('Consider implementing request caching to reduce response times');
            recommendations.push('Review database query performance and add indexes where needed');
        }
        // Throughput recommendations
        if (metrics.requests.rps < 10 && metrics.system.cpuUsage < 50) {
            recommendations.push('System appears underutilized - consider load testing to validate capacity');
        }
        // Cache recommendations
        if (metrics.resources.cacheHitRate < 0.8) {
            recommendations.push('Improve cache hit rate by optimizing cache size and TTL settings');
        }
        // Memory recommendations
        const memoryUsageGB = metrics.system.memoryUsage / (1024 * 1024 * 1024);
        if (memoryUsageGB > 0.5) {
            recommendations.push('Monitor memory usage trends and consider garbage collection tuning');
        }
        // Trend-based recommendations
        if (trends.responseTime === 'degrading') {
            recommendations.push('Response time is trending upward - investigate performance bottlenecks');
        }
        if (trends.errorRate === 'degrading') {
            recommendations.push('Error rate is increasing - review recent changes and error logs');
        }
        return recommendations;
    }
    /**
     * Calculate average of array
     */
    calculateAverage(values) {
        if (values.length === 0)
            return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    /**
     * Calculate percentile
     */
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[Math.max(0, index)];
    }
    /**
     * Limit array size
     */
    limitArraySize(array, maxSize) {
        while (array.length > maxSize) {
            array.shift();
        }
    }
    /**
     * Get trend direction
     */
    getTrend(oldValue, newValue, lowerIsBetter) {
        const threshold = 0.1; // 10% change threshold
        const change = (newValue - oldValue) / (oldValue || 1);
        if (Math.abs(change) < threshold) {
            return 'stable';
        }
        if (lowerIsBetter) {
            return change > 0 ? 'degrading' : 'improving';
        }
        else {
            return change > 0 ? 'improving' : 'degrading';
        }
    }
    /**
     * Calculate health score
     */
    calculateHealthScore() {
        let score = 100;
        // Response time impact
        const avgResponseTime = this.calculateAverage(this.responseTimes);
        if (avgResponseTime > 1000) {
            score -= Math.min(30, (avgResponseTime - 1000) / 100);
        }
        // Error rate impact
        const errorRate = this.totalRequests > 0 ? this.failedRequests / this.totalRequests : 0;
        score -= errorRate * 50;
        // Memory usage impact
        const memoryUsageGB = process.memoryUsage().heapUsed / (1024 * 1024 * 1024);
        if (memoryUsageGB > 0.8) {
            score -= (memoryUsageGB - 0.8) * 100;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Get resource count (placeholder)
     */
    getResourceCount() {
        // This would be injected from resource manager
        return 0;
    }
    /**
     * Get tool count (placeholder)
     */
    getToolCount() {
        // This would be injected from tool manager
        return 0;
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map