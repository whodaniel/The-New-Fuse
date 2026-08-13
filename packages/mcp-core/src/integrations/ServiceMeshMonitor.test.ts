/**
 * Unit tests for Service Mesh Monitor
 */

import { ServiceMeshMonitor, ServiceMeshMonitorConfig, Alert } from './ServiceMeshMonitor.js';
import { ServiceMeshProvider } from './MCPServiceMesh.js';
import { ServiceHealth } from '../types/broker.js';
import { ServiceStatus } from '../types/common.js';

// Mock service mesh provider
class MockServiceMeshProvider implements ServiceMeshProvider {
  name = 'mock-monitor';
  version = '1.0.0';
  
  private services = new Map<string, any>();
  private available = true;

  async registerService(): Promise<string> { return 'mock-id'; }
  async unregisterService(): Promise<void> {}
  async discoverServices(): Promise<any[]> { return []; }
  async configureScaling(): Promise<void> {}
  async getScalingStatus() { return { currentInstances: 1, desiredInstances: 1, scalingEvents: [] }; }

  async getServiceHealth(serviceId: string): Promise<ServiceHealth> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    return service.health || {
      serviceId,
      status: ServiceStatus.ONLINE,
      uptime: 3600000,
      responseTime: 50,
      errorRate: 0.01,
      lastCheck: new Date(),
      score: 0.95
    };
  }

  async updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void> {
    const service = this.services.get(serviceId) || {};
    service.health = health;
    this.services.set(serviceId, service);
  }

  async getServiceMetrics(serviceId: string) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    return service.metrics || {
      serviceId,
      requests: { total: 1000, successful: 950, failed: 50, rps: 10 },
      responseTime: { average: 100, p50: 80, p95: 200, p99: 500 },
      connections: { active: 5, total: 100, errors: 2 },
      resources: { cpu: 0.5, memory: 0.6, networkIO: 1024 },
      timestamp: new Date()
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  // Test helpers
  setServiceHealth(serviceId: string, health: Partial<ServiceHealth>): void {
    const service = this.services.get(serviceId) || {};
    service.health = {
      serviceId,
      status: ServiceStatus.ONLINE,
      uptime: 3600000,
      responseTime: 50,
      errorRate: 0.01,
      lastCheck: new Date(),
      score: 0.95,
      ...health
    };
    this.services.set(serviceId, service);
  }

  setServiceMetrics(serviceId: string, metrics: any): void {
    const service = this.services.get(serviceId) || {};
    service.metrics = {
      serviceId,
      requests: { total: 1000, successful: 950, failed: 50, rps: 10 },
      responseTime: { average: 100, p50: 80, p95: 200, p99: 500 },
      connections: { active: 5, total: 100, errors: 2 },
      resources: { cpu: 0.5, memory: 0.6, networkIO: 1024 },
      timestamp: new Date(),
      ...metrics
    };
    this.services.set(serviceId, service);
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  addService(serviceId: string): void {
    this.services.set(serviceId, {});
  }

  clear(): void {
    this.services.clear();
  }
}

describe('ServiceMeshMonitor', () => {
  let monitor: ServiceMeshMonitor;
  let mockProvider: MockServiceMeshProvider;
  let config: ServiceMeshMonitorConfig;

  beforeEach(() => {
    mockProvider = new MockServiceMeshProvider();
    config = {
      healthCheckInterval: 1, // 1 second for testing
      metricsInterval: 1,
      healthCheckTimeout: 5000,
      maxConsecutiveFailures: 3,
      enablePerformanceMonitoring: true,
      enableAlerting: true,
      alertThresholds: {
        cpuThreshold: 0.8,
        memoryThreshold: 0.8,
        errorRateThreshold: 0.1,
        responseTimeThreshold: 200,
        healthScoreThreshold: 0.7
      },
      metricsRetention: 3600
    };

    monitor = new ServiceMeshMonitor(mockProvider, config);
  });

  afterEach(async () => {
    await monitor.cleanup();
    mockProvider.clear();
  });

  describe('startMonitoring', () => {
    it('should start monitoring successfully', async () => {
      const result = await monitor.startMonitoring();

      expect(result.success).toBe(true);
      expect(result.message).toContain('started successfully');
      expect(result.metadata?.healthCheckInterval).toBe(1);
      expect(result.metadata?.metricsInterval).toBe(1);
    });

    it('should not start monitoring if already running', async () => {
      await monitor.startMonitoring();
      const result = await monitor.startMonitoring();

      expect(result.success).toBe(false);
      expect(result.message).toContain('already running');
    });

    it('should emit monitoring-started event', async () => {
      const eventSpy = jest.fn();
      monitor.on('monitoring-started', eventSpy);

      await monitor.startMonitoring();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring successfully', async () => {
      await monitor.startMonitoring();
      const result = await monitor.stopMonitoring();

      expect(result.success).toBe(true);
      expect(result.message).toContain('stopped successfully');
    });

    it('should not stop monitoring if not running', async () => {
      const result = await monitor.stopMonitoring();

      expect(result.success).toBe(false);
      expect(result.message).toContain('not running');
    });

    it('should emit monitoring-stopped event', async () => {
      const eventSpy = jest.fn();
      monitor.on('monitoring-stopped', eventSpy);

      await monitor.startMonitoring();
      await monitor.stopMonitoring();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('addService', () => {
    beforeEach(() => {
      mockProvider.addService('test-service');
    });

    it('should add service to monitoring successfully', async () => {
      const result = await monitor.addService('test-service');

      expect(result.success).toBe(true);
      expect(result.message).toContain('added to monitoring');
      expect(result.metadata?.serviceId).toBe('test-service');
    });

    it('should not add service if already monitored', async () => {
      await monitor.addService('test-service');
      const result = await monitor.addService('test-service');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already being monitored');
    });

    it('should emit service-added event', async () => {
      const eventSpy = jest.fn();
      monitor.on('service-added', eventSpy);

      await monitor.addService('test-service');

      expect(eventSpy).toHaveBeenCalledWith('test-service');
    });

    it('should handle service not found error', async () => {
      const result = await monitor.addService('non-existent-service');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Service not found');
    });
  });

  describe('removeService', () => {
    beforeEach(async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
    });

    it('should remove service from monitoring successfully', async () => {
      const result = await monitor.removeService('test-service');

      expect(result.success).toBe(true);
      expect(result.message).toContain('removed from monitoring');
    });

    it('should not remove service if not monitored', async () => {
      const result = await monitor.removeService('non-monitored-service');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not being monitored');
    });

    it('should emit service-removed event', async () => {
      const eventSpy = jest.fn();
      monitor.on('service-removed', eventSpy);

      await monitor.removeService('test-service');

      expect(eventSpy).toHaveBeenCalledWith('test-service');
    });
  });

  describe('getServiceMonitoringData', () => {
    beforeEach(async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
    });

    it('should return monitoring data for existing service', () => {
      const data = monitor.getServiceMonitoringData('test-service');

      expect(data).toBeDefined();
      expect(data?.serviceId).toBe('test-service');
      expect(data?.health).toBeDefined();
      expect(data?.metrics).toBeDefined();
    });

    it('should return undefined for non-monitored service', () => {
      const data = monitor.getServiceMonitoringData('non-monitored-service');

      expect(data).toBeUndefined();
    });
  });

  describe('getMonitoredServices', () => {
    it('should return empty array when no services monitored', () => {
      const services = monitor.getMonitoredServices();

      expect(services).toEqual([]);
    });

    it('should return list of monitored services', async () => {
      mockProvider.addService('service-1');
      mockProvider.addService('service-2');
      
      await monitor.addService('service-1');
      await monitor.addService('service-2');

      const services = monitor.getMonitoredServices();

      expect(services).toHaveLength(2);
      expect(services).toContain('service-1');
      expect(services).toContain('service-2');
    });
  });

  describe('getStatistics', () => {
    it('should return monitoring statistics', async () => {
      mockProvider.addService('service-1');
      mockProvider.addService('service-2');
      
      await monitor.addService('service-1');
      await monitor.addService('service-2');

      const stats = monitor.getStatistics();

      expect(stats.totalServices).toBe(2);
      expect(stats.healthyServices).toBe(2);
      expect(stats.unhealthyServices).toBe(0);
      expect(stats.lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('getServicesByHealthStatus', () => {
    beforeEach(async () => {
      mockProvider.addService('healthy-service');
      mockProvider.addService('unhealthy-service');
      
      mockProvider.setServiceHealth('healthy-service', { status: ServiceStatus.ONLINE });
      mockProvider.setServiceHealth('unhealthy-service', { status: ServiceStatus.OFFLINE });
      
      await monitor.addService('healthy-service');
      await monitor.addService('unhealthy-service');
    });

    it('should return services by health status', () => {
      const healthyServices = monitor.getServicesByHealthStatus('online');
      const unhealthyServices = monitor.getServicesByHealthStatus('offline');

      expect(healthyServices).toContain('healthy-service');
      expect(unhealthyServices).toContain('unhealthy-service');
    });
  });

  describe('health monitoring', () => {
    beforeEach(async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
      await monitor.startMonitoring();
    });

    it('should emit health-check-completed event', (done) => {
      monitor.on('health-check-completed', (serviceId, health) => {
        expect(serviceId).toBe('test-service');
        expect(health).toBeDefined();
        done();
      });

      // Wait for health check to run
    }, 2000);

    it('should emit health-check-failed event when service fails', (done) => {
      mockProvider.setAvailable(false);

      monitor.on('health-check-failed', (serviceId, error) => {
        expect(serviceId).toBe('test-service');
        expect(error).toBeDefined();
        done();
      });

      // Wait for health check to run
    }, 2000);
  });

  describe('metrics collection', () => {
    beforeEach(async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
      await monitor.startMonitoring();
    });

    it('should emit metrics-collected event', (done) => {
      monitor.on('metrics-collected', (serviceId, metrics) => {
        expect(serviceId).toBe('test-service');
        expect(metrics).toBeDefined();
        expect(metrics.requests).toBeDefined();
        expect(metrics.responseTime).toBeDefined();
        done();
      });

      // Wait for metrics collection to run
    }, 2000);

    it('should emit metrics-collection-failed event when collection fails', (done) => {
      mockProvider.setAvailable(false);

      monitor.on('metrics-collection-failed', (serviceId, error) => {
        expect(serviceId).toBe('test-service');
        expect(error).toBeDefined();
        done();
      });

      // Wait for metrics collection to run
    }, 2000);
  });

  describe('alerting', () => {
    beforeEach(async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
    });

    it('should generate health score alert when below threshold', (done) => {
      mockProvider.setServiceHealth('test-service', { score: 0.5 }); // Below 0.7 threshold

      monitor.on('alert', (serviceId: string, alert: Alert) => {
        expect(serviceId).toBe('test-service');
        expect(alert.type).toBe('health');
        expect(alert.message).toContain('health score');
        expect(alert.triggerMetric?.name).toBe('health_score');
        done();
      });

      // Manually trigger health check
      monitor['performHealthCheck']('test-service');
    });

    it('should generate CPU alert when above threshold', (done) => {
      mockProvider.setServiceMetrics('test-service', {
        resources: { cpu: 0.9, memory: 0.5, networkIO: 1024 } // CPU above 0.8 threshold
      });

      monitor.on('alert', (serviceId: string, alert: Alert) => {
        expect(serviceId).toBe('test-service');
        expect(alert.type).toBe('resource');
        expect(alert.message).toContain('CPU utilization');
        expect(alert.triggerMetric?.name).toBe('cpu_utilization');
        done();
      });

      // Manually trigger metrics collection
      monitor['collectServiceMetrics']('test-service');
    });

    it('should generate error rate alert when above threshold', (done) => {
      mockProvider.setServiceMetrics('test-service', {
        requests: { total: 1000, successful: 800, failed: 200, rps: 10 } // 20% error rate
      });

      monitor.on('alert', (serviceId: string, alert: Alert) => {
        expect(serviceId).toBe('test-service');
        expect(alert.type).toBe('performance');
        expect(alert.message).toContain('error rate');
        expect(alert.triggerMetric?.name).toBe('error_rate');
        done();
      });

      // Manually trigger metrics collection
      monitor['collectServiceMetrics']('test-service');
    });
  });

  describe('getServicesInAlert', () => {
    beforeEach(async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
    });

    it('should return services in alert state', async () => {
      // Trigger an alert
      mockProvider.setServiceHealth('test-service', { score: 0.5 });
      await monitor['performHealthCheck']('test-service');

      const servicesInAlert = monitor.getServicesInAlert();

      expect(servicesInAlert).toHaveLength(1);
      expect(servicesInAlert[0].serviceId).toBe('test-service');
      expect(servicesInAlert[0].alerts.length).toBeGreaterThan(0);
    });

    it('should return empty array when no services in alert', () => {
      const servicesInAlert = monitor.getServicesInAlert();

      expect(servicesInAlert).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources', async () => {
      mockProvider.addService('test-service');
      await monitor.addService('test-service');
      await monitor.startMonitoring();

      expect(monitor.getMonitoredServices()).toHaveLength(1);

      await monitor.cleanup();

      expect(monitor.getMonitoredServices()).toHaveLength(0);
    });
  });
});