/**
 * Unit tests for MCP Service Mesh Integration
 */

import {
  AutoDiscoveryConfig,
  ScalingEvent,
  ServiceMeshMetrics,
  ServiceMeshQuery,
  ServiceMeshRegistration,
  ServiceScalingConfig,
} from '../interfaces/IMCPServiceMesh';
import { MCPServiceInfo, ServiceHealth } from '../types/broker';
import { ServiceStatus } from '../types/common';
import { MCPServiceMesh, ServiceMeshProvider } from './MCPServiceMesh';

// Mock service mesh provider
class MockServiceMeshProvider implements ServiceMeshProvider {
  name = 'mock';
  version = '1.0.0';

  private services = new Map<string, ServiceMeshRegistration>();
  private available = true;

  async registerService(registration: ServiceMeshRegistration): Promise<string> {
    if (!this.available) {
      throw new Error('Provider not available');
    }
    this.services.set(registration.serviceId, registration);
    return `mock-${registration.serviceId}`;
  }

  async unregisterService(serviceId: string): Promise<void> {
    if (!this.services.has(serviceId)) {
      throw new Error('Service not found');
    }
    this.services.delete(serviceId);
  }

  async discoverServices(query: ServiceMeshQuery): Promise<ServiceMeshRegistration[]> {
    const services = Array.from(this.services.values());

    if (query.serviceName) {
      return services.filter((s) => s.serviceName.includes(query.serviceName!));
    }

    if (query.tags) {
      return services.filter((s) => query.tags!.some((tag) => s.tags.includes(tag)));
    }

    return services;
  }

  async getServiceHealth(serviceId: string): Promise<ServiceHealth> {
    if (!this.services.has(serviceId)) {
      throw new Error('Service not found');
    }

    return {
      serviceId,
      status: ServiceStatus.ONLINE,
      uptime: 3600000,
      responseTime: 50,
      errorRate: 0.01,
      lastCheck: new Date(),
      score: 0.95,
    };
  }

  async updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void> {
    if (!this.services.has(serviceId)) {
      throw new Error('Service not found');
    }
    // Mock implementation - just validate the service exists
  }

  async getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics> {
    if (!this.services.has(serviceId)) {
      throw new Error('Service not found');
    }

    return {
      serviceId,
      requests: {
        total: 1000,
        successful: 950,
        failed: 50,
        rps: 10,
      },
      responseTime: {
        average: 100,
        p50: 80,
        p95: 200,
        p99: 500,
      },
      connections: {
        active: 5,
        total: 100,
        errors: 2,
      },
      resources: {
        cpu: 0.5,
        memory: 0.6,
        networkIO: 1024,
      },
      timestamp: new Date(),
    };
  }

  async configureScaling(serviceId: string, config: ServiceScalingConfig): Promise<void> {
    if (!this.services.has(serviceId)) {
      throw new Error('Service not found');
    }
    // Mock implementation
  }

  async getScalingStatus(serviceId: string): Promise<{
    currentInstances: number;
    desiredInstances: number;
    scalingEvents: ScalingEvent[];
  }> {
    if (!this.services.has(serviceId)) {
      throw new Error('Service not found');
    }

    return {
      currentInstances: 2,
      desiredInstances: 2,
      scalingEvents: [],
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  getRegisteredServices(): Map<string, ServiceMeshRegistration> {
    return new Map(this.services);
  }

  clear(): void {
    this.services.clear();
  }
}

describe('MCPServiceMesh', () => {
  let serviceMesh: MCPServiceMesh;
  let mockProvider: MockServiceMeshProvider;
  let mockMCPService: MCPServiceInfo;
  let mockMeshRegistration: ServiceMeshRegistration;

  beforeEach(() => {
    mockProvider = new MockServiceMeshProvider();
    serviceMesh = new MCPServiceMesh({
      provider: mockProvider,
      autoDiscovery: {
        autoRegister: false,
        autoDeregister: false,
      },
      healthMonitoring: {
        enabled: false,
        interval: 30,
        timeout: 5000,
      },
      metricsCollection: {
        enabled: false,
        interval: 60,
        retention: 3600,
      },
      scaling: {
        enabled: false,
      },
    });

    mockMCPService = {
      id: 'test-service-1',
      name: 'test-service',
      version: '1.0.0',
      endpoint: 'http://localhost:8080',
      capabilities: ['resource-access', 'tool-execution'],
      resources: [
        {
          name: 'test-resource',
          uri: 'test://resource',
          description: 'Test resource',
          handler: {} as any,
        },
      ],
      tools: [
        {
          name: 'test-tool',
          description: 'Test tool',
          inputSchema: { type: 'object' },
          handler: {} as any,
        },
      ],
      status: ServiceStatus.ONLINE,
      metadata: { test: 'value' },
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    mockMeshRegistration = {
      serviceId: 'test-service-1',
      serviceName: 'test-service',
      version: '1.0.0',
      endpoints: [
        {
          address: 'localhost',
          port: 8080,
          protocol: 'http',
        },
      ],
      metadata: { test: 'value' },
      healthCheck: {
        path: '/health',
        interval: 30,
        timeout: 5000,
        failureThreshold: 3,
        successThreshold: 1,
      },
      loadBalancing: {
        algorithm: 'round_robin',
        healthCheckEnabled: true,
      },
      tags: ['mcp-service', 'test'],
    };
  });

  afterEach(async () => {
    await serviceMesh.cleanup();
    mockProvider.clear();
  });

  describe('registerService', () => {
    it('should successfully register an MCP service with the service mesh', async () => {
      const result = await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      expect(result.success).toBe(true);
      expect(result.meshServiceId).toBe('mock-test-service-1');
      expect(result.message).toContain('successfully registered');

      const registeredServices = mockProvider.getRegisteredServices();
      expect(registeredServices.has('test-service-1')).toBe(true);
    });

    it('should enhance mesh configuration with MCP service information', async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      const registeredServices = mockProvider.getRegisteredServices();
      const registration = registeredServices.get('test-service-1');

      expect(registration).toBeDefined();
      expect(registration!.metadata.mcpCapabilities).toEqual(['resource-access', 'tool-execution']);
      expect(registration!.metadata.mcpResources).toEqual(['test-resource']);
      expect(registration!.metadata.mcpTools).toEqual(['test-tool']);
      expect(registration!.tags).toContain('mcp-service');
      expect(registration!.tags).toContain('capability-resource-access');
      expect(registration!.tags).toContain('capability-tool-execution');
    });

    it('should handle registration failure when provider is unavailable', async () => {
      mockProvider.setAvailable(false);

      const result = await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('not available');
    });

    it('should emit service-registered event on successful registration', async () => {
      const eventSpy = jest.fn();
      serviceMesh.on('service-registered', eventSpy);

      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      expect(eventSpy).toHaveBeenCalledWith('test-service-1');
    });
  });

  describe('unregisterService', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should successfully unregister a service from the service mesh', async () => {
      const result = await serviceMesh.unregisterService('test-service-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully unregistered');

      const registeredServices = mockProvider.getRegisteredServices();
      expect(registeredServices.has('test-service-1')).toBe(false);
    });

    it('should handle unregistration of non-existent service', async () => {
      const result = await serviceMesh.unregisterService('non-existent-service');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('not registered');
    });

    it('should emit service-unregistered event on successful unregistration', async () => {
      const eventSpy = jest.fn();
      serviceMesh.on('service-unregistered', eventSpy);

      await serviceMesh.unregisterService('test-service-1');

      expect(eventSpy).toHaveBeenCalledWith('test-service-1');
    });
  });

  describe('discoverServices', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should discover services with MCP-specific filters', async () => {
      const query: ServiceMeshQuery = {
        serviceName: 'test-service',
      };

      const services = await serviceMesh.discoverServices(query);

      expect(services).toHaveLength(1);
      expect(services[0].serviceName).toBe('test-service');
    });

    it('should discover services by tags', async () => {
      const query: ServiceMeshQuery = {
        tags: ['mcp-service'],
      };

      const services = await serviceMesh.discoverServices(query);

      expect(services).toHaveLength(1);
      expect(services[0].tags).toContain('mcp-service');
    });

    it('should return empty array when no services match query', async () => {
      const query: ServiceMeshQuery = {
        serviceName: 'non-existent-service',
      };

      const services = await serviceMesh.discoverServices(query);

      expect(services).toHaveLength(0);
    });
  });

  describe('getServiceHealth', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should get service health from the service mesh', async () => {
      const health = await serviceMesh.getServiceHealth('test-service-1');

      expect(health.serviceId).toBe('test-service-1');
      expect(health.status).toBe(ServiceStatus.ONLINE);
      expect(health.score).toBe(0.95);
    });

    it('should throw error for non-existent service', async () => {
      await expect(serviceMesh.getServiceHealth('non-existent-service')).rejects.toThrow(
        'Failed to get health'
      );
    });
  });

  describe('updateServiceHealth', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should update service health in the service mesh', async () => {
      const health: ServiceHealth = {
        serviceId: 'test-service-1',
        status: ServiceStatus.DEGRADED,
        uptime: 1800000,
        responseTime: 100,
        errorRate: 0.05,
        lastCheck: new Date(),
        score: 0.8,
      };

      const result = await serviceMesh.updateServiceHealth('test-service-1', health);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Health status updated');
      expect(result.metadata?.healthStatus).toBe(ServiceStatus.DEGRADED);
      expect(result.metadata?.healthScore).toBe(0.8);
    });
  });

  describe('getServiceMetrics', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should get service metrics from the service mesh', async () => {
      const metrics = await serviceMesh.getServiceMetrics('test-service-1');

      expect(metrics.serviceId).toBe('test-service-1');
      expect(metrics.requests.total).toBe(1000);
      expect(metrics.requests.successful).toBe(950);
      expect(metrics.responseTime.average).toBe(100);
      expect(metrics.connections.active).toBe(5);
      expect(metrics.resources.cpu).toBe(0.5);
    });

    it('should throw error for non-existent service', async () => {
      await expect(serviceMesh.getServiceMetrics('non-existent-service')).rejects.toThrow(
        'Failed to get metrics'
      );
    });
  });

  describe('configureScaling', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should configure service scaling', async () => {
      const scalingConfig: ServiceScalingConfig = {
        minInstances: 1,
        maxInstances: 5,
        targetCPU: 0.7,
        targetMemory: 0.8,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600,
        policies: [
          {
            name: 'cpu-policy',
            metric: 'cpu',
            targetValue: 0.7,
            scaleUpThreshold: 0.8,
            scaleDownThreshold: 0.5,
          },
        ],
      };

      const result = await serviceMesh.configureScaling('test-service-1', scalingConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Scaling configured');
      expect(result.metadata?.minInstances).toBe(1);
      expect(result.metadata?.maxInstances).toBe(5);
      expect(result.metadata?.policies).toBe(1);
    });
  });

  describe('getScalingStatus', () => {
    beforeEach(async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);
    });

    it('should get service scaling status', async () => {
      const status = await serviceMesh.getScalingStatus('test-service-1');

      expect(status.currentInstances).toBe(2);
      expect(status.desiredInstances).toBe(2);
      expect(Array.isArray(status.scalingEvents)).toBe(true);
    });

    it('should throw error for non-existent service', async () => {
      await expect(serviceMesh.getScalingStatus('non-existent-service')).rejects.toThrow(
        'Failed to get scaling status'
      );
    });
  });

  describe('enableAutoDiscovery', () => {
    it('should enable auto-discovery with configuration', async () => {
      const config: AutoDiscoveryConfig = {
        autoRegister: true,
        autoDeregister: true,
        serviceNamePrefix: 'mcp-',
        defaultTags: ['auto-discovered'],
        defaultMetadata: { source: 'auto-discovery' },
      };

      const result = await serviceMesh.enableAutoDiscovery(config);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Auto-discovery enabled');
      expect(result.metadata?.autoRegister).toBe(true);
      expect(result.metadata?.autoDeregister).toBe(true);

      const status = await serviceMesh.getIntegrationStatus();
      expect(status.config.autoDiscoveryEnabled).toBe(true);
    });
  });

  describe('disableAutoDiscovery', () => {
    it('should disable auto-discovery', async () => {
      // First enable auto-discovery
      await serviceMesh.enableAutoDiscovery({
        autoRegister: true,
        autoDeregister: true,
      });

      const result = await serviceMesh.disableAutoDiscovery();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Auto-discovery disabled');

      const status = await serviceMesh.getIntegrationStatus();
      expect(status.config.autoDiscoveryEnabled).toBe(false);
    });
  });

  describe('getIntegrationStatus', () => {
    it('should return current integration status', async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      const status = await serviceMesh.getIntegrationStatus();

      expect(status.enabled).toBe(true);
      expect(status.meshType).toBe('mock');
      expect(status.connectedServices).toBe(1);
      expect(status.health).toBe('healthy');
      expect(status.metrics.totalRegistrations).toBe(1);
      expect(status.config.autoDiscoveryEnabled).toBe(false);
      expect(status.config.healthMonitoringEnabled).toBe(false);
      expect(status.config.scalingEnabled).toBe(false);
    });

    it('should show unhealthy status when provider is unavailable', async () => {
      mockProvider.setAvailable(false);

      const status = await serviceMesh.getIntegrationStatus();

      expect(status.health).toBe('unhealthy');
    });
  });

  describe('cleanup', () => {
    it('should cleanup all resources and unregister services', async () => {
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      expect(mockProvider.getRegisteredServices().size).toBe(1);

      await serviceMesh.cleanup();

      expect(mockProvider.getRegisteredServices().size).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should emit health-check events during monitoring', async () => {
      const healthCheckSpy = jest.fn();
      serviceMesh.on('health-check', healthCheckSpy);

      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      // Simulate health check event
      serviceMesh.emit('health-check', 'test-service-1', {
        serviceId: 'test-service-1',
        status: ServiceStatus.ONLINE,
        uptime: 3600000,
        responseTime: 50,
        errorRate: 0.01,
        lastCheck: new Date(),
        score: 0.95,
      });

      expect(healthCheckSpy).toHaveBeenCalledWith('test-service-1', expect.any(Object));
    });

    it('should emit scaling-event when scaling occurs', async () => {
      const scalingEventSpy = jest.fn();
      serviceMesh.on('scaling-event', scalingEventSpy);

      const scalingEvent: ScalingEvent = {
        timestamp: new Date(),
        type: 'scale_up',
        previousInstances: 1,
        newInstances: 2,
        reason: 'CPU threshold exceeded',
        triggerMetric: {
          name: 'cpu',
          value: 0.85,
          threshold: 0.8,
        },
      };

      serviceMesh.emit('scaling-event', scalingEvent);

      expect(scalingEventSpy).toHaveBeenCalledWith(scalingEvent);
    });
  });
});
