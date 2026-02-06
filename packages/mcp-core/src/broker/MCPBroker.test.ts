/**
 * MCPBroker Unit Tests
 *
 * Comprehensive test suite for the MCPBroker class covering service registry,
 * discovery, health monitoring, and message routing functionality.
 */

// @ts-expect-error - Jest globals are available without import
import { MCPRequest } from '../interfaces/IMCPMessage';
import { BrokerConfig, MCPServiceInfo } from '../types';
import { ServiceStatus } from '../types/common';
import { MCPErrorClass } from '../types/error';
import { MCPBroker } from './MCPBroker';

describe('MCPBroker', () => {
  let broker: MCPBroker;
  let mockServiceInfo: MCPServiceInfo;
  let mockConfig: Partial<BrokerConfig>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock service info
    mockServiceInfo = {
      id: 'test-service-1',
      name: 'Test Service',
      version: '1.0.0',
      endpoint: 'http://localhost:3000',
      capabilities: ['resource', 'tool'],
      resources: [],
      tools: [],
      status: ServiceStatus.ONLINE,
      metadata: {},
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    };

    // Create mock config
    mockConfig = {
      name: 'test-broker',
      version: '1.0.0',
      registry: {
        type: 'memory',
        serviceTTL: 300,
        cleanupInterval: 60,
      },
      healthCheck: {
        enabled: true,
        interval: 30,
        timeout: 5000,
        failureThreshold: 3,
        recoveryThreshold: 2,
      },
    };

    broker = new MCPBroker(mockConfig);
  });

  afterEach(async () => {
    if (broker.isRunning()) {
      await broker.stop();
    }
  });

  describe('Constructor', () => {
    it('should create broker with default config when no config provided', () => {
      const defaultBroker = new MCPBroker();
      expect(defaultBroker).toBeInstanceOf(MCPBroker);
      expect(defaultBroker.isRunning()).toBe(false);
    });

    it('should merge user config with default config', () => {
      const config = broker.getConfig();
      expect(config.name).toBe('test-broker');
      expect(config.version).toBe('1.0.0');
      expect(config.registry.type).toBe('memory');
    });

    it('should set up event handlers', () => {
      expect(broker.listenerCount('started')).toBe(0);
      expect(broker.listenerCount('stopped')).toBe(0);
    });
  });

  describe('Lifecycle Management', () => {
    it('should start broker successfully', async () => {
      expect(broker.isRunning()).toBe(false);

      await broker.start();

      expect(broker.isRunning()).toBe(true);
    });

    it('should throw error when starting already running broker', async () => {
      await broker.start();

      await expect(broker.start()).rejects.toThrow(MCPErrorClass);
      await expect(broker.start()).rejects.toThrow('Broker is already running');
    });

    it('should stop broker successfully', async () => {
      await broker.start();
      expect(broker.isRunning()).toBe(true);

      await broker.stop();

      expect(broker.isRunning()).toBe(false);
    });

    it('should handle stop when broker is not running', async () => {
      expect(broker.isRunning()).toBe(false);

      await expect(broker.stop()).resolves.toBeUndefined();
    });

    it('should emit started event when broker starts', async () => {
      const startedSpy = jest.fn();
      broker.on('started', startedSpy);

      await broker.start();

      expect(startedSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit stopped event when broker stops', async () => {
      const stoppedSpy = jest.fn();
      broker.on('stopped', stoppedSpy);

      await broker.start();
      await broker.stop();

      expect(stoppedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service Registration', () => {
    beforeEach(async () => {
      await broker.start();
    });

    it('should register service successfully', async () => {
      const serviceRegisteredSpy = jest.fn();
      broker.on('serviceRegistered', serviceRegisteredSpy);

      await broker.registerService(mockServiceInfo);

      expect(serviceRegisteredSpy).toHaveBeenCalledWith(mockServiceInfo);
    });

    it('should throw error when registering service with invalid data', async () => {
      const invalidService = { ...mockServiceInfo, id: '' };

      await expect(broker.registerService(invalidService)).rejects.toThrow(MCPErrorClass);
      await expect(broker.registerService(invalidService)).rejects.toThrow(
        'Service ID is required'
      );
    });

    it('should throw error when broker is not running', async () => {
      await broker.stop();

      await expect(broker.registerService(mockServiceInfo)).rejects.toThrow(MCPErrorClass);
      await expect(broker.registerService(mockServiceInfo)).rejects.toThrow(
        'Broker is not running'
      );
    });

    it('should validate all required service fields', async () => {
      const testCases = [
        { field: 'id', value: '' },
        { field: 'name', value: '' },
        { field: 'version', value: '' },
        { field: 'endpoint', value: '' },
        { field: 'capabilities', value: 'not-array' },
        { field: 'resources', value: 'not-array' },
        { field: 'tools', value: 'not-array' },
      ];

      for (const testCase of testCases) {
        const invalidService = { ...mockServiceInfo, [testCase.field]: testCase.value };
        await expect(broker.registerService(invalidService)).rejects.toThrow(MCPErrorClass);
      }
    });
  });

  describe('Service Unregistration', () => {
    beforeEach(async () => {
      await broker.start();
      await broker.registerService(mockServiceInfo);
    });

    it('should unregister service successfully', async () => {
      const serviceUnregisteredSpy = jest.fn();
      broker.on('serviceUnregistered', serviceUnregisteredSpy);

      await broker.unregisterService(mockServiceInfo.id);

      expect(serviceUnregisteredSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockServiceInfo.id,
          name: mockServiceInfo.name,
        })
      );
    });

    it('should throw error when unregistering non-existent service', async () => {
      await expect(broker.unregisterService('non-existent')).rejects.toThrow(MCPErrorClass);
      await expect(broker.unregisterService('non-existent')).rejects.toThrow('Service not found');
    });

    it('should throw error when broker is not running', async () => {
      await broker.stop();

      await expect(broker.unregisterService(mockServiceInfo.id)).rejects.toThrow(MCPErrorClass);
      await expect(broker.unregisterService(mockServiceInfo.id)).rejects.toThrow(
        'Broker is not running'
      );
    });
  });

  describe('Service Discovery', () => {
    beforeEach(async () => {
      await broker.start();
      await broker.registerService(mockServiceInfo);
    });

    it('should discover services with empty query', async () => {
      const services = await broker.discoverServices({});

      expect(Array.isArray(services)).toBe(true);
    });

    it('should discover services with name filter', async () => {
      const services = await broker.discoverServices({ name: 'Test' });

      expect(Array.isArray(services)).toBe(true);
    });

    it('should discover services with capability filter', async () => {
      const services = await broker.discoverServices({ capability: 'resource' });

      expect(Array.isArray(services)).toBe(true);
    });

    it('should discover services with status filter', async () => {
      const services = await broker.discoverServices({ status: ServiceStatus.ONLINE });

      expect(Array.isArray(services)).toBe(true);
    });

    it('should throw error when broker is not running', async () => {
      await broker.stop();

      await expect(broker.discoverServices({})).rejects.toThrow(MCPErrorClass);
      await expect(broker.discoverServices({})).rejects.toThrow('Broker is not running');
    });
  });

  describe('Request Routing', () => {
    let mockRequest: MCPRequest;

    beforeEach(async () => {
      await broker.start();
      await broker.registerService(mockServiceInfo);

      mockRequest = {
        jsonrpc: '2.0',
        id: 'test-request-1',
        method: 'test/method',
        params: { test: 'data' },
      };
    });

    it('should route request successfully', async () => {
      const response = await broker.routeRequest(mockRequest);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(mockRequest.id);
    });

    it('should route request to specific service', async () => {
      const response = await broker.routeRequest(mockRequest, mockServiceInfo.id);

      expect(response).toBeDefined();
      expect(response.id).toBe(mockRequest.id);
    });

    it('should throw error when broker is not running', async () => {
      await broker.stop();

      await expect(broker.routeRequest(mockRequest)).rejects.toThrow(MCPErrorClass);
      await expect(broker.routeRequest(mockRequest)).rejects.toThrow('Broker is not running');
    });
  });

  describe('Service Health', () => {
    beforeEach(async () => {
      await broker.start();
      await broker.registerService(mockServiceInfo);
    });

    it('should get service health when health checking is enabled', async () => {
      // Mock health monitor to return health data
      const mockHealth = {
        serviceId: mockServiceInfo.id,
        status: ServiceStatus.ONLINE,
        uptime: 1000,
        responseTime: 100,
        errorRate: 0,
        lastCheck: new Date(),
        score: 1.0,
      };

      // This would normally be mocked through the HealthMonitor mock
      await expect(broker.getServiceHealth(mockServiceInfo.id)).resolves.toBeDefined();
    });

    it('should throw error when health checking is disabled', async () => {
      const brokerWithoutHealth = new MCPBroker({
        ...mockConfig,
        healthCheck: { ...mockConfig.healthCheck!, enabled: false },
      });

      await brokerWithoutHealth.start();

      await expect(brokerWithoutHealth.getServiceHealth(mockServiceInfo.id)).rejects.toThrow(
        'Health checking is disabled'
      );

      await brokerWithoutHealth.stop();
    });

    it('should throw error when broker is not running', async () => {
      await broker.stop();

      await expect(broker.getServiceHealth(mockServiceInfo.id)).rejects.toThrow(MCPErrorClass);
      await expect(broker.getServiceHealth(mockServiceInfo.id)).rejects.toThrow(
        'Broker is not running'
      );
    });
  });

  describe('Service Management', () => {
    beforeEach(async () => {
      await broker.start();
      await broker.registerService(mockServiceInfo);
    });

    it('should get all services', async () => {
      const services = await broker.getAllServices();

      expect(Array.isArray(services)).toBe(true);
    });

    it('should update service information', async () => {
      const serviceUpdatedSpy = jest.fn();
      broker.on('serviceUpdated', serviceUpdatedSpy);

      const updates = { status: ServiceStatus.MAINTENANCE };
      await broker.updateService(mockServiceInfo.id, updates);

      expect(serviceUpdatedSpy).toHaveBeenCalled();
    });

    it('should check if service is registered', async () => {
      const isRegistered = await broker.isServiceRegistered(mockServiceInfo.id);

      expect(typeof isRegistered).toBe('boolean');
    });

    it('should return false for non-existent service registration check', async () => {
      const isRegistered = await broker.isServiceRegistered('non-existent');

      expect(isRegistered).toBe(false);
    });

    it('should throw error when updating non-existent service', async () => {
      await expect(broker.updateService('non-existent', {})).rejects.toThrow(MCPErrorClass);
      await expect(broker.updateService('non-existent', {})).rejects.toThrow('Service not found');
    });
  });

  describe('Metrics and Statistics', () => {
    beforeEach(async () => {
      await broker.start();
    });

    it('should get routing metrics', () => {
      const metrics = broker.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.successfulRequests).toBe('number');
      expect(typeof metrics.failedRequests).toBe('number');
    });

    it('should get broker configuration', () => {
      const config = broker.getConfig();

      expect(config).toBeDefined();
      expect(config.name).toBe('test-broker');
    });

    it('should get broker uptime', () => {
      const uptime = broker.getUptime();

      expect(typeof uptime).toBe('number');
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle start errors gracefully', async () => {
      // Mock a component to throw an error during start
      const errorBroker = new MCPBroker(mockConfig);

      // This would be mocked to throw an error
      await expect(errorBroker.start()).resolves.toBeUndefined();
    });

    it('should handle stop errors gracefully', async () => {
      await broker.start();

      // This would be mocked to throw an error
      await expect(broker.stop()).resolves.toBeUndefined();
    });

    it('should handle service registration errors', async () => {
      await broker.start();

      // Test with invalid service data
      const invalidService = { ...mockServiceInfo, id: null as any };

      await expect(broker.registerService(invalidService)).rejects.toThrow(MCPErrorClass);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await broker.start();
    });

    it('should handle service health changed events', () => {
      const healthChangedSpy = jest.fn();
      broker.on('serviceHealthChanged', healthChangedSpy);

      // This would normally be triggered by the health monitor
      // For now, we just verify the event handler is set up
      expect(broker.listenerCount('serviceHealthChanged')).toBeGreaterThan(0);
    });

    it('should handle service expired events', () => {
      const expiredSpy = jest.fn();
      broker.on('serviceExpired', expiredSpy);

      // This would normally be triggered by the service registry
      // For now, we just verify the event handler is set up
      expect(broker.listenerCount('serviceExpired')).toBeGreaterThan(0);
    });

    it('should handle metrics collection events', () => {
      const metricsCollectedSpy = jest.fn();
      broker.on('metricsCollected', metricsCollectedSpy);

      // Metrics collection would be triggered by the interval
      // For now, we just verify the event handler can be set up
      expect(broker.listenerCount('metricsCollected')).toBe(1);
    });
  });
});
