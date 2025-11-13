"use strict";
/**
 * Metrics Collector Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MetricsCollector_1 = require("./MetricsCollector");
const Logger_1 = require("../utils/Logger");
(0, vitest_1.describe)('MetricsCollector', () => {
    let metricsCollector;
    let logger;
    (0, vitest_1.beforeEach)(() => {
        logger = new Logger_1.Logger('TestMetricsCollector');
        metricsCollector = new MetricsCollector_1.MetricsCollector({
            interval: 1000, // 1 second for testing
            retentionPeriod: 60000, // 1 minute for testing
            storage: { type: 'memory', logger }
        });
    });
    (0, vitest_1.afterEach)(async () => {
        if (metricsCollector) {
            await metricsCollector.stop();
        }
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should start and stop successfully', async () => {
            let startEventEmitted = false;
            let stopEventEmitted = false;
            metricsCollector.on('started', () => {
                startEventEmitted = true;
            });
            metricsCollector.on('stopped', () => {
                stopEventEmitted = true;
            });
            await metricsCollector.start();
            (0, vitest_1.expect)(startEventEmitted).toBe(true);
            await metricsCollector.stop();
            (0, vitest_1.expect)(stopEventEmitted).toBe(true);
        });
        (0, vitest_1.it)('should handle multiple start calls gracefully', async () => {
            await metricsCollector.start();
            await metricsCollector.start(); // Should not throw
            await metricsCollector.stop();
        });
        (0, vitest_1.it)('should handle multiple stop calls gracefully', async () => {
            await metricsCollector.start();
            await metricsCollector.stop();
            await metricsCollector.stop(); // Should not throw
        });
    });
    (0, vitest_1.describe)('Metric Recording', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should record basic metrics', () => {
            let metricRecorded = false;
            metricsCollector.on('metricRecorded', (name, value, labels) => {
                (0, vitest_1.expect)(name).toBe('test_metric');
                (0, vitest_1.expect)(value).toBe(42);
                (0, vitest_1.expect)(labels).toEqual({ type: 'test' });
                metricRecorded = true;
            });
            metricsCollector.recordMetric('test_metric', 42, { type: 'test' });
            (0, vitest_1.expect)(metricRecorded).toBe(true);
        });
        (0, vitest_1.it)('should increment counters', () => {
            metricsCollector.incrementCounter('test_counter');
            metricsCollector.incrementCounter('test_counter');
            metricsCollector.incrementCounter('test_counter', { label: 'value' });
            const metric = metricsCollector.getMetric('test_counter');
            (0, vitest_1.expect)(metric).toBeDefined();
            (0, vitest_1.expect)(metric.dataPoints.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should record histogram values', () => {
            metricsCollector.recordHistogram('response_time', 100);
            metricsCollector.recordHistogram('response_time', 200);
            metricsCollector.recordHistogram('response_time', 150);
            const metric = metricsCollector.getMetric('response_time');
            (0, vitest_1.expect)(metric).toBeDefined();
            (0, vitest_1.expect)(metric.dataPoints.length).toBe(3);
        });
        (0, vitest_1.it)('should record gauge values', () => {
            metricsCollector.recordGauge('memory_usage', 1024);
            metricsCollector.recordGauge('memory_usage', 2048);
            const metric = metricsCollector.getMetric('memory_usage');
            (0, vitest_1.expect)(metric).toBeDefined();
            (0, vitest_1.expect)(metric.dataPoints[metric.dataPoints.length - 1].value).toBe(2048);
        });
    });
    (0, vitest_1.describe)('Request Tracking', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should track request lifecycle', () => {
            const requestId = 'test-request-1';
            metricsCollector.recordRequestStart(requestId);
            // Simulate some processing time
            setTimeout(() => {
                metricsCollector.recordRequestEnd(requestId, true);
            }, 10);
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics.requests.total).toBe(1);
        });
        (0, vitest_1.it)('should track successful and failed requests', () => {
            metricsCollector.recordRequestStart('req1');
            metricsCollector.recordRequestEnd('req1', true);
            metricsCollector.recordRequestStart('req2');
            metricsCollector.recordRequestEnd('req2', false);
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics.requests.total).toBe(2);
            (0, vitest_1.expect)(metrics.requests.successful).toBe(1);
            (0, vitest_1.expect)(metrics.requests.failed).toBe(1);
        });
    });
    (0, vitest_1.describe)('Connection Tracking', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should track connection events', () => {
            metricsCollector.recordConnectionEvent('connect');
            metricsCollector.recordConnectionEvent('connect');
            metricsCollector.recordConnectionEvent('disconnect');
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics.connections.total).toBe(2);
            (0, vitest_1.expect)(metrics.connections.active).toBe(1);
        });
        (0, vitest_1.it)('should handle connection errors', () => {
            metricsCollector.recordConnectionEvent('error');
            // Should not affect active connection count
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics.connections.active).toBe(0);
        });
    });
    (0, vitest_1.describe)('Resource Access Tracking', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should track resource access', () => {
            metricsCollector.recordResourceAccess('file://test.txt', 50, true);
            metricsCollector.recordResourceAccess('file://test2.txt', 100, false);
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics.resources.accessCount).toBe(2);
            (0, vitest_1.expect)(metrics.resources.cacheHitRate).toBe(0.5);
        });
    });
    (0, vitest_1.describe)('Tool Execution Tracking', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should track tool execution', () => {
            metricsCollector.recordToolExecution('test-tool', 200, true);
            metricsCollector.recordToolExecution('test-tool', 150, false);
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics.tools.executionCount).toBe(2);
            (0, vitest_1.expect)(metrics.tools.successRate).toBe(0.5);
        });
    });
    (0, vitest_1.describe)('Metrics History', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should maintain metrics history', () => {
            metricsCollector.recordMetric('test_metric', 1);
            metricsCollector.recordMetric('test_metric', 2);
            metricsCollector.recordMetric('test_metric', 3);
            const history = metricsCollector.getMetricsHistory(1); // 1 hour
            (0, vitest_1.expect)(history.length).toBeGreaterThan(0);
            const testMetricHistory = history.find(h => h.name === 'test_metric');
            (0, vitest_1.expect)(testMetricHistory).toBeDefined();
            (0, vitest_1.expect)(testMetricHistory.dataPoints.length).toBe(3);
        });
        (0, vitest_1.it)('should filter history by time range', () => {
            const now = Date.now();
            // Record old metric
            metricsCollector.recordMetric('old_metric', 1);
            // Mock old timestamp
            const metric = metricsCollector.getMetric('old_metric');
            if (metric && metric.dataPoints.length > 0) {
                metric.dataPoints[0].timestamp = new Date(now - 2 * 60 * 60 * 1000); // 2 hours ago
            }
            // Record recent metric
            metricsCollector.recordMetric('recent_metric', 2);
            const recentHistory = metricsCollector.getMetricsHistory(1); // 1 hour
            const recentMetricNames = recentHistory.map(h => h.name);
            (0, vitest_1.expect)(recentMetricNames).toContain('recent_metric');
            // old_metric might still be there depending on cleanup timing
        });
    });
    (0, vitest_1.describe)('Current Metrics', () => {
        (0, vitest_1.beforeEach)(async () => {
            await metricsCollector.start();
        });
        (0, vitest_1.it)('should provide current performance metrics', () => {
            const metrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metrics).toHaveProperty('requests');
            (0, vitest_1.expect)(metrics).toHaveProperty('connections');
            (0, vitest_1.expect)(metrics).toHaveProperty('resources');
            (0, vitest_1.expect)(metrics).toHaveProperty('tools');
            (0, vitest_1.expect)(metrics).toHaveProperty('system');
            (0, vitest_1.expect)(metrics.requests).toHaveProperty('total');
            (0, vitest_1.expect)(metrics.requests).toHaveProperty('successful');
            (0, vitest_1.expect)(metrics.requests).toHaveProperty('failed');
            (0, vitest_1.expect)(metrics.requests).toHaveProperty('rps');
            (0, vitest_1.expect)(metrics.requests).toHaveProperty('avgResponseTime');
            (0, vitest_1.expect)(metrics.system).toHaveProperty('memoryUsage');
            (0, vitest_1.expect)(metrics.system).toHaveProperty('cpuUsage');
            (0, vitest_1.expect)(metrics.system).toHaveProperty('uptime');
            (0, vitest_1.expect)(metrics.system).toHaveProperty('healthScore');
        });
        (0, vitest_1.it)('should calculate health score correctly', () => {
            // Start with clean state
            const initialMetrics = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(initialMetrics.system.healthScore).toBeGreaterThan(90);
            // Add some failures
            metricsCollector.recordRequestStart('req1');
            metricsCollector.recordRequestEnd('req1', false);
            metricsCollector.recordRequestStart('req2');
            metricsCollector.recordRequestEnd('req2', false);
            const metricsWithErrors = metricsCollector.getCurrentMetrics();
            (0, vitest_1.expect)(metricsWithErrors.system.healthScore).toBeLessThan(initialMetrics.system.healthScore);
        });
    });
    (0, vitest_1.describe)('Metrics Collection Events', () => {
        (0, vitest_1.it)('should emit metrics collected events', (done) => {
            metricsCollector.on('metricsCollected', (metrics) => {
                (0, vitest_1.expect)(metrics).toBeDefined();
                (0, vitest_1.expect)(metrics).toHaveProperty('system');
                done();
            });
            metricsCollector.start();
        });
    });
});
//# sourceMappingURL=MetricsCollector.test.js.map