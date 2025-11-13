/**
 * @fileoverview Production-ready metrics collection service
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { MetricType } from '../types/monitoring';
import { ServiceState } from '../constants/types';
import { logger } from '../utils/logger';
let MetricsCollector = class MetricsCollector {
    state = ServiceState.UNINITIALIZED;
    metrics = new Map();
    flushInterval;
    maxDataPoints = 1000; // Maximum data points per metric series
    flushIntervalMs = 60000; // Flush every minute
    constructor() {
        logger.setContext('MetricsCollector');
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            logger.warn('MetricsCollector is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            logger.info('Starting MetricsCollector');
            // Start periodic flush
            this.flushInterval = setInterval(() => {
                this.flushOldMetrics();
            }, this.flushIntervalMs);
            this.state = ServiceState.RUNNING;
            logger.info('MetricsCollector started successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to start MetricsCollector', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            logger.warn('MetricsCollector is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            logger.info('Stopping MetricsCollector');
            if (this.flushInterval) {
                clearInterval(this.flushInterval);
                this.flushInterval = undefined;
            }
            // Final flush
            this.flushOldMetrics();
            this.state = ServiceState.STOPPED;
            logger.info('MetricsCollector stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to stop MetricsCollector', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    collect(metric) {
        if (this.state !== ServiceState.RUNNING) {
            logger.warn('MetricsCollector is not running, ignoring metric', { metric: metric.name });
            return;
        }
        try {
            const dataPoint = {
                timestamp: metric.timestamp,
                value: metric.value,
                tags: metric.tags,
            };
            const existingSeries = this.metrics.get(metric.name);
            if (existingSeries) {
                // Add to existing series
                existingSeries.dataPoints.push(dataPoint);
                // Trim if too many data points
                if (existingSeries.dataPoints.length > this.maxDataPoints) {
                    existingSeries.dataPoints = existingSeries.dataPoints.slice(-this.maxDataPoints);
                }
            }
            else {
                // Create new series
                const newSeries = {
                    name: metric.name,
                    dataPoints: [dataPoint],
                    metadata: {
                        unit: metric.unit,
                        type: metric.type,
                        description: `Metric collected from ${metric.source}`,
                    },
                };
                this.metrics.set(metric.name, newSeries);
            }
            logger.debug('Collected metric', {
                name: metric.name,
                value: metric.value,
                source: metric.source
            });
        }
        catch (error) {
            logger.error('Failed to collect metric', error, { metric: metric.name });
        }
    }
    recordCounter(name, value = 1, tags = {}, source = 'system') {
        const metric = {
            name,
            value,
            type: MetricType.COUNTER,
            unit: 'count',
            timestamp: new Date(),
            tags,
            source,
        };
        this.collect(metric);
    }
    recordGauge(name, value, unit = 'units', tags = {}, source = 'system') {
        const metric = {
            name,
            value,
            type: MetricType.GAUGE,
            unit,
            timestamp: new Date(),
            tags,
            source,
        };
        this.collect(metric);
    }
    recordTimer(name, duration, tags = {}, source = 'system') {
        const metric = {
            name,
            value: duration,
            type: MetricType.TIMER,
            unit: 'ms',
            timestamp: new Date(),
            tags,
            source,
        };
        this.collect(metric);
    }
    recordHistogram(name, value, unit = 'units', tags = {}, source = 'system') {
        const metric = {
            name,
            value,
            type: MetricType.HISTOGRAM,
            unit,
            timestamp: new Date(),
            tags,
            source,
        };
        this.collect(metric);
    }
    getMetricSeries(name) {
        return this.metrics.get(name);
    }
    getAllMetrics() {
        return Array.from(this.metrics.values());
    }
    getMetricNames() {
        return Array.from(this.metrics.keys());
    }
    getMetricsCount() {
        return this.metrics.size;
    }
    getTotalDataPoints() {
        return Array.from(this.metrics.values())
            .reduce((total, series) => total + series.dataPoints.length, 0);
    }
    clearMetrics() {
        this.metrics.clear();
        logger.info('Cleared all metrics');
    }
    clearMetric(name) {
        const deleted = this.metrics.delete(name);
        if (deleted) {
            logger.info('Cleared metric', { name });
        }
        return deleted;
    }
    getMetricsSummary() {
        const summary = {};
        for (const [name, series] of this.metrics) {
            const values = series.dataPoints.map(dp => dp.value);
            const count = values.length;
            if (count === 0) {
                summary[name] = { count: 0 };
                continue;
            }
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / count;
            const min = Math.min(...values);
            const max = Math.max(...values);
            // Calculate percentiles for histograms and timers
            let percentiles = {};
            if (series.metadata.type === MetricType.HISTOGRAM || series.metadata.type === MetricType.TIMER) {
                const sorted = values.sort((a, b) => a - b);
                percentiles = {
                    p50: this.calculatePercentile(sorted, 50),
                    p90: this.calculatePercentile(sorted, 90),
                    p95: this.calculatePercentile(sorted, 95),
                    p99: this.calculatePercentile(sorted, 99),
                };
            }
            summary[name] = {
                count,
                sum,
                avg,
                min,
                max,
                unit: series.metadata.unit,
                type: series.metadata.type,
                ...percentiles,
            };
        }
        return summary;
    }
    calculatePercentile(sortedValues, percentile) {
        const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
        return sortedValues[Math.max(0, index)];
    }
    flushOldMetrics() {
        const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago
        let flushedCount = 0;
        for (const [name, series] of this.metrics) {
            const originalLength = series.dataPoints.length;
            series.dataPoints = series.dataPoints.filter(dp => dp.timestamp > cutoffTime);
            const flushed = originalLength - series.dataPoints.length;
            flushedCount += flushed;
            // Remove empty series
            if (series.dataPoints.length === 0) {
                this.metrics.delete(name);
            }
        }
        if (flushedCount > 0) {
            logger.debug('Flushed old metrics', { flushedCount, totalMetrics: this.metrics.size });
        }
    }
    // Utility method for timing operations
    time(name, operation, tags) {
        const startTime = Date.now();
        return operation()
            .then(result => {
            const duration = Date.now() - startTime;
            this.recordTimer(name, duration, tags);
            return result;
        })
            .catch(error => {
            const duration = Date.now() - startTime;
            this.recordTimer(name, duration, { ...tags, error: 'true' });
            throw error;
        });
    }
    // Utility method for timing synchronous operations
    timeSync(name, operation, tags) {
        const startTime = Date.now();
        try {
            const result = operation();
            const duration = Date.now() - startTime;
            this.recordTimer(name, duration, tags);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.recordTimer(name, duration, { ...tags, error: 'true' });
            throw error;
        }
    }
};
MetricsCollector = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MetricsCollector);
export { MetricsCollector };
//# sourceMappingURL=MetricsCollector.js.map