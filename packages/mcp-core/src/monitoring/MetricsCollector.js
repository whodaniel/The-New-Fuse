/**
 * Metrics Collection System
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
/**
 * Metrics collector implementation
 */
export class MetricsCollector extends EventEmitter {
    config;
    logger;
    running = false;
    collectionTimer;
    // Metric storage
    metrics = new Map();
    counters = new Map();
    histograms = new Map();
    gauges = new Map();
    // Performance tracking
    requestTimes = new Map();
    requestCount = 0;
    successfulRequests = 0;
    failedRequests = 0;
    connectionCount = 0;
    activeConnections = 0;
    resourceAccessCount = 0;
    cacheHits = 0;
    cacheMisses = 0;
    toolExecutionCount = 0;
    toolSuccessCount = 0;
    startTime = Date.now();
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger('MetricsCollector');
    }
    /**
     * Start collecting metrics
     */
    async start() {
        if (this.running) {
            this.logger.warn('Metrics collector is already running');
            return;
        }
        this.logger.info('Starting metrics collector', {
            interval: this.config.interval,
            retentionPeriod: this.config.retentionPeriod
        });
        this.running = true;
        this.startTime = Date.now();
        // Start collection timer
        this.collectionTimer = setInterval(() => {
            this.collectMetrics();
        }, this.config.interval);
        // Initial collection
        this.collectMetrics();
        this.logger.info('Metrics collector started');
        this.emit('started');
    }
    /**
     * Stop collecting metrics
     */
    async stop() {
        if (!this.running) {
            this.logger.warn('Metrics collector is not running');
            return;
        }
        this.logger.info('Stopping metrics collector');
        this.running = false;
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = undefined;
        }
        this.logger.info('Metrics collector stopped');
        this.emit('stopped');
    }
    /**
     * Record a metric value
     */
    recordMetric(name, value, labels) {
        const timestamp = new Date();
        const dataPoint = {
            timestamp,
            value,
            labels
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                name,
                dataPoints: [],
                metadata: { labels }
            });
        }
        const timeSeries = this.metrics.get(name);
        timeSeries.dataPoints.push(dataPoint);
        // Clean up old data points
        this.cleanupTimeSeries(timeSeries);
        this.emit('metricRecorded', name, value, labels);
    }
    /**
     * Increment a counter metric
     */
    incrementCounter(name, labels) {
        const key = this.getMetricKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + 1);
        this.recordMetric(name, current + 1, labels);
    }
    /**
     * Record a histogram value
     */
    recordHistogram(name, value, labels) {
        const key = this.getMetricKey(name, labels);
        if (!this.histograms.has(key)) {
            this.histograms.set(key, []);
        }
        const histogram = this.histograms.get(key);
        histogram.push(value);
        // Keep only recent values
        const cutoff = Date.now() - this.config.retentionPeriod;
        while (histogram.length > 1000) { // Limit histogram size
            histogram.shift();
        }
        this.recordMetric(name, value, labels);
    }
    /**
     * Record a gauge value
     */
    recordGauge(name, value, labels) {
        const key = this.getMetricKey(name, labels);
        this.gauges.set(key, value);
        this.recordMetric(name, value, labels);
    }
    /**
     * Get current metrics
     */
    getCurrentMetrics() {
        const now = Date.now();
        const uptime = now - this.startTime;
        const uptimeSeconds = uptime / 1000;
        // Calculate response time percentiles
        const responseTimes = Array.from(this.requestTimes.values());
        const p95ResponseTime = this.calculatePercentile(responseTimes, 0.95);
        const p99ResponseTime = this.calculatePercentile(responseTimes, 0.99);
        const avgResponseTime = responseTimes.length > 0 ?
            responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
        // Calculate rates
        const rps = uptimeSeconds > 0 ? this.requestCount / uptimeSeconds : 0;
        const cacheHitRate = (this.cacheHits + this.cacheMisses) > 0 ?
            this.cacheHits / (this.cacheHits + this.cacheMisses) : 0;
        const toolSuccessRate = this.toolExecutionCount > 0 ?
            this.toolSuccessCount / this.toolExecutionCount : 0;
        // Get system metrics
        const memoryUsage = process.memoryUsage().heapUsed;
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / uptimeSeconds * 100;
        return {
            requests: {
                total: this.requestCount,
                successful: this.successfulRequests,
                failed: this.failedRequests,
                rps,
                avgResponseTime,
                p95ResponseTime,
                p99ResponseTime
            },
            connections: {
                active: this.activeConnections,
                total: this.connectionCount,
                failed: this.connectionCount - this.activeConnections,
                avgConnectionTime: 0 // TODO: Track connection times
            },
            resources: {
                total: this.getResourceCount(),
                accessCount: this.resourceAccessCount,
                cacheHitRate,
                avgReadTime: 0 // TODO: Track resource read times
            },
            tools: {
                total: this.getToolCount(),
                executionCount: this.toolExecutionCount,
                avgExecutionTime: 0, // TODO: Track tool execution times
                successRate: toolSuccessRate
            },
            system: {
                memoryUsage,
                cpuUsage: Math.min(cpuPercent, 100),
                uptime,
                healthScore: this.calculateHealthScore()
            }
        };
    }
    /**
     * Get metrics history
     */
    getMetricsHistory(hours) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const history = [];
        for (const [name, timeSeries] of this.metrics) {
            const filteredDataPoints = timeSeries.dataPoints.filter(point => point.timestamp >= cutoff);
            if (filteredDataPoints.length > 0) {
                history.push({
                    name,
                    dataPoints: filteredDataPoints,
                    metadata: timeSeries.metadata
                });
            }
        }
        return history;
    }
    /**
     * Get specific metric
     */
    getMetric(name) {
        return this.metrics.get(name) || null;
    }
    /**
     * Record request start
     */
    recordRequestStart(requestId) {
        this.requestTimes.set(requestId, Date.now());
        this.requestCount++;
        this.incrementCounter('requests_total');
    }
    /**
     * Record request end
     */
    recordRequestEnd(requestId, success) {
        const startTime = this.requestTimes.get(requestId);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.recordHistogram('request_duration_ms', duration);
            this.requestTimes.delete(requestId);
        }
        if (success) {
            this.successfulRequests++;
            this.incrementCounter('requests_successful');
        }
        else {
            this.failedRequests++;
            this.incrementCounter('requests_failed');
        }
    }
    /**
     * Record connection event
     */
    recordConnectionEvent(event) {
        switch (event) {
            case 'connect':
                this.connectionCount++;
                this.activeConnections++;
                this.incrementCounter('connections_total');
                this.recordGauge('connections_active', this.activeConnections);
                break;
            case 'disconnect':
                this.activeConnections = Math.max(0, this.activeConnections - 1);
                this.recordGauge('connections_active', this.activeConnections);
                break;
            case 'error':
                this.incrementCounter('connection_errors');
                break;
        }
    }
    /**
     * Record resource access
     */
    recordResourceAccess(uri, duration, cached) {
        this.resourceAccessCount++;
        this.incrementCounter('resource_access_total');
        this.recordHistogram('resource_access_duration_ms', duration);
        if (cached) {
            this.cacheHits++;
            this.incrementCounter('resource_cache_hits');
        }
        else {
            this.cacheMisses++;
            this.incrementCounter('resource_cache_misses');
        }
        this.recordGauge('resource_cache_hit_rate', (this.cacheHits + this.cacheMisses) > 0 ?
            this.cacheHits / (this.cacheHits + this.cacheMisses) : 0);
    }
    /**
     * Record tool execution
     */
    recordToolExecution(name, duration, success) {
        this.toolExecutionCount++;
        this.incrementCounter('tool_executions_total', { tool: name });
        this.recordHistogram('tool_execution_duration_ms', duration, { tool: name });
        if (success) {
            this.toolSuccessCount++;
            this.incrementCounter('tool_executions_successful', { tool: name });
        }
        else {
            this.incrementCounter('tool_executions_failed', { tool: name });
        }
        this.recordGauge('tool_success_rate', this.toolExecutionCount > 0 ? this.toolSuccessCount / this.toolExecutionCount : 0);
    }
    /**
     * Collect current metrics
     */
    collectMetrics() {
        const metrics = this.getCurrentMetrics();
        // Record system metrics
        this.recordGauge('memory_usage_bytes', metrics.system.memoryUsage);
        this.recordGauge('cpu_usage_percent', metrics.system.cpuUsage);
        this.recordGauge('uptime_ms', metrics.system.uptime);
        this.recordGauge('health_score', metrics.system.healthScore);
        // Record performance metrics
        this.recordGauge('requests_per_second', metrics.requests.rps);
        this.recordGauge('response_time_avg_ms', metrics.requests.avgResponseTime);
        this.recordGauge('response_time_p95_ms', metrics.requests.p95ResponseTime);
        this.recordGauge('response_time_p99_ms', metrics.requests.p99ResponseTime);
        this.emit('metricsCollected', metrics);
    }
    /**
     * Clean up old data points from time series
     */
    cleanupTimeSeries(timeSeries) {
        const cutoff = new Date(Date.now() - this.config.retentionPeriod);
        const initialLength = timeSeries.dataPoints.length;
        timeSeries.dataPoints = timeSeries.dataPoints.filter(point => point.timestamp >= cutoff);
        if (timeSeries.dataPoints.length < initialLength) {
            this.logger.debug(`Cleaned up ${initialLength - timeSeries.dataPoints.length} old data points for ${timeSeries.name}`);
        }
    }
    /**
     * Generate metric key with labels
     */
    getMetricKey(name, labels) {
        if (!labels || Object.keys(labels).length === 0) {
            return name;
        }
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
        return `${name}{${labelStr}}`;
    }
    /**
     * Calculate percentile from array of values
     */
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[Math.max(0, index)];
    }
    /**
     * Calculate system health score
     */
    calculateHealthScore() {
        let score = 100;
        // Deduct points for high error rate
        const errorRate = this.requestCount > 0 ? this.failedRequests / this.requestCount : 0;
        score -= errorRate * 50;
        // Deduct points for high memory usage (assuming 1GB limit)
        const memoryUsageGB = process.memoryUsage().heapUsed / (1024 * 1024 * 1024);
        if (memoryUsageGB > 0.8) {
            score -= (memoryUsageGB - 0.8) * 100;
        }
        // Deduct points for high CPU usage (avoid circular dependency)
        // Simplified CPU calculation - in production this would be more sophisticated
        const cpuPercent = Math.min(Math.random() * 20 + 10, 100); // Mock CPU usage 10-30%
        if (cpuPercent > 80) {
            score -= (cpuPercent - 80) / 2;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Get resource count (placeholder - would be injected from resource manager)
     */
    getResourceCount() {
        return this.counters.get('resources_registered') || 0;
    }
    /**
     * Get tool count (placeholder - would be injected from tool manager)
     */
    getToolCount() {
        return this.counters.get('tools_registered') || 0;
    }
}
//# sourceMappingURL=MetricsCollector.js.map