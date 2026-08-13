import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MasterClockConfig, MasterClockService } from './MasterClockService';
const vi = jest;

// Create mock implementations
const createMockRedisService = () => ({
  subscribe: jest.fn().mockResolvedValue(undefined),
  unsubscribe: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(1),
  hset: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  emit: jest.fn(),
});

const createMockHeartbeatService = () => ({
  on: jest.fn(),
  emit: jest.fn(),
});

const createMockMetricsService = () => ({
  collectMetric: jest.fn().mockResolvedValue(undefined),
  getMetrics: jest.fn().mockResolvedValue({}),
  getSystemMetrics: jest.fn().mockResolvedValue({}),
  getApplicationMetrics: jest.fn().mockResolvedValue({}),
  generateReport: jest.fn().mockResolvedValue({}),
});

describe('MasterClockService', () => {
  let masterClockService: MasterClockService;
  let mockRedisService: any;
  let mockHeartbeatService: any;
  let mockMetricsService: any;
  let config: MasterClockConfig;

  beforeEach(() => {
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
    masterClockService = new MasterClockService(
      config,
      mockRedisService,
      mockHeartbeatService,
      mockMetricsService
    );
  });

  afterEach(async () => {
    if (masterClockService) {
      await masterClockService.shutdown();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with all integrations', async () => {
      const initSpy = jest.spyOn(masterClockService, 'emit');

      await masterClockService.initialize();

      // Verify Redis subscriptions were set up
      expect(mockRedisService.subscribe).toHaveBeenCalledWith(
        config.redisChannels.clockSync,
        expect.any(Function)
      );
      expect(mockRedisService.subscribe).toHaveBeenCalledWith(
        config.redisChannels.driftAlert,
        expect.any(Function)
      );
      expect(mockRedisService.subscribe).toHaveBeenCalledWith(
        config.redisChannels.correction,
        expect.any(Function)
      );

      // Verify heartbeat service integration
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'heartbeat_received',
        expect.any(Function)
      );
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'agent_status_changed',
        expect.any(Function)
      );

      // Verify master clock registration
      expect(mockRedisService.hset).toHaveBeenCalledWith(
        'sync:master_clock:registry',
        config.instanceId,
        expect.stringContaining('"role":"master_clock"')
      );

      // Verify initialization event
      expect(initSpy).toHaveBeenCalledWith('initialized');
    });

    it('should throw error if already initialized', async () => {
      await masterClockService.initialize();

      await expect(masterClockService.initialize()).rejects.toThrow(
        'MasterClockService is already initialized'
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockRedisService.subscribe.mockRejectedValueOnce(new Error('Redis connection failed'));

      await expect(masterClockService.initialize()).rejects.toThrow('Redis connection failed');
    });
  });

  describe('Time Synchronization', () => {
    beforeEach(async () => {
      await masterClockService.initialize();
    });

    it('should provide synchronized timestamp', async () => {
      const timestamp = await masterClockService.now();

      expect(timestamp).toBeInstanceOf(Date);
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        config.redisChannels.clockSync,
        expect.stringContaining('"instanceId":"test-master-clock"')
      );
    });

    it('should sync time with specific instance', async () => {
      const targetInstanceId = 'target-instance';

      await masterClockService.syncTime(targetInstanceId);

      expect(mockRedisService.publish).toHaveBeenCalledWith(
        `${config.redisChannels.clockSync}:${targetInstanceId}`,
        expect.stringContaining('"instanceId":"test-master-clock"')
      );
    });

    it('should track sync operations in metrics', async () => {
      const initialMetrics = masterClockService.getClockMetrics();
      const initialSyncOps = initialMetrics.syncOperations;

      await masterClockService.syncTime('test-instance');

      const updatedMetrics = masterClockService.getClockMetrics();
      expect(updatedMetrics.syncOperations).toBe(initialSyncOps + 1);
    });
  });

  describe('Drift Detection and Correction', () => {
    beforeEach(async () => {
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
        const instanceClocks = (masterClockService as any).instanceClocks;
        instanceClocks.set(instance.instanceId, {
          instanceId: instance.instanceId,
          timestamp: instance.timestamp,
          drift: instance.drift,
          lastSync: new Date(),
        });
      }
    });

    it('should detect clock drift across instances', async () => {
      const driftReport = await masterClockService.detectDrift();

      // Check basic structure
      expect(driftReport).toBeDefined();
      expect(driftReport.instances).toBeDefined();
      expect(Array.isArray(driftReport.instances)).toBe(true);
      expect(driftReport.instances.length).toBe(3);

      // Check properties
      expect(typeof driftReport.maxDrift).toBe('number');
      expect(driftReport.maxDrift).toBeGreaterThan(0);
      expect(typeof driftReport.requiresCorrection).toBe('boolean');
      expect(driftReport.timestamp).toBeInstanceOf(Date);

      // Check instance structure
      for (const instance of driftReport.instances) {
        expect(typeof instance.instanceId).toBe('string');
        expect(typeof instance.drift).toBe('number');
        expect(instance.lastSync).toBeInstanceOf(Date);
      }
    });

    it('should identify when correction is required', async () => {
      const driftReport = await masterClockService.detectDrift();

      // With drift of 150ms and 300ms, and threshold of 100ms, correction should be required
      expect(driftReport.requiresCorrection).toBe(true);
      expect(driftReport.maxDrift).toBeGreaterThan(config.driftThresholdMs);
    });

    it('should correct drift for specified instances', async () => {
      const instanceIds = ['instance-2', 'instance-3'];

      await masterClockService.correctDrift(instanceIds);

      // Verify correction messages were sent
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        `${config.redisChannels.correction}:instance-2`,
        expect.stringContaining('"correctionType":"drift_correction"')
      );
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        `${config.redisChannels.correction}:instance-3`,
        expect.stringContaining('"correctionType":"drift_correction"')
      );

      // Verify metrics were updated
      const metrics = masterClockService.getClockMetrics();
      expect(metrics.driftCorrections).toBe(2);
    });

    it('should update health status based on drift', async () => {
      const healthStatusSpy = jest.spyOn(masterClockService, 'emit');

      await masterClockService.detectDrift();

      const metrics = masterClockService.getClockMetrics();
      expect(['healthy', 'drift', 'critical']).toContain(metrics.healthStatus);
    });
  });

  describe('Redis Integration', () => {
    beforeEach(async () => {
      await masterClockService.initialize();
    });

    it('should handle clock sync messages from other instances', () => {
      const subscribeCall = mockRedisService.subscribe.mock.calls.find(
        (call) => call[0] === config.redisChannels.clockSync
      );
      expect(subscribeCall).toBeDefined();

      const messageHandler = subscribeCall![1];
      const mockMessage = {
        message: JSON.stringify({
          instanceId: 'remote-instance',
          timestamp: new Date(),
          drift: 0,
          lastSync: new Date(),
        }),
      };

      expect(() => messageHandler(mockMessage)).not.toThrow();
    });

    it('should handle drift alert messages', () => {
      const subscribeCall = mockRedisService.subscribe.mock.calls.find(
        (call) => call[0] === config.redisChannels.driftAlert
      );
      expect(subscribeCall).toBeDefined();

      const messageHandler = subscribeCall![1];
      const mockAlert = {
        message: JSON.stringify({
          instanceId: 'drifted-instance',
          severity: 'warning',
          drift: 200,
        }),
      };

      expect(() => messageHandler(mockAlert)).not.toThrow();
    });

    it('should handle correction acknowledgments', () => {
      const subscribeCall = mockRedisService.subscribe.mock.calls.find(
        (call) => call[0] === config.redisChannels.correction
      );
      expect(subscribeCall).toBeDefined();

      const messageHandler = subscribeCall![1];
      const mockAck = {
        message: JSON.stringify({
          instanceId: 'corrected-instance',
          status: 'acknowledged',
          timestamp: new Date(),
        }),
      };

      expect(() => messageHandler(mockAck)).not.toThrow();
    });
  });

  describe('HeartbeatMonitoringService Integration', () => {
    beforeEach(async () => {
      await masterClockService.initialize();
    });

    it('should integrate with heartbeat events', () => {
      // Verify heartbeat event listeners were registered
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'heartbeat_received',
        expect.any(Function)
      );
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'agent_status_changed',
        expect.any(Function)
      );
      expect(mockHeartbeatService.on).toHaveBeenCalledWith(
        'monitoring_started',
        expect.any(Function)
      );
    });

    it('should update instance clocks on heartbeat received', () => {
      const heartbeatHandler = mockHeartbeatService.on.mock.calls.find(
        (call) => call[0] === 'heartbeat_received'
      )?.[1];

      expect(heartbeatHandler).toBeDefined();

      const mockHeartbeatData = {
        agentId: 'test-agent',
        taskId: 'test-task',
      };

      expect(() => heartbeatHandler(mockHeartbeatData)).not.toThrow();
    });

    it('should remove failed instances from tracking', () => {
      const statusHandler = mockHeartbeatService.on.mock.calls.find(
        (call) => call[0] === 'agent_status_changed'
      )?.[1];

      expect(statusHandler).toBeDefined();

      const mockStatusData = {
        agentId: 'failed-agent',
        oldStatus: 'active',
        newStatus: 'failed',
      };

      expect(() => statusHandler(mockStatusData)).not.toThrow();
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      await masterClockService.initialize();
    });

    it('should provide comprehensive clock metrics', () => {
      const metrics = masterClockService.getClockMetrics();

      expect(metrics).toMatchObject({
        syncOperations: expect.any(Number),
        driftCorrections: expect.any(Number),
        avgDrift: expect.any(Number),
        maxDrift: expect.any(Number),
        instanceCount: expect.any(Number),
        lastSyncTime: expect.any(Date),
        healthStatus: expect.stringMatching(/^(healthy|drift|critical)$/),
      });
    });

    it('should track instance count correctly', () => {
      expect(masterClockService.getInstanceCount()).toBe(0);

      // Simulate adding instances
      (masterClockService as any).updateInstanceClock('instance-1', new Date());
      (masterClockService as any).updateInstanceClock('instance-2', new Date());

      expect(masterClockService.getInstanceCount()).toBe(2);
    });

    it('should provide tracked instances data', () => {
      // Add some test instances
      (masterClockService as any).updateInstanceClock('instance-1', new Date());
      (masterClockService as any).updateInstanceClock('instance-2', new Date());

      const instances = masterClockService.getTrackedInstances();

      expect(instances).toHaveLength(2);
      expect(instances[0]).toMatchObject({
        instanceId: expect.any(String),
        timestamp: expect.any(Date),
        drift: expect.any(Number),
        lastSync: expect.any(Date),
      });
    });
  });

  describe('Force Synchronization', () => {
    beforeEach(async () => {
      await masterClockService.initialize();
    });

    it('should force immediate synchronization', async () => {
      const forceSyncSpy = jest.spyOn(masterClockService, 'emit');

      await masterClockService.forceSync();

      // Verify broadcast was sent
      expect(mockRedisService.publish).toHaveBeenCalledWith(
        config.redisChannels.clockSync,
        expect.stringContaining('"instanceId":"test-master-clock"')
      );

      // Verify completion event was emitted
      expect(forceSyncSpy).toHaveBeenCalledWith('force_sync_completed', expect.any(Object));
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await masterClockService.initialize();

      const shutdownSpy = jest.spyOn(masterClockService, 'emit');

      await masterClockService.shutdown();

      // Verify Redis unsubscriptions
      expect(mockRedisService.unsubscribe).toHaveBeenCalledWith(config.redisChannels.clockSync);
      expect(mockRedisService.unsubscribe).toHaveBeenCalledWith(config.redisChannels.driftAlert);
      expect(mockRedisService.unsubscribe).toHaveBeenCalledWith(config.redisChannels.correction);

      // Verify shutdown event
      expect(shutdownSpy).toHaveBeenCalledWith('shutdown');
    });

    it('should handle shutdown when not initialized', async () => {
      // Should not throw when shutting down uninitialized service
      await expect(masterClockService.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await masterClockService.initialize();
    });

    it('should handle malformed clock sync messages', () => {
      const subscribeCall = mockRedisService.subscribe.mock.calls.find(
        (call) => call[0] === config.redisChannels.clockSync
      );
      const messageHandler = subscribeCall![1];

      const malformedMessage = { message: 'invalid-json' };

      // Should not throw on malformed messages
      expect(() => messageHandler(malformedMessage)).not.toThrow();
    });

    it('should handle Redis publish failures gracefully', async () => {
      mockRedisService.publish.mockRejectedValueOnce(new Error('Redis publish failed'));

      // Should not throw, but should handle the error internally
      await expect(masterClockService.syncTime('test-instance')).rejects.toThrow(
        'Redis publish failed'
      );
    });
  });
});
