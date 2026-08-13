"use strict";
/**
 * Base metrics collector implementation
 * Provides common functionality for all metrics collectors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMetricsCollector = void 0;
const events_1 = require("events");
const Logger_js_1 = require("../utils/Logger.js");
/**
 * Base metrics collector that can be extended
 */
class BaseMetricsCollector extends events_1.EventEmitter {
    config;
    logger;
    running = false;
    collectionTimer;
    // Metric storage
    metrics = new Map();
    counters = new Map();
    histograms = new Map();
    gauges = new Map();
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger || new Logger_js_1.Logger('BaseMetricsCollector');
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
     * Get counter value
     */
    getCounterValue(name, labels) {
        const key = this.getMetricKey(name, labels);
        return this.counters.get(key) || 0;
    }
    /**
     * Get gauge value
     */
    getGaugeValue(name, labels) {
        const key = this.getMetricKey(name, labels);
        return this.gauges.get(key) || 0;
    }
    /**
     * Get histogram values
     */
    getHistogramValues(name, labels) {
        const key = this.getMetricKey(name, labels);
        return this.histograms.get(key) || [];
    }
}
exports.BaseMetricsCollector = BaseMetricsCollector;
//# sourceMappingURL=BaseMetricsCollector.js.map