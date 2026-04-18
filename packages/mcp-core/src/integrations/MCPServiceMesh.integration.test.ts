/**
 * Integration tests for MCP Service Mesh Integration
 */

import { MCPServiceMesh } from './MCPServiceMesh.js';
import { KubernetesServiceMeshProvider } from './providers/KubernetesServiceMeshProvider.js';
import { MCPServiceInfo, ServiceHealth } from '../types/broker.js';
import { ServiceStatus } from '../types/common.js';
import {
  ServiceMeshRegistration,
  ServiceScalingConfig,
  AutoDiscoveryConfig
} from '../interfaces/IMCPServiceMesh.js';

describe('MCPServiceMesh Integration Tests', () => {
  let serviceMesh: MCPServiceMesh;
  let kubernetesProvider: KubernetesServiceMeshProvider;
  let mockMCPService: MCPServiceInfo;
  let mockMeshRegistration: ServiceMeshRegistration;

  beforeAll(() => {
    // Initialize Kubernetes provider with test configuration
    kubernetesProvider = new KubernetesServiceMeshProvider({
      apiServer: 'https://test-k8s-api:6443',
      namespace: 'mcp-test',
      token: 'test-token',
      meshType: 'istio',
      defaultLabels: {
        'app.kubernetes.io/managed-by': 'mcp-service-mesh'
      },
      defaultAnnotations: {
        'mcp.io/managed': 'true'
      }
    });

    serviceMesh = new MCPServiceMesh({
      provider: kubernetesProvider,
      autoDiscovery: {
        autoRegister: true,
        autoDeregister: true,
        serviceNamePrefix: 'mcp-',
        defaultTags: ['mcp-service', 'auto-discovered'],
        defaultMetadata: {
          source: 'mcp-auto-discovery',
          version: '1.0.0'
        },
        defaultHealthCheck: {
          path: '/health',
          interval: 30,
          timeout: 5000,
          failureThreshold: 3,
          successThreshold: 1
        },
        defaultLoadBalancing: {
          algorithm: 'round_robin',
          healthCheckEnabled: true
        }
      },
      healthMonitoring: {
        enabled: true,
        interval: 30,
        timeout: 5000
      },
      metricsCollection: {
        enabled: true,
        interval: 60,
        retention: 3600
      },
      scaling: {
        enabled: true,
        defaultConfig: {
          minInstances: 1,
          maxInstances: 10,
          targetCPU: 0.7,
          scaleUpCooldown: 300,
          scaleDownCooldown: 600
        }
      }
    });

    mockMCPService = {
      id: 'integration-test-service',
      name: 'integration-test-service',
      version: '1.0.0',
      endpoint: 'http://integration-test-service:8080',
      capabilities: ['resource-access', 'tool-execution', 'workflow-integration'],
      resources: [
        {
          name: 'test-resource',
          uri: 'test://resource/1',
          description: 'Integration test resource',
          handler: {} as any
        },
        {
          name: 'config-resource',
          uri: 'config://app/settings',
          description: 'Application configuration resource',
          handler: {} as any
        }
      ],
      tools: [
        {
          name: 'data-processor',
          description: 'Process data with various algorithms',
          inputSchema: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              algorithm: { type: 'string', enum: ['sort', 'filter', 'transform'] }
            },
            required: ['data', 'algorithm']
          },
          handler: {} as any
        }
      ],
      status: ServiceStatus.ONLINE,
      metadata: {
        environment: 'test',
        team: 'platform',
        criticality: 'high'
      },
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      healthScore: 0.95,
      tags: ['integration-test', 'platform-service']
    };

    mockMeshRegistration = {
      serviceId: 'integration-test-service',
      serviceName: 'integration-test-service',
      version: '1.0.0',
      endpoints: [
        {
          address: 'integration-test-service',
          port: 8080,
          protocol: 'http',
          weight: 100,
          metadata: {
            primary: true
          }
        },
        {
          address: 'integration-test-service',
          port: 9090,
          protocol: 'http',
          weight: 0,
          metadata: {
            metrics: true
          }
        }
      ],
      metadata: {
        environment: 'test',
        team: 'platform',
        criticality: 'high',
        deployment: 'blue-green'
      },
      healthCheck: {
        path: '/health',
        interval: 30,
        timeout: 5000,
        failureThreshold: 3,
        successThreshold: 1,
        method: 'GET',
        expectedStatusCodes: [200, 204]
      },
      loadBalancing: {
        algorithm: 'round_robin',
        sessionAffinity: false,
        healthCheckEnabled: true,
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 30000,
          halfOpenMaxCalls: 3,
          minRequestThreshold: 10
        }
      },
      tags: ['mcp-service', 'integration-test', 'platform-service', 'high-availability']
    };
  });

  afterAll(async () => {
    await serviceMesh.cleanup();
  });

  describe('End-to-End Service Registration and Management', () => {
    it('should register, monitor, and manage a complete MCP service lifecycle', async () => {
      // Step 1: Register the service
      const registrationResult = await serviceMesh.registerService(
        mockMCPService,
        mockMeshRegistration
      );

      expect(registrationResult.success).toBe(true);
      expect(registrationResult.meshServiceId).toBeDefined();
      expect(registrationResult.message).toContain('successfully registered');

      // Step 2: Verify service discovery
      const discoveredServices = await serviceMesh.discoverServices({
        serviceName: 'integration-test-service'
      });

      expect(discoveredServices).toHaveLength(1);
      expect(discoveredServices[0].serviceName).toBe('integration-test-service');
      expect(discoveredServices[0].tags).toContain('mcp-service');
      expect(discoveredServices[0].tags).toContain('capability-resource-access');
      expect(discoveredServices[0].tags).toContain('capability-tool-execution');

      // Step 3: Check service health
      const health = await serviceMesh.getServiceHealth('integration-test-service');

      expect(health.serviceId).toBe('integration-test-service');
      expect(health.status).toBe(ServiceStatus.ONLINE);
      expect(health.score).toBeGreaterThan(0);

      // Step 4: Get service metrics
      const metrics = await serviceMesh.getServiceMetrics('integration-test-service');

      expect(metrics.serviceId).toBe('integration-test-service');
      expect(metrics.requests).toBeDefined();
      expect(metrics.responseTime).toBeDefined();
      expect(metrics.connections).toBeDefined();
      expect(metrics.resources).toBeDefined();

      // Step 5: Configure scaling
      const scalingConfig: ServiceScalingConfig = {
        minInstances: 2,
        maxInstances: 8,
        targetCPU: 0.75,
        targetMemory: 0.8,
        targetRPS: 100,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600,
        policies: [
          {
            name: 'cpu-scaling',
            metric: 'cpu',
            targetValue: 0.75,
            scaleUpThreshold: 0.85,
            scaleDownThreshold: 0.6
          },
          {
            name: 'memory-scaling',
            metric: 'memory',
            targetValue: 0.8,
            scaleUpThreshold: 0.9,
            scaleDownThreshold: 0.7
          },
          {
            name: 'rps-scaling',
            metric: 'rps',
            targetValue: 100,
            scaleUpThreshold: 120,
            scaleDownThreshold: 80
          }
        ]
      };

      const scalingResult = await serviceMesh.configureScaling(
        'integration-test-service',
        scalingConfig
      );

      expect(scalingResult.success).toBe(true);
      expect(scalingResult.metadata?.minInstances).toBe(2);
      expect(scalingResult.metadata?.maxInstances).toBe(8);
      expect(scalingResult.metadata?.policies).toBe(3);

      // Step 6: Check scaling status
      const scalingStatus = await serviceMesh.getScalingStatus('integration-test-service');

      expect(scalingStatus.currentInstances).toBeGreaterThan(0);
      expect(scalingStatus.desiredInstances).toBeGreaterThan(0);
      expect(Array.isArray(scalingStatus.scalingEvents)).toBe(true);

      // Step 7: Update service health
      const updatedHealth: ServiceHealth = {
        serviceId: 'integration-test-service',
        status: ServiceStatus.DEGRADED,
        uptime: 1800000,
        responseTime: 150,
        errorRate: 0.05,
        lastCheck: new Date(),
        score: 0.75,
        details: {
          reason: 'High response time detected',
          affectedEndpoints: ['http://integration-test-service:8080']
        }
      };

      const healthUpdateResult = await serviceMesh.updateServiceHealth(
        'integration-test-service',
        updatedHealth
      );

      expect(healthUpdateResult.success).toBe(true);
      expect(healthUpdateResult.metadata?.healthStatus).toBe(ServiceStatus.DEGRADED);
      expect(healthUpdateResult.metadata?.healthScore).toBe(0.75);

      // Step 8: Verify updated health
      const updatedHealthCheck = await serviceMesh.getServiceHealth('integration-test-service');
      expect(updatedHealthCheck.status).toBe(ServiceStatus.DEGRADED);

      // Step 9: Unregister the service
      const unregistrationResult = await serviceMesh.unregisterService('integration-test-service');

      expect(unregistrationResult.success).toBe(true);
      expect(unregistrationResult.message).toContain('successfully unregistered');

      // Step 10: Verify service is no longer discoverable
      const servicesAfterUnregistration = await serviceMesh.discoverServices({
        serviceName: 'integration-test-service'
      });

      expect(servicesAfterUnregistration).toHaveLength(0);
    });
  });

  describe('Auto-Discovery Integration', () => {
    it('should handle auto-discovery configuration and lifecycle', async () => {
      // Test enabling auto-discovery
      const autoDiscoveryConfig: AutoDiscoveryConfig = {
        autoRegister: true,
        autoDeregister: true,
        serviceNamePrefix: 'mcp-auto-',
        defaultTags: ['auto-discovered', 'managed'],
        defaultMetadata: {
          source: 'auto-discovery',
          managedBy: 'mcp-service-mesh',
          discoveryVersion: '1.0.0'
        },
        defaultHealthCheck: {
          path: '/health',
          interval: 30,
          timeout: 5000,
          failureThreshold: 3,
          successThreshold: 1,
          method: 'GET'
        },
        defaultLoadBalancing: {
          algorithm: 'least_connections',
          sessionAffinity: true,
          healthCheckEnabled: true
        }
      };

      const enableResult = await serviceMesh.enableAutoDiscovery(autoDiscoveryConfig);

      expect(enableResult.success).toBe(true);
      expect(enableResult.metadata?.autoRegister).toBe(true);
      expect(enableResult.metadata?.autoDeregister).toBe(true);

      // Verify auto-discovery is enabled in status
      let status = await serviceMesh.getIntegrationStatus();
      expect(status.config.autoDiscoveryEnabled).toBe(true);

      // Test disabling auto-discovery
      const disableResult = await serviceMesh.disableAutoDiscovery();

      expect(disableResult.success).toBe(true);

      // Verify auto-discovery is disabled in status
      status = await serviceMesh.getIntegrationStatus();
      expect(status.config.autoDiscoveryEnabled).toBe(false);
    });
  });

  describe('Multi-Service Discovery and Management', () => {
    const services: Array<{ mcp: MCPServiceInfo; mesh: ServiceMeshRegistration }> = [];

    beforeAll(() => {
      // Create multiple test services
      for (let i = 1; i <= 3; i++) {
        services.push({
          mcp: {
            ...mockMCPService,
            id: `multi-service-${i}`,
            name: `multi-service-${i}`,
            endpoint: `http://multi-service-${i}:8080`,
            capabilities: i === 1 ? ['resource-access'] : i === 2 ? ['tool-execution'] : ['workflow-integration'],
            tags: [`service-${i}`, 'multi-test']
          },
          mesh: {
            ...mockMeshRegistration,
            serviceId: `multi-service-${i}`,
            serviceName: `multi-service-${i}`,
            endpoints: [{
              address: `multi-service-${i}`,
              port: 8080,
              protocol: 'http'
            }],
            tags: [`service-${i}`, 'multi-test', 'mcp-service']
          }
        });
      }
    });

    it('should register and manage multiple services simultaneously', async () => {
      // Register all services
      const registrationPromises = services.map(({ mcp, mesh }) =>
        serviceMesh.registerService(mcp, mesh)
      );

      const registrationResults = await Promise.all(registrationPromises);

      // Verify all registrations succeeded
      registrationResults.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.meshServiceId).toContain(`multi-service-${index + 1}`);
      });

      // Test service discovery with different filters
      const allServices = await serviceMesh.discoverServices({
        tags: ['multi-test']
      });
      expect(allServices).toHaveLength(3);

      const resourceServices = await serviceMesh.discoverServices({
        tags: ['capability-resource-access']
      });
      expect(resourceServices).toHaveLength(1);
      expect(resourceServices[0].serviceName).toBe('multi-service-1');

      const toolServices = await serviceMesh.discoverServices({
        tags: ['capability-tool-execution']
      });
      expect(toolServices).toHaveLength(1);
      expect(toolServices[0].serviceName).toBe('multi-service-2');

      // Test health monitoring for all services
      const healthPromises = services.map(({ mcp }) =>
        serviceMesh.getServiceHealth(mcp.id)
      );

      const healthResults = await Promise.all(healthPromises);

      healthResults.forEach((health, index) => {
        expect(health.serviceId).toBe(`multi-service-${index + 1}`);
        expect(health.status).toBe(ServiceStatus.ONLINE);
      });

      // Test metrics collection for all services
      const metricsPromises = services.map(({ mcp }) =>
        serviceMesh.getServiceMetrics(mcp.id)
      );

      const metricsResults = await Promise.all(metricsPromises);

      metricsResults.forEach((metrics, index) => {
        expect(metrics.serviceId).toBe(`multi-service-${index + 1}`);
        expect(metrics.requests).toBeDefined();
        expect(metrics.responseTime).toBeDefined();
      });

      // Cleanup - unregister all services
      const unregistrationPromises = services.map(({ mcp }) =>
        serviceMesh.unregisterService(mcp.id)
      );

      const unregistrationResults = await Promise.all(unregistrationPromises);

      unregistrationResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all services are unregistered
      const servicesAfterCleanup = await serviceMesh.discoverServices({
        tags: ['multi-test']
      });
      expect(servicesAfterCleanup).toHaveLength(0);
    });
  });

  describe('Integration Status and Monitoring', () => {
    it('should provide comprehensive integration status', async () => {
      // Register a service for testing
      await serviceMesh.registerService(mockMCPService, mockMeshRegistration);

      const status = await serviceMesh.getIntegrationStatus();

      expect(status.enabled).toBe(true);
      expect(status.meshType).toBe('kubernetes');
      expect(status.connectedServices).toBe(1);
      expect(status.health).toBe('healthy');
      expect(status.lastSync).toBeInstanceOf(Date);

      expect(status.metrics).toBeDefined();
      expect(status.metrics.totalRegistrations).toBeGreaterThan(0);
      expect(status.metrics.failedRegistrations).toBeGreaterThanOrEqual(0);

      expect(status.config).toBeDefined();
      expect(status.config.autoDiscoveryEnabled).toBe(true);
      expect(status.config.healthMonitoringEnabled).toBe(true);
      expect(status.config.scalingEnabled).toBe(true);

      // Cleanup
      await serviceMesh.unregisterService('integration-test-service');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle provider failures gracefully', async () => {
      // This test would require mocking provider failures
      // For now, we'll test basic error scenarios

      // Test registration with invalid service
      const invalidService = {
        ...mockMCPService,
        id: '', // Invalid empty ID
        name: ''
      };

      const result = await serviceMesh.registerService(invalidService, mockMeshRegistration);

      // The result should indicate failure but not throw
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle concurrent operations correctly', async () => {
      const concurrentServices = Array.from({ length: 5 }, (_, i) => ({
        mcp: {
          ...mockMCPService,
          id: `concurrent-service-${i}`,
          name: `concurrent-service-${i}`
        },
        mesh: {
          ...mockMeshRegistration,
          serviceId: `concurrent-service-${i}`,
          serviceName: `concurrent-service-${i}`
        }
      }));

      // Register all services concurrently
      const registrationPromises = concurrentServices.map(({ mcp, mesh }) =>
        serviceMesh.registerService(mcp, mesh)
      );

      const results = await Promise.allSettled(registrationPromises);

      // Most should succeed (depending on provider limitations)
      const successfulRegistrations = results.filter(
        result => result.status === 'fulfilled' && result.value.success
      );

      expect(successfulRegistrations.length).toBeGreaterThan(0);

      // Cleanup successful registrations
      const cleanupPromises = concurrentServices
        .filter((_, index) => 
          results[index].status === 'fulfilled' && 
          (results[index] as PromiseFulfilledResult<any>).value.success
        )
        .map(({ mcp }) => serviceMesh.unregisterService(mcp.id));

      await Promise.allSettled(cleanupPromises);
    });
  });
});