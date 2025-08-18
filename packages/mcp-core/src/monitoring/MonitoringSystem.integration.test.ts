/**
 * Monitoring System Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MonitoringSystem } from './MonitoringSystem';
import { MonitoringConfig, AlertSeverity } from '../types/monitoring';
import { Logger } from '../utils/Logger';

describe('MonitoringSystem Integration', () => {
  let monitoringSystem: MonitoringSystem;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestMonitoringSystemIntegration');
    monitoringSystem = new MonitoringSystem(logger);
  });

  afterEach(async () => {
    if (monitoringSystem) {
      await monitoringSystem.shutdown();
    }
  });

  describe('End-to-End Monitoring Flow', () => {
    it('should collect metrics, trigger alerts, and update dashboards', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 500, // Fast for testing
        retentionPeriod: 60000,
        enableAlerting: true,
        alertInterval: 500, // Fast for testing
        enableDashboards: true,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      // Get components
      const metricsCollector = monitoringSystem.getMetricsCollector();
      const alertManager = monitoringSystem.getAlertManager();
      const performanceMonitor = monitoringSystem.getPerformanceMonitor();
      const dashboardManager = monitoringSystem.getDashboardManager();

      // Simulate some activity
      performanceMonitor.recordRequestStart('req1');
      performanceMonitor.recordRequestEnd('req1', true);
      performanceMonitor.recordConnection('connect');
      performanceMonitor.recordResourceAccess('file://test.txt', 50, true);
      performanceMonitor.recordToolExecution('test-tool', 100, true);

      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 600));

      // Check metrics
      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.requests.total).toBeGreaterThan(0);
      expect(metrics.connections.active).toBeGreaterThan(0);

      // Check dashboards
      const dashboards = await dashboardManager.listDashboards();
      expect(dashboards.length).toBeGreaterThan(0);

      const systemDashboard = dashboards.find(d => d.id === 'system-overview');
      expect(systemDashboard).toBeDefined();

      const dashboardData = await dashboardManager.getDashboardData('system-overview');
      expect(dashboardData).toBeDefined();
      expect(dashboardData.data).toBeDefined();
    });

    it('should handle high load scenarios', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 100,
        retentionPeriod: 60000,
        enableAlerting: true,
        alertInterval: 200,
        enableDashboards: true,
        dashboardRefreshInterval: 500,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const performanceMonitor = monitoringSystem.getPerformanceMonitor();
      const metricsCollector = monitoringSystem.getMetricsCollector();

      // Simulate high load
      const requestCount = 100;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < requestCount; i++) {
        promises.push(new Promise(resolve => {
          const requestId = `req-${i}`;
          performanceMonitor.recordRequestStart(requestId);
          
          setTimeout(() => {
            performanceMonitor.recordRequestEnd(requestId, Math.random() > 0.1); // 90% success rate
            resolve();
          }, Math.random() * 50); // Random response time up to 50ms
        }));
      }

      await Promise.all(promises);

      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 300));

      const metrics = metricsCollector.getCurrentMetrics();
      expect(metrics.requests.total).toBe(requestCount);
      expect(metrics.requests.successful).toBeGreaterThan(requestCount * 0.8); // At least 80% success
      expect(metrics.requests.rps).toBeGreaterThan(0);
    });

    it('should trigger alerts based on metrics', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 200,
        retentionPeriod: 60000,
        enableAlerting: true,
        alertInterval: 300,
        enableDashboards: true,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const alertManager = monitoringSystem.getAlertManager();
      const performanceMonitor = monitoringSystem.getPerformanceMonitor();

      // Register a custom alert rule for testing
      let alertTriggered = false;
      alertManager.registerAlertRule({
        name: 'test-high-requests',
        description: 'Test alert for high request count',
        severity: AlertSeverity.MEDIUM,
        cooldown: 1000,
        enabled: true,
        condition: (metrics) => metrics.requests.total > 10,
        action: async () => {
          alertTriggered = true;
        }
      });

      // Generate enough requests to trigger the alert
      for (let i = 0; i < 15; i++) {
        const requestId = `alert-test-req-${i}`;
        performanceMonitor.recordRequestStart(requestId);
        performanceMonitor.recordRequestEnd(requestId, true);
      }

      // Wait for alert checking
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(alertTriggered).toBe(true);

      const activeAlerts = alertManager.getActiveAlerts();
      expect(activeAlerts.find(a => a.name === 'test-high-requests')).toBeDefined();
    });
  });

  describe('Load Testing Integration', () => {
    it('should run load tests and collect results', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 1000,
        retentionPeriod: 60000,
        enableAlerting: false,
        alertInterval: 1000,
        enableDashboards: false,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const loadTester = monitoringSystem.getLoadTester();

      const loadTestConfig = {
        name: 'integration-test',
        description: 'Integration test load test',
        endpoint: 'http://localhost:3000/test',
        concurrency: 5,
        duration: 2000, // 2 seconds
        request: {
          method: 'GET',
          params: {}
        },
        thresholds: {
          maxAvgResponseTime: 1000,
          maxP95ResponseTime: 2000,
          minSuccessRate: 0.8,
          maxErrorRate: 0.2
        }
      };

      const result = await loadTester.runLoadTest(loadTestConfig);

      expect(result).toBeDefined();
      expect(result.config.name).toBe('integration-test');
      expect(result.totalRequests).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(1000);
      expect(result.duration).toBeLessThan(3000);
      expect(typeof result.passed).toBe('boolean');

      // Generate report
      const report = await loadTester.generateTestReport(result);
      expect(report).toContain('Load Test Report');
      expect(report).toContain('integration-test');
    });
  });

  describe('Cache and Connection Pool Monitoring', () => {
    it('should monitor cache performance', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 1000,
        retentionPeriod: 60000,
        enableAlerting: false,
        alertInterval: 1000,
        enableDashboards: false,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const cacheMonitor = monitoringSystem.getCacheMonitor();

      // Simulate cache activity
      cacheMonitor.recordCacheHit('key1', 5);
      cacheMonitor.recordCacheHit('key2', 3);
      cacheMonitor.recordCacheMiss('key3', 50);
      cacheMonitor.recordCacheEviction('key1', 'TTL expired');

      const metrics = cacheMonitor.getCacheMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBeCloseTo(0.67, 2);
      expect(metrics.evictions).toBe(1);
      expect(metrics.avgAccessTime).toBeGreaterThan(0);

      const patterns = cacheMonitor.getCacheAccessPatterns(1);
      expect(patterns.topKeys.length).toBeGreaterThan(0);
      expect(patterns.evictionReasons['TTL expired']).toBe(1);
    });

    it('should monitor connection pool performance', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 1000,
        retentionPeriod: 60000,
        enableAlerting: false,
        alertInterval: 1000,
        enableDashboards: false,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const connectionPoolMonitor = monitoringSystem.getConnectionPoolMonitor();

      // Simulate connection pool activity
      connectionPoolMonitor.recordConnectionCreated();
      connectionPoolMonitor.recordConnectionCreated();
      connectionPoolMonitor.recordConnectionAcquired(10);
      connectionPoolMonitor.recordConnectionReleased();
      connectionPoolMonitor.recordConnectionDestroyed(5000);

      const metrics = connectionPoolMonitor.getPoolMetrics();
      expect(metrics.poolSize).toBe(1);
      expect(metrics.createdConnections).toBe(2);
      expect(metrics.destroyedConnections).toBe(1);
      expect(metrics.avgConnectionLifetime).toBe(5000);

      const analysis = connectionPoolMonitor.getPoolAnalysis(1);
      expect(analysis.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency).toBeGreaterThan(0);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
  });

  describe('System Health Monitoring', () => {
    it('should monitor system health', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 1000,
        retentionPeriod: 60000,
        enableAlerting: false,
        alertInterval: 1000,
        enableDashboards: false,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const systemHealthMonitor = monitoringSystem.getSystemHealthMonitor();

      // Start health monitoring
      systemHealthMonitor.start();

      // Wait for health checks to run
      await new Promise(resolve => setTimeout(resolve, 1100));

      const healthStatus = await systemHealthMonitor.getHealthStatus();
      expect(healthStatus).toBeDefined();
      expect(typeof healthStatus.healthy).toBe('boolean');
      expect(healthStatus.score).toBeGreaterThanOrEqual(0);
      expect(healthStatus.score).toBeLessThanOrEqual(100);
      expect(healthStatus.components).toBeDefined();
      expect(healthStatus.metrics).toBeDefined();

      const healthChecks = await systemHealthMonitor.getHealthChecks();
      expect(healthChecks.length).toBeGreaterThan(0);

      // Check for default health checks
      const memoryCheck = healthChecks.find(c => c.name === 'memory-usage');
      expect(memoryCheck).toBeDefined();
      expect(typeof memoryCheck!.healthy).toBe('boolean');

      systemHealthMonitor.stop();
    });
  });

  describe('Metrics Export', () => {
    it('should export comprehensive metrics in different formats', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 500,
        retentionPeriod: 60000,
        enableAlerting: true,
        alertInterval: 1000,
        enableDashboards: true,
        dashboardRefreshInterval: 1000,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      // Generate some activity
      const performanceMonitor = monitoringSystem.getPerformanceMonitor();
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordRequestStart(`req-${i}`);
        performanceMonitor.recordRequestEnd(`req-${i}`, true);
      }

      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 600));

      // Test JSON export
      const jsonMetrics = await monitoringSystem.exportMetrics('json');
      const parsedJson = JSON.parse(jsonMetrics);
      expect(parsedJson.requests.total).toBeGreaterThan(0);

      // Test Prometheus export
      const prometheusMetrics = await monitoringSystem.exportMetrics('prometheus');
      expect(prometheusMetrics).toContain('mcp_requests_total');
      expect(prometheusMetrics).toContain('mcp_health_score');

      // Verify Prometheus format
      const lines = prometheusMetrics.split('\n');
      const requestsLine = lines.find(line => line.startsWith('mcp_requests_total'));
      expect(requestsLine).toBeDefined();
      expect(requestsLine).toMatch(/mcp_requests_total \d+/);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance under sustained load', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 100,
        retentionPeriod: 60000,
        enableAlerting: true,
        alertInterval: 200,
        enableDashboards: true,
        dashboardRefreshInterval: 500,
        storage: { type: 'memory' }
      };

      await monitoringSystem.initialize(config);

      const performanceMonitor = monitoringSystem.getPerformanceMonitor();
      const startTime = Date.now();
      const testDuration = 3000; // 3 seconds
      let requestCount = 0;

      // Generate sustained load
      const loadInterval = setInterval(() => {
        if (Date.now() - startTime > testDuration) {
          clearInterval(loadInterval);
          return;
        }

        const requestId = `load-req-${requestCount++}`;
        performanceMonitor.recordRequestStart(requestId);
        
        setTimeout(() => {
          performanceMonitor.recordRequestEnd(requestId, Math.random() > 0.05);
        }, Math.random() * 20);

        // Also simulate other activities
        if (requestCount % 10 === 0) {
          performanceMonitor.recordConnection('connect');
          performanceMonitor.recordResourceAccess(`resource-${requestCount}`, Math.random() * 100, Math.random() > 0.3);
          performanceMonitor.recordToolExecution(`tool-${requestCount % 5}`, Math.random() * 200, Math.random() > 0.1);
        }
      }, 10); // Every 10ms

      // Wait for load test to complete
      await new Promise(resolve => setTimeout(resolve, testDuration + 500));

      // Verify system handled the load
      const metricsCollector = monitoringSystem.getMetricsCollector();
      const finalMetrics = metricsCollector.getCurrentMetrics();
      
      expect(finalMetrics.requests.total).toBeGreaterThan(100);
      expect(finalMetrics.requests.rps).toBeGreaterThan(10);
      expect(finalMetrics.system.healthScore).toBeGreaterThan(50); // Should maintain reasonable health

      // Verify monitoring system is still responsive
      const status = await monitoringSystem.getStatus();
      expect(status.running).toBe(true);
      expect(status.uptime).toBeGreaterThan(testDuration);
    });
  });
});