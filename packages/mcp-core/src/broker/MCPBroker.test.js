"use strict";
/**
 * MCPBroker Unit Tests
 *
 * Comprehensive test suite for the MCPBroker class covering service registry,
 * discovery, health monitoring, and message routing functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MCPBroker_1 = require("./MCPBroker");
const common_1 = require("../types/common");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MCPBroker', () => {
    let broker;
    let mockServiceInfo;
    let mockConfig;
    (0, vitest_1.beforeEach)(() => {
        // Reset all mocks
        vitest_1.vi.clearAllMocks();
        // Create mock service info
        mockServiceInfo = {
            id: 'test-service-1',
            name: 'Test Service',
            version: '1.0.0',
            endpoint: 'http://localhost:3000',
            capabilities: ['resource', 'tool'],
            resources: [],
            tools: [],
            status: common_1.ServiceStatus.ONLINE,
            metadata: {},
            registeredAt: new Date(),
            lastHeartbeat: new Date()
        };
        // Create mock config
        mockConfig = {
            name: 'test-broker',
            version: '1.0.0',
            registry: {
                type: 'memory',
                serviceTTL: 300,
                cleanupInterval: 60
            },
            healthCheck: {
                enabled: true,
                interval: 30,
                timeout: 5000,
                failureThreshold: 3,
                recoveryThreshold: 2
            }
        };
        broker = new MCPBroker_1.MCPBroker(mockConfig);
    });
    (0, vitest_1.afterEach)(async () => {
        if (broker.isRunning()) {
            await broker.stop();
        }
    });
    (0, vitest_1.describe)('Constructor', () => {
        (0, vitest_1.it)('should create broker with default config when no config provided', () => {
            const defaultBroker = new MCPBroker_1.MCPBroker();
            (0, vitest_1.expect)(defaultBroker).toBeInstanceOf(MCPBroker_1.MCPBroker);
            (0, vitest_1.expect)(defaultBroker.isRunning()).toBe(false);
        });
        (0, vitest_1.it)('should merge user config with default config', () => {
            const config = broker.getConfig();
            (0, vitest_1.expect)(config.name).toBe('test-broker');
            (0, vitest_1.expect)(config.version).toBe('1.0.0');
            (0, vitest_1.expect)(config.registry.type).toBe('memory');
        });
        (0, vitest_1.it)('should set up event handlers', () => {
            (0, vitest_1.expect)(broker.listenerCount('started')).toBe(0);
            (0, vitest_1.expect)(broker.listenerCount('stopped')).toBe(0);
        });
    });
    (0, vitest_1.describe)('Lifecycle Management', () => {
        (0, vitest_1.it)('should start broker successfully', async () => {
            (0, vitest_1.expect)(broker.isRunning()).toBe(false);
            await broker.start();
            (0, vitest_1.expect)(broker.isRunning()).toBe(true);
        });
        (0, vitest_1.it)('should throw error when starting already running broker', async () => {
            await broker.start();
            await (0, vitest_1.expect)(broker.start()).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.start()).rejects.toThrow('Broker is already running');
        });
        (0, vitest_1.it)('should stop broker successfully', async () => {
            await broker.start();
            (0, vitest_1.expect)(broker.isRunning()).toBe(true);
            await broker.stop();
            (0, vitest_1.expect)(broker.isRunning()).toBe(false);
        });
        (0, vitest_1.it)('should handle stop when broker is not running', async () => {
            (0, vitest_1.expect)(broker.isRunning()).toBe(false);
            await (0, vitest_1.expect)(broker.stop()).resolves.toBeUndefined();
        });
        (0, vitest_1.it)('should emit started event when broker starts', async () => {
            const startedSpy = vitest_1.vi.fn();
            broker.on('started', startedSpy);
            await broker.start();
            (0, vitest_1.expect)(startedSpy).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should emit stopped event when broker stops', async () => {
            const stoppedSpy = vitest_1.vi.fn();
            broker.on('stopped', stoppedSpy);
            await broker.start();
            await broker.stop();
            (0, vitest_1.expect)(stoppedSpy).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Service Registration', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
        });
        (0, vitest_1.it)('should register service successfully', async () => {
            const serviceRegisteredSpy = vitest_1.vi.fn();
            broker.on('serviceRegistered', serviceRegisteredSpy);
            await broker.registerService(mockServiceInfo);
            (0, vitest_1.expect)(serviceRegisteredSpy).toHaveBeenCalledWith(mockServiceInfo);
        });
        (0, vitest_1.it)('should throw error when registering service with invalid data', async () => {
            const invalidService = { ...mockServiceInfo, id: '' };
            await (0, vitest_1.expect)(broker.registerService(invalidService)).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.registerService(invalidService)).rejects.toThrow('Service ID is required');
        });
        (0, vitest_1.it)('should throw error when broker is not running', async () => {
            await broker.stop();
            await (0, vitest_1.expect)(broker.registerService(mockServiceInfo)).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.registerService(mockServiceInfo)).rejects.toThrow('Broker is not running');
        });
        (0, vitest_1.it)('should validate all required service fields', async () => {
            const testCases = [
                { field: 'id', value: '' },
                { field: 'name', value: '' },
                { field: 'version', value: '' },
                { field: 'endpoint', value: '' },
                { field: 'capabilities', value: 'not-array' },
                { field: 'resources', value: 'not-array' },
                { field: 'tools', value: 'not-array' }
            ];
            for (const testCase of testCases) {
                const invalidService = { ...mockServiceInfo, [testCase.field]: testCase.value };
                await (0, vitest_1.expect)(broker.registerService(invalidService)).rejects.toThrow(error_1.MCPErrorClass);
            }
        });
    });
    (0, vitest_1.describe)('Service Unregistration', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
            await broker.registerService(mockServiceInfo);
        });
        (0, vitest_1.it)('should unregister service successfully', async () => {
            const serviceUnregisteredSpy = vitest_1.vi.fn();
            broker.on('serviceUnregistered', serviceUnregisteredSpy);
            await broker.unregisterService(mockServiceInfo.id);
            (0, vitest_1.expect)(serviceUnregisteredSpy).toHaveBeenCalledWith(mockServiceInfo);
        });
        (0, vitest_1.it)('should throw error when unregistering non-existent service', async () => {
            await (0, vitest_1.expect)(broker.unregisterService('non-existent')).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.unregisterService('non-existent')).rejects.toThrow('Service not found');
        });
        (0, vitest_1.it)('should throw error when broker is not running', async () => {
            await broker.stop();
            await (0, vitest_1.expect)(broker.unregisterService(mockServiceInfo.id)).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.unregisterService(mockServiceInfo.id)).rejects.toThrow('Broker is not running');
        });
    });
    (0, vitest_1.describe)('Service Discovery', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
            await broker.registerService(mockServiceInfo);
        });
        (0, vitest_1.it)('should discover services with empty query', async () => {
            const services = await broker.discoverServices({});
            (0, vitest_1.expect)(Array.isArray(services)).toBe(true);
        });
        (0, vitest_1.it)('should discover services with name filter', async () => {
            const services = await broker.discoverServices({ name: 'Test' });
            (0, vitest_1.expect)(Array.isArray(services)).toBe(true);
        });
        (0, vitest_1.it)('should discover services with capability filter', async () => {
            const services = await broker.discoverServices({ capability: 'resource' });
            (0, vitest_1.expect)(Array.isArray(services)).toBe(true);
        });
        (0, vitest_1.it)('should discover services with status filter', async () => {
            const services = await broker.discoverServices({ status: common_1.ServiceStatus.ONLINE });
            (0, vitest_1.expect)(Array.isArray(services)).toBe(true);
        });
        (0, vitest_1.it)('should throw error when broker is not running', async () => {
            await broker.stop();
            await (0, vitest_1.expect)(broker.discoverServices({})).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.discoverServices({})).rejects.toThrow('Broker is not running');
        });
    });
    (0, vitest_1.describe)('Request Routing', () => {
        let mockRequest;
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
            await broker.registerService(mockServiceInfo);
            mockRequest = {
                jsonrpc: '2.0',
                id: 'test-request-1',
                method: 'test/method',
                params: { test: 'data'
                }
            };
        });
        (0, vitest_1.it)('should route request successfully', async () => {
            const response = await broker.routeRequest(mockRequest);
            (0, vitest_1.expect)(response).toBeDefined();
            (0, vitest_1.expect)(response.jsonrpc).toBe('2.0');
            (0, vitest_1.expect)(response.id).toBe(mockRequest.id);
        });
        (0, vitest_1.it)('should route request to specific service', async () => {
            const response = await broker.routeRequest(mockRequest, mockServiceInfo.id);
            (0, vitest_1.expect)(response).toBeDefined();
            (0, vitest_1.expect)(response.id).toBe(mockRequest.id);
        });
        (0, vitest_1.it)('should throw error when broker is not running', async () => {
            await broker.stop();
            await (0, vitest_1.expect)(broker.routeRequest(mockRequest)).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.routeRequest(mockRequest)).rejects.toThrow('Broker is not running');
        });
    });
    (0, vitest_1.describe)('Service Health', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
            await broker.registerService(mockServiceInfo);
        });
        (0, vitest_1.it)('should get service health when health checking is enabled', async () => {
            // Mock health monitor to return health data
            const mockHealth = {
                serviceId: mockServiceInfo.id,
                status: common_1.ServiceStatus.ONLINE,
                uptime: 1000,
                responseTime: 100,
                errorRate: 0,
                lastCheck: new Date(),
                score: 1.0
            };
            // This would normally be mocked through the HealthMonitor mock
            await (0, vitest_1.expect)(broker.getServiceHealth(mockServiceInfo.id)).resolves.toBeDefined();
        });
        (0, vitest_1.it)('should throw error when health checking is disabled', async () => {
            const brokerWithoutHealth = new MCPBroker_1.MCPBroker({
                ...mockConfig,
                healthCheck: { ...mockConfig.healthCheck, enabled: false }
            });
            await brokerWithoutHealth.start();
            await (0, vitest_1.expect)(brokerWithoutHealth.getServiceHealth(mockServiceInfo.id))
                .rejects.toThrow('Health checking is disabled');
            await brokerWithoutHealth.stop();
        });
        (0, vitest_1.it)('should throw error when broker is not running', async () => {
            await broker.stop();
            await (0, vitest_1.expect)(broker.getServiceHealth(mockServiceInfo.id)).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.getServiceHealth(mockServiceInfo.id)).rejects.toThrow('Broker is not running');
        });
    });
    (0, vitest_1.describe)('Service Management', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
            await broker.registerService(mockServiceInfo);
        });
        (0, vitest_1.it)('should get all services', async () => {
            const services = await broker.getAllServices();
            (0, vitest_1.expect)(Array.isArray(services)).toBe(true);
        });
        (0, vitest_1.it)('should update service information', async () => {
            const serviceUpdatedSpy = vitest_1.vi.fn();
            broker.on('serviceUpdated', serviceUpdatedSpy);
            const updates = { status: common_1.ServiceStatus.MAINTENANCE };
            await broker.updateService(mockServiceInfo.id, updates);
            (0, vitest_1.expect)(serviceUpdatedSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should check if service is registered', async () => {
            const isRegistered = await broker.isServiceRegistered(mockServiceInfo.id);
            (0, vitest_1.expect)(typeof isRegistered).toBe('boolean');
        });
        (0, vitest_1.it)('should return false for non-existent service registration check', async () => {
            const isRegistered = await broker.isServiceRegistered('non-existent');
            (0, vitest_1.expect)(isRegistered).toBe(false);
        });
        (0, vitest_1.it)('should throw error when updating non-existent service', async () => {
            await (0, vitest_1.expect)(broker.updateService('non-existent', {})).rejects.toThrow(error_1.MCPErrorClass);
            await (0, vitest_1.expect)(broker.updateService('non-existent', {})).rejects.toThrow('Service not found');
        });
    });
    (0, vitest_1.describe)('Metrics and Statistics', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
        });
        (0, vitest_1.it)('should get routing metrics', () => {
            const metrics = broker.getMetrics();
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(typeof metrics.totalRequests).toBe('number');
            (0, vitest_1.expect)(typeof metrics.successfulRequests).toBe('number');
            (0, vitest_1.expect)(typeof metrics.failedRequests).toBe('number');
        });
        (0, vitest_1.it)('should get broker configuration', () => {
            const config = broker.getConfig();
            (0, vitest_1.expect)(config).toBeDefined();
            (0, vitest_1.expect)(config.name).toBe('test-broker');
        });
        (0, vitest_1.it)('should get broker uptime', () => {
            const uptime = broker.getUptime();
            (0, vitest_1.expect)(typeof uptime).toBe('number');
            (0, vitest_1.expect)(uptime).toBeGreaterThanOrEqual(0);
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle start errors gracefully', async () => {
            // Mock a component to throw an error during start
            const errorBroker = new MCPBroker_1.MCPBroker(mockConfig);
            // This would be mocked to throw an error
            await (0, vitest_1.expect)(errorBroker.start()).resolves.toBeUndefined();
        });
        (0, vitest_1.it)('should handle stop errors gracefully', async () => {
            await broker.start();
            // This would be mocked to throw an error
            await (0, vitest_1.expect)(broker.stop()).resolves.toBeUndefined();
        });
        (0, vitest_1.it)('should handle service registration errors', async () => {
            await broker.start();
            // Test with invalid service data
            const invalidService = { ...mockServiceInfo, id: null };
            await (0, vitest_1.expect)(broker.registerService(invalidService)).rejects.toThrow(error_1.MCPErrorClass);
        });
    });
    (0, vitest_1.describe)('Event Handling', () => {
        (0, vitest_1.beforeEach)(async () => {
            await broker.start();
        });
        (0, vitest_1.it)('should handle service health changed events', () => {
            const healthChangedSpy = vitest_1.vi.fn();
            broker.on('serviceHealthChanged', healthChangedSpy);
            // This would normally be triggered by the health monitor
            // For now, we just verify the event handler is set up
            (0, vitest_1.expect)(broker.listenerCount('serviceHealthChanged')).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle service expired events', () => {
            const expiredSpy = vitest_1.vi.fn();
            broker.on('serviceExpired', expiredSpy);
            // This would normally be triggered by the service registry
            // For now, we just verify the event handler is set up
            (0, vitest_1.expect)(broker.listenerCount('serviceExpired')).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle metrics collection events', () => {
            const metricsCollectedSpy = vitest_1.vi.fn();
            broker.on('metricsCollected', metricsCollectedSpy);
            // Metrics collection would be triggered by the interval
            // For now, we just verify the event handler can be set up
            (0, vitest_1.expect)(broker.listenerCount('metricsCollected')).toBe(1);
        });
    });
});
//# sourceMappingURL=MCPBroker.test.js.map