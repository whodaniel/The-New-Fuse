import { Test, TestingModule } from '@nestjs/testing';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import { CommunicationHubFailover } from './CommunicationHubFailover';
import { MessageQueueSynchronizer } from './MessageQueueSynchronizer';
import {
  CommunicationNode,
  CrossTenantRoutingConfig,
  MessageFailoverConfig,
  MessageQueueSyncConfig,
  SyncAwareA2AMessage,
  SyncAwareMessageUtils,
} from './SyncAwareA2AMessage';
import { SyncAwareAgentWebSocketService } from './SyncAwareAgentWebSocketService';
import { SyncAwareMessagingService } from './SyncAwareMessagingService';

describe('SyncAwareMessaging Integration', () => {
  let messagingService: SyncAwareMessagingService;
  let syncAwareWebSocket: SyncAwareAgentWebSocketService;
  let queueSynchronizer: MessageQueueSynchronizer;
  let failoverManager: CommunicationHubFailover;
  let mockRedisService: any;
  let mockWsService: any;

  const testTenantId = 'test-tenant-1';
  const testAgentId = 'test-agent-1';

  const createTestMessage = (overrides: Partial<SyncAwareA2AMessage> = {}): SyncAwareA2AMessage => {
    const baseMessage = {
      id: `test-message-${Date.now()}`,
      type: 'TEST_MESSAGE',
      timestamp: Date.now(),
      sender: 'test-sender',
      recipient: testAgentId,
      payload: { test: 'integration-data' },
      metadata: {
        priority: 'medium' as const,
        protocol_version: '1.0',
        sync: SyncAwareMessageUtils.createSyncMetadata({
          tenantId: testTenantId,
          crossTenantAllowed: false,
          priority: 'medium',
        }),
      },
    };

    return { ...baseMessage, ...overrides } as SyncAwareA2AMessage;
  };

  beforeEach(async () => {
    // Mock Redis service with realistic behavior
    mockRedisService = {
      psubscribe: jest.fn().mockResolvedValue(undefined),
      punsubscribe: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockImplementation((key: string) => {
        if (key.includes('status')) {
          return Promise.resolve(
            JSON.stringify({
              messageId: 'test-message',
              status: 'delivered',
              deliveredTo: [testAgentId],
              createdAt: Date.now(),
            })
          );
        }
        return Promise.resolve(null);
      }),
      set: jest.fn().mockResolvedValue('OK'),
      keys: jest.fn().mockResolvedValue([]),
      lrange: jest.fn().mockResolvedValue([]),
      lpush: jest.fn().mockResolvedValue(1),
      lrem: jest.fn().mockResolvedValue(1),
    };

    // Mock WebSocket service with realistic agent management
    mockWsService = {
      getConnectedAgents: jest.fn().mockResolvedValue([testAgentId, 'agent-2', 'agent-3']),
      getAgentTenant: jest.fn().mockImplementation((agentId: string) => {
        if (agentId === testAgentId) return Promise.resolve(testTenantId);
        if (agentId === 'agent-2') return Promise.resolve('tenant-2');
        return Promise.resolve('tenant-3');
      }),
      sendMessage: jest.fn().mockResolvedValue(true),
      broadcastToTenant: jest.fn().mockResolvedValue(2),
      broadcastToAllAgents: jest.fn().mockResolvedValue(3),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncAwareMessagingService,
        SyncAwareAgentWebSocketService,
        MessageQueueSynchronizer,
        CommunicationHubFailover,
        {
          provide: 'UnifiedRedisService',
          useValue: mockRedisService,
        },
        {
          provide: SyncRedisConfig,
          useValue: {
            getKeyspatterns: () => ({
              patterns: {
                channelAll: 'test:channel:*',
                tenantAll: (tenantId: string) => `test:tenant:${tenantId}:*`,
                globalAll: 'test:global:*',
              },
              channels: {
                globalSync: 'test:sync:global',
                health: 'test:health',
                metrics: 'test:metrics',
              },
              queues: {
                syncOperations: (tenantId?: string) =>
                  tenantId ? `test:queue:${tenantId}` : 'test:queue:global',
                deadLetter: 'test:queue:deadletter',
              },
              globalSync: {
                state: (type: string, id: string) => `test:state:${type}:${id}`,
                conflicts: 'test:conflicts',
              },
              tenantSync: {
                state: (tenantId: string, type: string, id: string) =>
                  `test:tenant:${tenantId}:${type}:${id}`,
              },
            }),
            getTTLConfig: () => ({
              locks: 30,
              heartbeat: 60,
              fileChecksums: 3600,
            }),
            validateTenantId: (tenantId: string) => /^[a-zA-Z0-9_-]+$/.test(tenantId),
          },
        },
        {
          provide: 'IAgentWebSocketService',
          useValue: mockWsService,
        },
      ],
    }).compile();

    messagingService = module.get<SyncAwareMessagingService>(SyncAwareMessagingService);
    syncAwareWebSocket = module.get<SyncAwareAgentWebSocketService>(SyncAwareAgentWebSocketService);
    queueSynchronizer = module.get<MessageQueueSynchronizer>(MessageQueueSynchronizer);
    failoverManager = module.get<CommunicationHubFailover>(CommunicationHubFailover);

    // Initialize services
    await messagingService.onModuleInit();
  });

  afterEach(async () => {
    await messagingService.onModuleDestroy();
  });

  describe('End-to-End Message Flow', () => {
    it('should send message through complete sync-aware flow', async () => {
      const testMessage = createTestMessage();

      const result = await messagingService.sendMessage(testAgentId, testMessage, {
        tenantId: testTenantId,
        priority: 'high',
        requiresAck: true,
      });

      expect(result).toBeDefined();
      expect(result.messageId).toBe(testMessage.id);
      expect(result.status).toBe('queued');
      expect(mockWsService.sendMessage).toHaveBeenCalled();
    });

    it('should handle cross-tenant messaging with proper validation', async () => {
      // Configure cross-tenant routing
      const crossTenantConfig: CrossTenantRoutingConfig = {
        sourceTenantId: testTenantId,
        targetTenantIds: ['tenant-2'],
        routingRules: [
          {
            condition: 'always',
            action: 'allow',
          },
        ],
        securityPolicy: {
          requireEncryption: false,
          allowedMessageTypes: ['TEST_MESSAGE'],
          maxMessageSize: 1024,
          rateLimiting: {
            maxMessagesPerSecond: 10,
            maxMessagesPerMinute: 100,
          },
        },
      };

      await messagingService.configureCrossTenantMessaging(crossTenantConfig);

      const crossTenantMessage = createTestMessage({
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata({
            tenantId: testTenantId,
            crossTenantAllowed: true,
            priority: 'medium',
          }),
        },
      });

      const results = await messagingService.broadcastMessage(crossTenantMessage, {
        tenantIds: ['tenant-2'],
        crossTenant: true,
        priority: 'high',
      });

      expect(results).toHaveProperty('tenant-2');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('routing'),
        expect.any(String)
      );
    });

    it('should synchronize message queues across tenants', async () => {
      // Configure queue synchronization
      const queueConfig: MessageQueueSyncConfig = {
        queueName: 'test-queue',
        tenantId: testTenantId,
        syncMode: 'batch',
        batchSize: 10,
        batchTimeout: 1000,
        conflictResolution: 'latest_wins',
        retentionPolicy: {
          maxAge: 3600000,
          maxSize: 100,
          cleanupInterval: 300000,
        },
      };

      await messagingService.configureQueueSynchronization(queueConfig);
      await messagingService.synchronizeQueues(testTenantId);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('queue_config'),
        expect.any(String)
      );
    });

    it('should handle failover scenarios', async () => {
      // Register communication nodes
      const primaryNode: CommunicationNode = {
        id: 'node-1',
        type: 'primary',
        endpoint: 'ws://node1:8080',
        status: 'healthy',
        lastHealthCheck: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 5,
        responseTime: 50,
        capacity: 100,
        currentLoad: 10,
      };

      const fallbackNode: CommunicationNode = {
        id: 'node-2',
        type: 'fallback',
        endpoint: 'ws://node2:8080',
        status: 'healthy',
        lastHealthCheck: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 3,
        responseTime: 75,
        capacity: 80,
        currentLoad: 5,
      };

      await failoverManager.registerNode(primaryNode);
      await failoverManager.registerNode(fallbackNode);

      // Configure failover
      const failoverConfig: MessageFailoverConfig = {
        primaryNodes: ['node-1'],
        fallbackNodes: ['node-2'],
        healthCheckInterval: 5000,
        failoverThreshold: 2,
        recoveryThreshold: 3,
        circuitBreakerConfig: {
          enabled: true,
          failureThreshold: 3,
          recoveryTimeout: 10000,
          halfOpenMaxCalls: 2,
        },
      };

      await messagingService.configureFailover(testTenantId, failoverConfig);

      const testMessage = createTestMessage();

      const result = await messagingService.sendMessage(testAgentId, testMessage, {
        tenantId: testTenantId,
        enableFailover: true,
      });

      expect(result).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('node'),
        expect.any(String)
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume message broadcasting', async () => {
      const messages = Array.from({ length: 50 }, (_, i) =>
        createTestMessage({ id: `bulk-message-${i}` })
      );

      const broadcastPromises = messages.map((message) =>
        messagingService.broadcastMessage(message, {
          tenantIds: [testTenantId, 'tenant-2'],
          priority: 'medium',
        })
      );

      const results = await Promise.allSettled(broadcastPromises);
      const successful = results.filter((r) => r.status === 'fulfilled').length;

      expect(successful).toBeGreaterThan(40); // Allow for some failures in high-volume scenario
    });

    it('should maintain performance metrics during load', async () => {
      const initialMetrics = messagingService.getMessagingMetrics();

      // Send multiple messages
      const messagePromises = Array.from({ length: 20 }, (_, i) =>
        messagingService.sendMessage(testAgentId, createTestMessage({ id: `load-test-${i}` }), {
          tenantId: testTenantId,
        })
      );

      await Promise.allSettled(messagePromises);

      const finalMetrics = messagingService.getMessagingMetrics();

      expect(finalMetrics.totalMessages).toBeGreaterThan(initialMetrics.totalMessages);
      expect(finalMetrics.averageDeliveryTime).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from Redis connection failures', async () => {
      // Simulate Redis failure
      mockRedisService.publish.mockRejectedValueOnce(new Error('Redis connection lost'));
      mockRedisService.set.mockRejectedValueOnce(new Error('Redis connection lost'));

      const testMessage = createTestMessage();

      // Should not throw error, but handle gracefully
      const result = await messagingService.sendMessage(testAgentId, testMessage, {
        tenantId: testTenantId,
      });

      expect(result).toBeDefined();
    });

    it('should handle WebSocket service failures gracefully', async () => {
      mockWsService.sendMessage.mockRejectedValueOnce(new Error('WebSocket connection failed'));

      const testMessage = createTestMessage();

      await expect(
        messagingService.sendMessage(testAgentId, testMessage, {
          tenantId: testTenantId,
        })
      ).rejects.toThrow('WebSocket connection failed');

      const metrics = messagingService.getMessagingMetrics();
      expect(metrics.failedDeliveries).toBeGreaterThan(0);
    });

    it('should handle queue synchronization conflicts', async () => {
      // Configure queue with conflict resolution
      const queueConfig: MessageQueueSyncConfig = {
        queueName: 'conflict-test-queue',
        tenantId: testTenantId,
        syncMode: 'immediate',
        conflictResolution: 'merge',
        retentionPolicy: {
          maxAge: 3600000,
          maxSize: 100,
          cleanupInterval: 300000,
        },
      };

      await messagingService.configureQueueSynchronization(queueConfig);

      // Simulate conflicting messages
      mockRedisService.lrange.mockResolvedValueOnce([
        JSON.stringify({
          message: createTestMessage({ id: 'conflict-message' }),
          queuedAt: Date.now() - 1000,
        }),
        JSON.stringify({
          message: createTestMessage({ id: 'conflict-message' }), // Same ID, different content
          queuedAt: Date.now(),
        }),
      ]);

      await messagingService.synchronizeQueues(testTenantId);

      const queueMetrics = messagingService.getQueueSyncMetrics();
      expect(queueMetrics).toBeDefined();
    });
  });

  describe('Monitoring and Observability', () => {
    it('should provide comprehensive metrics', async () => {
      // Send various types of messages
      await messagingService.sendMessage(testAgentId, createTestMessage(), {
        tenantId: testTenantId,
      });

      await messagingService.broadcastMessage(createTestMessage(), {
        tenantIds: [testTenantId, 'tenant-2'],
        crossTenant: true,
      });

      const messagingMetrics = messagingService.getMessagingMetrics();
      const failoverStats = messagingService.getFailoverStats();
      const queueMetrics = messagingService.getQueueSyncMetrics();

      expect(messagingMetrics).toHaveProperty('totalMessages');
      expect(messagingMetrics).toHaveProperty('crossTenantMessages');
      expect(failoverStats).toHaveProperty('totalNodes');
      expect(queueMetrics).toHaveProperty('totalQueues');
    });

    it('should track message delivery times accurately', async () => {
      const startTime = Date.now();

      await messagingService.sendMessage(testAgentId, createTestMessage(), {
        tenantId: testTenantId,
      });

      const metrics = messagingService.getMessagingMetrics();
      expect(metrics.averageDeliveryTime).toBeGreaterThan(0);
      expect(metrics.averageDeliveryTime).toBeLessThan(Date.now() - startTime + 100); // Allow some buffer
    });
  });

  describe('Security and Tenant Isolation', () => {
    it('should enforce tenant isolation in message routing', async () => {
      const tenant1Message = createTestMessage({
        metadata: {
          priority: 'medium',
          protocol_version: '1.0',
          sync: SyncAwareMessageUtils.createSyncMetadata({
            tenantId: 'tenant-1',
            crossTenantAllowed: false,
          }),
        },
      });

      // Should not allow cross-tenant delivery without explicit permission
      await expect(
        messagingService.sendMessage('agent-in-tenant-2', tenant1Message, {
          tenantId: 'tenant-1',
          allowCrossTenant: false,
        })
      ).rejects.toThrow();
    });

    it('should validate message integrity with checksums', async () => {
      const testMessage = createTestMessage();
      const checksum = SyncAwareMessageUtils.calculateChecksum(testMessage);

      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);

      // Verify checksum changes with message content
      const modifiedMessage = { ...testMessage, payload: { different: 'data' } };
      const modifiedChecksum = SyncAwareMessageUtils.calculateChecksum(modifiedMessage);

      expect(modifiedChecksum).not.toBe(checksum);
    });

    it('should handle message validation failures', async () => {
      const invalidMessage = {
        id: 'invalid-message',
        type: 'INVALID',
        // Missing required fields
      } as any;

      await expect(messagingService.sendMessage(testAgentId, invalidMessage)).rejects.toThrow();
    });
  });
});
