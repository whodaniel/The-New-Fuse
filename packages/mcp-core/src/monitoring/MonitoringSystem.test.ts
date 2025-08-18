/**
 * Monitoring System Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MonitoringSystem } from './MonitoringSystem';
import { MonitoringConfig } from '../types/monitoring';
import { Logger } from '../utils/Logger';

describe('MonitoringSystem', () => {
  let monitoringSystem: MonitoringSystem;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestMonitoringSystem');
    monitoringSystem = new MonitoringSystem(logger);
  });

  afterEach(async () => {
    if (monitoringSystem) {
      await monitoringSystem.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: true,
        alertInterval: 60000,
        enableDashboards: true,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);

      const status = await monitoringSystem.getStatus();
      expect(status.running).toBe(true);
      expect(status.components.metricsCollector).toBe(true);
      expect(status.components.alertManager).toBe(true);
      expect(status.components.dashboardManager).toBe(true);
    });

    it('should handle disabled monitoring', async () => {
      const config: MonitoringConfig = {
        enabled: false,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: false,
        alertInterval: 60000,
        enableDashboards: false,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);

      const status = await monitoringSystem.getStatus();
      expect(status.running).toBe(false);
    });

    it('should throw error when accessing components before initialization', () => {
      expect(() => monitoringSystem.getMetricsCollector()).toThrow('Monitoring system not initialized');
      expect(() => monitoringSystem.getAlertManager()).toThrow('Monitoring system not initialized');
      expect(() => monitoringSystem.getDashboardManager()).toThrow('Monitoring system not initialized');
    });
  });

  describe('Component Access', () => {
    beforeEach(async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: true,
        alertInterval: 60000,
        enableDashboards: true,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);
    });

    it('should provide access to metrics collector', () => {
      const metricsCollector = monitoringSystem.getMetricsCollector();
      expect(metricsCollector).toBeDefined();
      expect(typeof metricsCollector.getCurrentMetrics).toBe('function');
    });

    it('should provide access to alert manager', () => {
      const alertManager = monitoringSystem.getAlertManager();
      expect(alertManager).toBeDefined();
      expect(typeof alertManager.getActiveAlerts).toBe('function');
    });

    it('should provide access to dashboard manager', () => {
      const dashboardManager = monitoringSystem.getDashboardManager();
      expect(dashboardManager).toBeDefined();
      expect(typeof dashboardManager.listDashboards).toBe('function');
    });

    it('should provide access to performance monitor', () => {
      const performanceMonitor = monitoringSystem.getPerformanceMonitor();
      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor.getCurrentMetrics).toBe('function');
    });

    it('should provide access to load tester', () => {
      const loadTester = monitoringSystem.getLoadTester();
      expect(loadTester).toBeDefined();
      expect(typeof loadTester.runLoadTest).toBe('function');
    });

    it('should provide access to cache monitor', () => {
      const cacheMonitor = monitoringSystem.getCacheMonitor();
      expect(cacheMonitor).toBeDefined();
      expect(typeof cacheMonitor.getCacheMetrics).toBe('function');
    });

    it('should provide access to connection pool monitor', () => {
      const connectionPoolMonitor = monitoringSystem.getConnectionPoolMonitor();
      expect(connectionPoolMonitor).toBeDefined();
      expect(typeof connectionPoolMonitor.getPoolMetrics).toBe('function');
    });

    it('should provide access to system health monitor', () => {
      const systemHealthMonitor = monitoringSystem.getSystemHealthMonitor();
      expect(systemHealthMonitor).toBeDefined();
      expect(typeof systemHealthMonitor.getHealthStatus).toBe('function');
    });
  });

  describe('Metrics Export', () => {
    beforeEach(async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: true,
        alertInterval: 60000,
        enableDashboards: true,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);
    });

    it('should export metrics in JSON format', async () => {
      const jsonMetrics = await monitoringSystem.exportMetrics('json');
      expect(jsonMetrics).toBeDefined();
      
      const parsed = JSON.parse(jsonMetrics);
      expect(parsed).toHaveProperty('requests');
      expect(parsed).toHaveProperty('connections');
      expect(parsed).toHaveProperty('resources');
      expect(parsed).toHaveProperty('tools');
      expect(parsed).toHaveProperty('system');
    });

    it('should export metrics in Prometheus format', async () => {
      const prometheusMetrics = await monitoringSystem.exportMetrics('prometheus');
      expect(prometheusMetrics).toBeDefined();
      expect(prometheusMetrics).toContain('mcp_requests_total');
      expect(prometheusMetrics).toContain('mcp_connections_active');
      expect(prometheusMetrics).toContain('mcp_health_score');
    });

    it('should throw error for unsupported export format', async () => {
      await expect(monitoringSystem.exportMetrics('xml' as any)).rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: true,
        alertInterval: 60000,
        enableDashboards: true,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);
    });

    it('should forward metrics collected events', (done) => {
      monitoringSystem.on('metricsCollected', (metrics) => {
        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('requests');
        done();
      });

      // Trigger metrics collection
      const metricsCollector = monitoringSystem.getMetricsCollector();
      metricsCollector.emit('metricsCollected', {
        requests: { total: 0, successful: 0, failed: 0, rps: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0 },
        connections: { active: 0, total: 0, failed: 0, avgConnectionTime: 0 },
        resources: { total: 0, accessCount: 0, cacheHitRate: 0, avgReadTime: 0 },
        tools: { total: 0, executionCount: 0, avgExecutionTime: 0, successRate: 0 },
        system: { memoryUsage: 0, cpuUsage: 0, uptime: 0, healthScore: 100 }
      });
    });

    it('should forward performance update events', (done) => {
      monitoringSystem.on('performanceUpdate', (metrics) => {
        expect(metrics).toBeDefined();
        done();
      });

      // Trigger performance update
      const performanceMonitor = monitoringSystem.getPerformanceMonitor();
      performanceMonitor.emit('performanceUpdate', {});
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: true,
        alertInterval: 60000,
        enableDashboards: true,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);
      
      let shutdownEventEmitted = false;
      monitoringSystem.on('shutdown', () => {
        shutdownEventEmitted = true;
      });

      await monitoringSystem.shutdown();

      const status = await monitoringSystem.getStatus();
      expect(status.running).toBe(false);
      expect(shutdownEventEmitted).toBe(true);
    });

    it('should handle shutdown when not running', async () => {
      // Should not throw error
      await expect(monitoringSystem.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Status Reporting', () => {
    it('should report correct status when not initialized', async () => {
      const status = await monitoringSystem.getStatus();
      expect(status.running).toBe(false);
      expect(status.uptime).toBe(0);
      expect(Object.values(status.components).every(c => c === false)).toBe(true);
    });

    it('should report correct status when initialized', async () => {
      const config: MonitoringConfig = {
        enabled: true,
        metricsInterval: 30000,
        retentionPeriod: 24 * 60 * 60 * 1000,
        enableAlerting: true,
        alertInterval: 60000,
        enableDashboards: true,
        dashboardRefreshInterval: 30000,
        storage: {
          type: 'memory'
        }
      };

      await monitoringSystem.initialize(config);

      const status = await monitoringSystem.getStatus();
      expect(status.running).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.components.metricsCollector).toBe(true);
      expect(status.components.alertManager).toBe(true);
      expect(status.components.dashboardManager).toBe(true);
    });
  });
});