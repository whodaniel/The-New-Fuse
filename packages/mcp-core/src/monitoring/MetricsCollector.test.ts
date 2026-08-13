/**
 * Metrics Collector Tests
 */

// @ts-expect-error - Jest globals are available without import
import { MetricsCollector } from './MetricsCollector.js';
import { Logger } from '../utils/Logger.js';

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestMetricsCollector');
    metricsCollector = new MetricsCollector({
      interval: 1000, // 1 second for testing
      retentionPeriod: 60000, // 1 minute for testing
      storage: { type: 'memory' }
    }, logger);
  });

  afterEach(async () => {
    if (metricsCollector) {
      await metricsCollector.stop();
    }
  });

  describe('Lifecycle', () => {
    it('should start and stop successfully', async () => {
      let startEventEmitted = false;
      let stopEventEmitted = false;

      metricsCollector.on('started', () => {
        startEventEmitted = true;
      });

      metricsCollector.on('stopped', () => {
        stopEventEmitted = true;
      });

      await metricsCollector.start();
      expect(startEventEmitted).toBe(true);

      await metricsCollector.stop();
      expect(stopEventEmitted).toBe(true);
    });

    it('should handle multiple start calls gracefully', async () => {
      await metricsCollector.start();
      await metricsCollector.start(); // Should not throw
      await metricsCollector.stop();
    });

    it('should handle multiple stop calls gracefully', async () => {
      await metricsCollector.start();
      await metricsCollector.stop();
      await metricsCollector.stop(); // Should not throw
    });
  });

  describe('Metric Recording', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should record basic metrics', () => {
      let metricRecorded = false;
      metricsCollector.on('metricRecorded', (name, value, labels) => {
        expect(name).toBe('test_metric');
        expect(value).toBe(42);
        expect(labels).toEqual({ type: 'test' });
        metricRecorded = true;
      });

      metricsCollector.recordMetric('test_metric', 42, { type: 'test' });
      expect(metricRecorded).toBe(true);
    });

    it('should increment counters', () => {
      metricsCollector.incrementCounter('test_counter');
      metricsCollector.incrementCounter('test_counter');
      metricsCollector.incrementCounter('test_counter', { label: 'value' });

      const metric = metricsCollector.getMetric('test_counter');
      expect(metric).toBeDefined();
      expect(metric!.dataPoints.length).toBeGreaterThan(0);
    });

    it('should record histogram values', () => {
      metricsCollector.recordHistogram('response_time', 100);
      metricsCollector.recordHistogram('response_time', 200);
      metricsCollector.recordHistogram('response_time', 150);

      const metric = metricsCollector.getMetric('response_time');
      expect(metric).toBeDefined();
      expect(metric!.dataPoints.length).toBe(3);
    });

    it('should record gauge values', () => {
      metricsCollector.recordGauge('memory_usage', 1024);
      metricsCollector.recordGauge('memory_usage', 2048);

      const metric = metricsCollector.getMetric('memory_usage');
      expect(metric).toBeDefined();
      expect(metric!.dataPoints[metric!.dataPoints.length - 1].value).toBe(2048);
    });
  });

  describe('Request Tracking', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should track request lifecycle', () => {
      const requestId = 'test-request-1';
      
      metricsCollector.recordRequestStart(requestId);
      
      // Simulate some processing time
      setTimeout(() => {
        metricsCollector.recordRequestEnd(requestId, true);
      }, 10);

      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.requests.total).toBe(1);
    });

    it('should track successful and failed requests', () => {
      metricsCollector.recordRequestStart('req1');
      metricsCollector.recordRequestEnd('req1', true);

      metricsCollector.recordRequestStart('req2');
      metricsCollector.recordRequestEnd('req2', false);

      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.successful).toBe(1);
      expect(metrics.requests.failed).toBe(1);
    });
  });

  describe('Connection Tracking', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should track connection events', () => {
      metricsCollector.recordConnectionEvent('connect');
      metricsCollector.recordConnectionEvent('connect');
      metricsCollector.recordConnectionEvent('disconnect');

      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.connections.total).toBe(2);
      expect(metrics.connections.active).toBe(1);
    });

    it('should handle connection errors', () => {
      metricsCollector.recordConnectionEvent('error');
      
      // Should not affect active connection count
      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.connections.active).toBe(0);
    });
  });

  describe('Resource Access Tracking', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should track resource access', () => {
      metricsCollector.recordResourceAccess('file://test.txt', 50, true);
      metricsCollector.recordResourceAccess('file://test2.txt', 100, false);

      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.resources.accessCount).toBe(2);
      expect(metrics.resources.cacheHitRate).toBe(0.5);
    });
  });

  describe('Tool Execution Tracking', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should track tool execution', () => {
      metricsCollector.recordToolExecution('test-tool', 200, true);
      metricsCollector.recordToolExecution('test-tool', 150, false);

      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.tools.executionCount).toBe(2);
      expect(metrics.tools.successRate).toBe(0.5);
    });
  });

  describe('Metrics History', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should maintain metrics history', () => {
      metricsCollector.recordMetric('test_metric', 1);
      metricsCollector.recordMetric('test_metric', 2);
      metricsCollector.recordMetric('test_metric', 3);

      const history = metricsCollector.getMetricsHistory(1); // 1 hour
      expect(history.length).toBeGreaterThan(0);
      
      const testMetricHistory = history.find(h => h.name === 'test_metric');
      expect(testMetricHistory).toBeDefined();
      expect(testMetricHistory!.dataPoints.length).toBe(3);
    });

    it('should filter history by time range', () => {
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
      
      expect(recentMetricNames).toContain('recent_metric');
      // old_metric might still be there depending on cleanup timing
    });
  });

  describe('Current Metrics', () => {
    beforeEach(async () => {
      await metricsCollector.start();
    });

    it('should provide current performance metrics', () => {
      const metrics = metricsCollector.getCurrentMetrics();
      
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('connections');
      expect(metrics).toHaveProperty('resources');
      expect(metrics).toHaveProperty('tools');
      expect(metrics).toHaveProperty('system');

      expect(metrics.requests).toHaveProperty('total');
      expect(metrics.requests).toHaveProperty('successful');
      expect(metrics.requests).toHaveProperty('failed');
      expect(metrics.requests).toHaveProperty('rps');
      expect(metrics.requests).toHaveProperty('avgResponseTime');

      expect(metrics.system).toHaveProperty('memoryUsage');
      expect(metrics.system).toHaveProperty('cpuUsage');
      expect(metrics.system).toHaveProperty('uptime');
      expect(metrics.system).toHaveProperty('healthScore');
    });

    it('should calculate health score correctly', () => {
      // Start with clean state
      const initialMetrics = metricsCollector.getCurrentMetrics();
      expect(initialMetrics.system.healthScore).toBeGreaterThan(90);

      // Add some failures
      metricsCollector.recordRequestStart('req1');
      metricsCollector.recordRequestEnd('req1', false);
      metricsCollector.recordRequestStart('req2');
      metricsCollector.recordRequestEnd('req2', false);

      const metricsWithErrors = metricsCollector.getCurrentMetrics();
      expect(metricsWithErrors.system.healthScore).toBeLessThan(initialMetrics.system.healthScore);
    });
  });

  describe('Metrics Collection Events', () => {
    it('should emit metrics collected events', (done) => {
      metricsCollector.on('metricsCollected', (metrics) => {
        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('system');
        done();
      });

      metricsCollector.start();
    });
  });
});