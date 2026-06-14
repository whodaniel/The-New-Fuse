"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const MasterClockService_1 = require("./MasterClockService");
const vi = globals_1.jest;
// Create mock implementations
const createMockRedisService = () => ({
    subscribe: globals_1.jest.fn().mockResolvedValue(undefined),
    unsubscribe: globals_1.jest.fn().mockResolvedValue(undefined),
    publish: globals_1.jest.fn().mockResolvedValue(1),
    hset: globals_1.jest.fn().mockResolvedValue(undefined),
    on: globals_1.jest.fn(),
    emit: globals_1.jest.fn(),
});
const createMockHeartbeatService = () => ({
    on: globals_1.jest.fn(),
    emit: globals_1.jest.fn(),
});
const createMockMetricsService = () => ({
    collectMetric: globals_1.jest.fn().mockResolvedValue(undefined),
    getMetrics: globals_1.jest.fn().mockResolvedValue({}),
    getSystemMetrics: globals_1.jest.fn().mockResolvedValue({}),
    getApplicationMetrics: globals_1.jest.fn().mockResolvedValue({}),
    generateReport: globals_1.jest.fn().mockResolvedValue({}),
});
(0, globals_1.describe)('MasterClockService', () => {
    let masterClockService;
    let mockRedisService;
    let mockHeartbeatService;
    let mockMetricsService;
    let config;
    (0, globals_1.beforeEach)(() => {
        // Create mock services
        mockRedisService = createMockRedisService();
        mockHeartbeatService = createMockHeartbeatService();
        mockMetricsService = createMockMetricsService();
        // Create test configuration
        config = {
            syncIntervalMs: 1000,
            driftThresholdMs: 100,
            maxDriftMs: 500,
            correctionIntervalMs: 5000,
            instanceId: 'test-master-clock',
            redisChannels: {
                clockSync: 'sync:clock:sync',
                driftAlert: 'sync:clock:drift',
                correction: 'sync:clock:correction',
            },
        };
        // Create service instance
        masterClockService = new MasterClockService_1.MasterClockService(config, mockRedisService, mockHeartbeatService, mockMetricsService);
    });
    (0, globals_1.afterEach)(async () => {
        if (masterClockService) {
            await masterClockService.shutdown();
        }
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.describe)('Initialization', () => {
        (0, globals_1.it)('should initialize successfully with all integrations', async () => {
            const initSpy = globals_1.jest.spyOn(masterClockService, 'emit');
            await masterClockService.initialize();
            // Verify Redis subscriptions were set up
            (0, globals_1.expect)(mockRedisService.subscribe).toHaveBeenCalledWith(config.redisChannels.clockSync, globals_1.expect.any(Function));
            (0, globals_1.expect)(mockRedisService.subscribe).toHaveBeenCalledWith(config.redisChannels.driftAlert, globals_1.expect.any(Function));
            (0, globals_1.expect)(mockRedisService.subscribe).toHaveBeenCalledWith(config.redisChannels.correction, globals_1.expect.any(Function));
            // Verify heartbeat service integration
            (0, globals_1.expect)(mockHeartbeatService.on).toHaveBeenCalledWith('heartbeat_received', globals_1.expect.any(Function));
            (0, globals_1.expect)(mockHeartbeatService.on).toHaveBeenCalledWith('agent_status_changed', globals_1.expect.any(Function));
            // Verify master clock registration
            (0, globals_1.expect)(mockRedisService.hset).toHaveBeenCalledWith('sync:master_clock:registry', config.instanceId, globals_1.expect.stringContaining('"role":"master_clock"'));
            // Verify initialization event
            (0, globals_1.expect)(initSpy).toHaveBeenCalledWith('initialized');
        });
        (0, globals_1.it)('should throw error if already initialized', async () => {
            await masterClockService.initialize();
            await (0, globals_1.expect)(masterClockService.initialize()).rejects.toThrow('MasterClockService is already initialized');
        });
        (0, globals_1.it)('should handle initialization errors gracefully', async () => {
            mockRedisService.subscribe.mockRejectedValueOnce(new Error('Redis connection failed'));
            await (0, globals_1.expect)(masterClockService.initialize()).rejects.toThrow('Redis connection failed');
        });
    });
    (0, globals_1.describe)('Time Synchronization', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
        });
        (0, globals_1.it)('should provide synchronized timestamp', async () => {
            const timestamp = await masterClockService.now();
            (0, globals_1.expect)(timestamp).toBeInstanceOf(Date);
            (0, globals_1.expect)(mockRedisService.publish).toHaveBeenCalledWith(config.redisChannels.clockSync, globals_1.expect.stringContaining('"instanceId":"test-master-clock"'));
        });
        (0, globals_1.it)('should sync time with specific instance', async () => {
            const targetInstanceId = 'target-instance';
            await masterClockService.syncTime(targetInstanceId);
            (0, globals_1.expect)(mockRedisService.publish).toHaveBeenCalledWith(`${config.redisChannels.clockSync}:${targetInstanceId}`, globals_1.expect.stringContaining('"instanceId":"test-master-clock"'));
        });
        (0, globals_1.it)('should track sync operations in metrics', async () => {
            const initialMetrics = masterClockService.getClockMetrics();
            const initialSyncOps = initialMetrics.syncOperations;
            await masterClockService.syncTime('test-instance');
            const updatedMetrics = masterClockService.getClockMetrics();
            (0, globals_1.expect)(updatedMetrics.syncOperations).toBe(initialSyncOps + 1);
        });
    });
    (0, globals_1.describe)('Drift Detection and Correction', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
            // Simulate some instance clocks with drift
            const mockInstances = [
                { instanceId: 'instance-1', timestamp: new Date(Date.now() - 50), drift: 50 },
                { instanceId: 'instance-2', timestamp: new Date(Date.now() - 150), drift: 150 },
                { instanceId: 'instance-3', timestamp: new Date(Date.now() - 300), drift: 300 },
            ];
            // Add instances to the service's internal map using the private method
            for (const instance of mockInstances) {
                // Access the private instanceClocks map directly for testing
                const instanceClocks = masterClockService.instanceClocks;
                instanceClocks.set(instance.instanceId, {
                    instanceId: instance.instanceId,
                    timestamp: instance.timestamp,
                    drift: instance.drift,
                    lastSync: new Date(),
                });
            }
        });
        (0, globals_1.it)('should detect clock drift across instances', async () => {
            const driftReport = await masterClockService.detectDrift();
            // Check basic structure
            (0, globals_1.expect)(driftReport).toBeDefined();
            (0, globals_1.expect)(driftReport.instances).toBeDefined();
            (0, globals_1.expect)(Array.isArray(driftReport.instances)).toBe(true);
            (0, globals_1.expect)(driftReport.instances.length).toBe(3);
            // Check properties
            (0, globals_1.expect)(typeof driftReport.maxDrift).toBe('number');
            (0, globals_1.expect)(driftReport.maxDrift).toBeGreaterThan(0);
            (0, globals_1.expect)(typeof driftReport.requiresCorrection).toBe('boolean');
            (0, globals_1.expect)(driftReport.timestamp).toBeInstanceOf(Date);
            // Check instance structure
            for (const instance of driftReport.instances) {
                (0, globals_1.expect)(typeof instance.instanceId).toBe('string');
                (0, globals_1.expect)(typeof instance.drift).toBe('number');
                (0, globals_1.expect)(instance.lastSync).toBeInstanceOf(Date);
            }
        });
        (0, globals_1.it)('should identify when correction is required', async () => {
            const driftReport = await masterClockService.detectDrift();
            // With drift of 150ms and 300ms, and threshold of 100ms, correction should be required
            (0, globals_1.expect)(driftReport.requiresCorrection).toBe(true);
            (0, globals_1.expect)(driftReport.maxDrift).toBeGreaterThan(config.driftThresholdMs);
        });
        (0, globals_1.it)('should correct drift for specified instances', async () => {
            const instanceIds = ['instance-2', 'instance-3'];
            await masterClockService.correctDrift(instanceIds);
            // Verify correction messages were sent
            (0, globals_1.expect)(mockRedisService.publish).toHaveBeenCalledWith(`${config.redisChannels.correction}:instance-2`, globals_1.expect.stringContaining('"correctionType":"drift_correction"'));
            (0, globals_1.expect)(mockRedisService.publish).toHaveBeenCalledWith(`${config.redisChannels.correction}:instance-3`, globals_1.expect.stringContaining('"correctionType":"drift_correction"'));
            // Verify metrics were updated
            const metrics = masterClockService.getClockMetrics();
            (0, globals_1.expect)(metrics.driftCorrections).toBe(2);
        });
        (0, globals_1.it)('should update health status based on drift', async () => {
            const healthStatusSpy = globals_1.jest.spyOn(masterClockService, 'emit');
            await masterClockService.detectDrift();
            const metrics = masterClockService.getClockMetrics();
            (0, globals_1.expect)(['healthy', 'drift', 'critical']).toContain(metrics.healthStatus);
        });
    });
    (0, globals_1.describe)('Redis Integration', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
        });
        (0, globals_1.it)('should handle clock sync messages from other instances', () => {
            const subscribeCall = mockRedisService.subscribe.mock.calls.find((call) => call[0] === config.redisChannels.clockSync);
            (0, globals_1.expect)(subscribeCall).toBeDefined();
            const messageHandler = subscribeCall[1];
            const mockMessage = {
                message: JSON.stringify({
                    instanceId: 'remote-instance',
                    timestamp: new Date(),
                    drift: 0,
                    lastSync: new Date(),
                }),
            };
            (0, globals_1.expect)(() => messageHandler(mockMessage)).not.toThrow();
        });
        (0, globals_1.it)('should handle drift alert messages', () => {
            const subscribeCall = mockRedisService.subscribe.mock.calls.find((call) => call[0] === config.redisChannels.driftAlert);
            (0, globals_1.expect)(subscribeCall).toBeDefined();
            const messageHandler = subscribeCall[1];
            const mockAlert = {
                message: JSON.stringify({
                    instanceId: 'drifted-instance',
                    severity: 'warning',
                    drift: 200,
                }),
            };
            (0, globals_1.expect)(() => messageHandler(mockAlert)).not.toThrow();
        });
        (0, globals_1.it)('should handle correction acknowledgments', () => {
            const subscribeCall = mockRedisService.subscribe.mock.calls.find((call) => call[0] === config.redisChannels.correction);
            (0, globals_1.expect)(subscribeCall).toBeDefined();
            const messageHandler = subscribeCall[1];
            const mockAck = {
                message: JSON.stringify({
                    instanceId: 'corrected-instance',
                    status: 'acknowledged',
                    timestamp: new Date(),
                }),
            };
            (0, globals_1.expect)(() => messageHandler(mockAck)).not.toThrow();
        });
    });
    (0, globals_1.describe)('HeartbeatMonitoringService Integration', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
        });
        (0, globals_1.it)('should integrate with heartbeat events', () => {
            // Verify heartbeat event listeners were registered
            (0, globals_1.expect)(mockHeartbeatService.on).toHaveBeenCalledWith('heartbeat_received', globals_1.expect.any(Function));
            (0, globals_1.expect)(mockHeartbeatService.on).toHaveBeenCalledWith('agent_status_changed', globals_1.expect.any(Function));
            (0, globals_1.expect)(mockHeartbeatService.on).toHaveBeenCalledWith('monitoring_started', globals_1.expect.any(Function));
        });
        (0, globals_1.it)('should update instance clocks on heartbeat received', () => {
            const heartbeatHandler = mockHeartbeatService.on.mock.calls.find((call) => call[0] === 'heartbeat_received')?.[1];
            (0, globals_1.expect)(heartbeatHandler).toBeDefined();
            const mockHeartbeatData = {
                agentId: 'test-agent',
                taskId: 'test-task',
            };
            (0, globals_1.expect)(() => heartbeatHandler(mockHeartbeatData)).not.toThrow();
        });
        (0, globals_1.it)('should remove failed instances from tracking', () => {
            const statusHandler = mockHeartbeatService.on.mock.calls.find((call) => call[0] === 'agent_status_changed')?.[1];
            (0, globals_1.expect)(statusHandler).toBeDefined();
            const mockStatusData = {
                agentId: 'failed-agent',
                oldStatus: 'active',
                newStatus: 'failed',
            };
            (0, globals_1.expect)(() => statusHandler(mockStatusData)).not.toThrow();
        });
    });
    (0, globals_1.describe)('Metrics and Monitoring', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
        });
        (0, globals_1.it)('should provide comprehensive clock metrics', () => {
            const metrics = masterClockService.getClockMetrics();
            (0, globals_1.expect)(metrics).toMatchObject({
                syncOperations: globals_1.expect.any(Number),
                driftCorrections: globals_1.expect.any(Number),
                avgDrift: globals_1.expect.any(Number),
                maxDrift: globals_1.expect.any(Number),
                instanceCount: globals_1.expect.any(Number),
                lastSyncTime: globals_1.expect.any(Date),
                healthStatus: globals_1.expect.stringMatching(/^(healthy|drift|critical)$/),
            });
        });
        (0, globals_1.it)('should track instance count correctly', () => {
            (0, globals_1.expect)(masterClockService.getInstanceCount()).toBe(0);
            // Simulate adding instances
            masterClockService.updateInstanceClock('instance-1', new Date());
            masterClockService.updateInstanceClock('instance-2', new Date());
            (0, globals_1.expect)(masterClockService.getInstanceCount()).toBe(2);
        });
        (0, globals_1.it)('should provide tracked instances data', () => {
            // Add some test instances
            masterClockService.updateInstanceClock('instance-1', new Date());
            masterClockService.updateInstanceClock('instance-2', new Date());
            const instances = masterClockService.getTrackedInstances();
            (0, globals_1.expect)(instances).toHaveLength(2);
            (0, globals_1.expect)(instances[0]).toMatchObject({
                instanceId: globals_1.expect.any(String),
                timestamp: globals_1.expect.any(Date),
                drift: globals_1.expect.any(Number),
                lastSync: globals_1.expect.any(Date),
            });
        });
    });
    (0, globals_1.describe)('Force Synchronization', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
        });
        (0, globals_1.it)('should force immediate synchronization', async () => {
            const forceSyncSpy = globals_1.jest.spyOn(masterClockService, 'emit');
            await masterClockService.forceSync();
            // Verify broadcast was sent
            (0, globals_1.expect)(mockRedisService.publish).toHaveBeenCalledWith(config.redisChannels.clockSync, globals_1.expect.stringContaining('"instanceId":"test-master-clock"'));
            // Verify completion event was emitted
            (0, globals_1.expect)(forceSyncSpy).toHaveBeenCalledWith('force_sync_completed', globals_1.expect.any(Object));
        });
    });
    (0, globals_1.describe)('Shutdown', () => {
        (0, globals_1.it)('should shutdown gracefully', async () => {
            await masterClockService.initialize();
            const shutdownSpy = globals_1.jest.spyOn(masterClockService, 'emit');
            await masterClockService.shutdown();
            // Verify Redis unsubscriptions
            (0, globals_1.expect)(mockRedisService.unsubscribe).toHaveBeenCalledWith(config.redisChannels.clockSync);
            (0, globals_1.expect)(mockRedisService.unsubscribe).toHaveBeenCalledWith(config.redisChannels.driftAlert);
            (0, globals_1.expect)(mockRedisService.unsubscribe).toHaveBeenCalledWith(config.redisChannels.correction);
            // Verify shutdown event
            (0, globals_1.expect)(shutdownSpy).toHaveBeenCalledWith('shutdown');
        });
        (0, globals_1.it)('should handle shutdown when not initialized', async () => {
            // Should not throw when shutting down uninitialized service
            await (0, globals_1.expect)(masterClockService.shutdown()).resolves.toBeUndefined();
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.beforeEach)(async () => {
            await masterClockService.initialize();
        });
        (0, globals_1.it)('should handle malformed clock sync messages', () => {
            const subscribeCall = mockRedisService.subscribe.mock.calls.find((call) => call[0] === config.redisChannels.clockSync);
            const messageHandler = subscribeCall[1];
            const malformedMessage = { message: 'invalid-json' };
            // Should not throw on malformed messages
            (0, globals_1.expect)(() => messageHandler(malformedMessage)).not.toThrow();
        });
        (0, globals_1.it)('should handle Redis publish failures gracefully', async () => {
            mockRedisService.publish.mockRejectedValueOnce(new Error('Redis publish failed'));
            // Should not throw, but should handle the error internally
            await (0, globals_1.expect)(masterClockService.syncTime('test-instance')).rejects.toThrow('Redis publish failed');
        });
    });
});
//# sourceMappingURL=MasterClockService.test.js.map