import { Test, TestingModule } from '@nestjs/testing';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import { CommunicationHubFailover } from './CommunicationHubFailover';
import { MessageQueueSynchronizer } from './MessageQueueSynchronizer';
import {
  CrossTenantRoutingConfig,
  MessageFailoverConfig,
  MessageQueueSyncConfig,
  MessageSyncStatus,
  SyncAwareA2AMessage,
  SyncAwareMessageUtils,
} from './SyncAwareA2AMessage';
import { SyncAwareAgentWebSocketService } from './SyncAwareAgentWebSocketService';
import { SyncAwareMessagingService } from './SyncAwareMessagingService';

describe('SyncAwareMessagingService', () => {
  let service: SyncAwareMessagingService;
  let mockRedisService: any;
  let mockSyncAwareWebSocket: any;
  let mockQueueSynchronizer: any;
  let mockFailoverManager: any;
  let mockWsService: any;

  const mockMessage: SyncAwareA2AMessage = {
    id: 'test-message-1',
    type: 'TEST_MESSAGE',
    timestamp: Date.now(),
    sender: 'agent-1',
    recipient: 'agent-2',
    payload: { test: 'data' },
    metadata: {
      priority: 'medium',
      protocol_version: '1.0',
      sync: {
        syncId: 'sync-123',
        syncVersion: 1,
        syncTimestamp: Date.now(),
        tenantId: 'tenant-1',
        crossTenantAllowed: false,
        routingKey: 'default',
        deliveryMode: 'direct',
        requiresAck: false,
        conflictResolution: 'latest_wins',
        checksumValidation: true,
        maxRetries: 3,
        retryCount: 0,
        priority: 'medium',
        syncState: 'pending',
      },
    },
  };

  beforeEach(async () => {
    mockRedisService = {
      psubscribe: jest.fn(),
      punsubscribe: jest.fn(),
      publish: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      keys: jest.fn().mockResolvedValue([]),
    };

    mockSyncAwareWebSocket = {
      sendSyncAwareMessage: jest.fn(),
      broadcastToTenantSync: jest.fn(),
      broadcastCrossTenant: jest.fn(),
      configureCrossTenantRouting: jest.fn(),
      getMessageSyncStatus: jest.fn(),
      getDeliveryMetrics: jest.fn(),
    };

    mockQueueSynchronizer = {
      configureQueueSync: jest.fn(),
      synchronizeQueue: jest.fn(),
      synchronizeAllQueues: jest.fn(),
      getQueueSyncMetrics: jest.fn().mockReturnValue({
        totalQueues: 0,
        totalMessages: 0,
        syncedMessages: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        lastSyncTime: 0,
        conflictCount: 0,
      }),
    };

    mockFailoverManager = {
      configureFailover: jest.fn(),
      deliverWithFailover: jest.fn(),
      triggerManualFailover: jest.fn(),
      getFailoverStats: jest.fn().mockReturnValue({
        totalNodes: 0,
        healthyNodes: 0,
        failedNodes: 0,
        circuitBreakersOpen: 0,
        recentFailoverEvents: [],
      }),
    };

    mockWsService = {
      getConnectedAgents: jest.fn().mockResolvedValue(['agent-1', 'agent-2', 'agent-3']),
      getAgentTenant: jest.fn().mockResolvedValue('tenant-1'),
      sendMessage: jest.fn().mockResolvedValue(true),
      broadcastToTenant: jest.fn().mockResolvedValue(3),
      broadcastToAllAgents: jest.fn().mockResolvedValue(3),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncAwareMessagingService,
        {
          provide: 'UnifiedRedisService',
          useValue: mockRedisService,
        },
        {
          provide: SyncRedisConfig,
          useValue: {
            getKeyspatterns: () => ({
              patterns: { channelAll: 'test:*' },
              channels: { metrics: 'test:metrics' },
            }),
          },
        },
        {
          provide: SyncAwareAgentWebSocketService,
          useValue: mockSyncAwareWebSocket,
        },
        {
          provide: MessageQueueSynchronizer,
          useValue: mockQueueSynchronizer,
        },
        {
          provide: CommunicationHubFailover,
          useValue: mockFailoverManager,
        },
        {
          provide: 'IAgentWebSocketService',
          useValue: mockWsService,
        },
      ],
    }).compile();

    service = module.get<SyncAwareMessagingService>(SyncAwareMessagingService);
  });

  describe('sendMessage', () => {
    it('should send sync-aware message successfully', async () => {
      const mockSyncStatus: MessageSyncStatus = {
        messageId: 'test-message-1',
        syncId: 'sync-123',
        status: 'delivered',
        deliveredTo: ['agent-2'],
        failedDeliveries: [],
        acknowledgedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockSyncAwareWebSocket.sendSyncAwareMessage.mockResolvedValue(mockSyncStatus);

      const result = await service.sendMessage('agent-2', mockMessage, {
        tenantId: 'tenant-1',
        priority: 'high',
        requiresAck: true,
      });

      expect(result).toEqual(mockSyncStatus);
      expect(mockSyncAwareWebSocket.sendSyncAwareMessage).toHaveBeenCalledWith(
        'agent-2',
        expect.any(Object),
        expect.objectContaining({
          allowCrossTenant: undefined,
          priority: 'high',
          requiresAck: true,
          maxRetries: 3,
        })
      );
    });

    it('should use failover delivery when enabled', async () => {
      mockFailoverManager.deliverWithFailover.mockResolvedValue(true);

      const result = await service.sendMessage('agent-2', mockMessage, {
        tenantId: 'tenant-1',
        enableFailover: true,
      });

      expect(result.status).toBe('delivered');
      expect(mockFailoverManager.deliverWithFailover).toHaveBeenCalledWith(
        'tenant-1',
        expect.any(Object),
        'agent-2'
      );
    });

    it('should handle message timeout', async () => {
      const shortTimeout = 100;
      mockSyncAwareWebSocket.sendSyncAwareMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      );

      await expect(
        service.sendMessage('agent-2', mockMessage, {
          timeout: shortTimeout,
        })
      ).rejects.toThrow();
    });

    it('should track cross-tenant messages in metrics', async () => {
      const crossTenantMessage = SyncAwareMessageUtils.toSyncAware(mockMessage, {
        crossTenantAllowed: true,
      });

      const mockSyncStatus: MessageSyncStatus = {
        messageId: 'test-message-1',
        syncId: 'sync-123',
        status: 'delivered',
        deliveredTo: ['agent-2'],
        failedDeliveries: [],
        acknowledgedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockSyncAwareWebSocket.sendSyncAwareMessage.mockResolvedValue(mockSyncStatus);

      await service.sendMessage('agent-2', crossTenantMessage, {
        allowCrossTenant: true,
      });

      const metrics = service.getMessagingMetrics();
      expect(metrics.crossTenantMessages).toBe(1);
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast to multiple tenants', async () => {
      const mockSyncStatuses: MessageSyncStatus[] = [
        {
          messageId: 'test-message-1',
          syncId: 'sync-123',
          status: 'delivered',
          deliveredTo: ['agent-1', 'agent-2'],
          failedDeliveries: [],
          acknowledgedBy: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockSyncAwareWebSocket.broadcastToTenantSync.mockResolvedValue(mockSyncStatuses);

      const result = await service.broadcastMessage(mockMessage, {
        tenantIds: ['tenant-1', 'tenant-2'],
        priority: 'high',
      });

      expect(result).toHaveProperty('tenant-1');
      expect(result).toHaveProperty('tenant-2');
      expect(mockSyncAwareWebSocket.broadcastToTenantSync).toHaveBeenCalledTimes(2);
    });

    it('should handle cross-tenant broadcast', async () => {
      const crossTenantResults = {
        'tenant-1': [{ messageId: 'test-message-1', status: 'delivered' }],
        'tenant-2': [{ messageId: 'test-message-1', status: 'delivered' }],
      };

      mockSyncAwareWebSocket.broadcastCrossTenant.mockResolvedValue(crossTenantResults);

      const result = await service.broadcastMessage(mockMessage, {
        tenantIds: ['tenant-1', 'tenant-2'],
        crossTenant: true,
        priority: 'critical',
      });

      expect(result).toEqual(crossTenantResults);
      expect(mockSyncAwareWebSocket.broadcastCrossTenant).toHaveBeenCalledWith(
        ['tenant-1', 'tenant-2'],
        expect.any(Object),
        expect.objectContaining({
          sourceTenantId: 'tenant-1',
          priority: 'critical',
        })
      );
    });

    it('should handle global broadcast', async () => {
      mockSyncAwareWebSocket.sendSyncAwareMessage.mockResolvedValue({
        messageId: 'test-message-1',
        status: 'delivered',
      });

      const result = await service.broadcastMessage(mockMessage, {
        excludeAgents: ['agent-1'],
      });

      expect(result).toHaveProperty('global');
      expect(result.global).toHaveLength(2); // 3 agents - 1 excluded
    });
  });

  describe('configuration methods', () => {
    it('should configure cross-tenant messaging', async () => {
      const config: CrossTenantRoutingConfig = {
        sourceTenantId: 'tenant-1',
        targetTenantIds: ['tenant-2', 'tenant-3'],
        routingRules: [
          {
            condition: 'always',
            action: 'allow',
          },
        ],
        securityPolicy: {
          requireEncryption: true,
          allowedMessageTypes: ['TEST_MESSAGE'],
          maxMessageSize: 1024,
          rateLimiting: {
            maxMessagesPerSecond: 10,
            maxMessagesPerMinute: 100,
          },
        },
      };

      await service.configureCrossTenantMessaging(config);

      expect(mockSyncAwareWebSocket.configureCrossTenantRouting).toHaveBeenCalledWith(config);
    });

    it('should configure queue synchronization', async () => {
      const config: MessageQueueSyncConfig = {
        queueName: 'test-queue',
        tenantId: 'tenant-1',
        syncMode: 'batch',
        batchSize: 50,
        batchTimeout: 5000,
        conflictResolution: 'latest_wins',
        retentionPolicy: {
          maxAge: 86400000,
          maxSize: 1000,
          cleanupInterval: 3600000,
        },
      };

      await service.configureQueueSynchronization(config);

      expect(mockQueueSynchronizer.configureQueueSync).toHaveBeenCalledWith(config);
    });

    it('should configure failover mechanisms', async () => {
      const config: MessageFailoverConfig = {
        primaryNodes: ['node-1', 'node-2'],
        fallbackNodes: ['node-3', 'node-4'],
        healthCheckInterval: 30000,
        failoverThreshold: 3,
        recoveryThreshold: 3,
        circuitBreakerConfig: {
          enabled: true,
          failureThreshold: 5,
          recoveryTimeout: 60000,
          halfOpenMaxCalls: 3,
        },
      };

      await service.configureFailover('tenant-1', config);

      expect(mockFailoverManager.configureFailover).toHaveBeenCalledWith('tenant-1', config);
    });
  });

  describe('synchronization methods', () => {
    it('should synchronize queues for specific tenant', async () => {
      await service.synchronizeQueues('tenant-1');

      expect(mockQueueSynchronizer.synchronizeQueue).toHaveBeenCalledWith('default', 'tenant-1');
    });

    it('should synchronize all queues', async () => {
      await service.synchronizeQueues();

      expect(mockQueueSynchronizer.synchronizeAllQueues).toHaveBeenCalled();
    });
  });

  describe('status and metrics methods', () => {
    it('should get message status', async () => {
      const mockStatus: MessageSyncStatus = {
        messageId: 'test-message-1',
        syncId: 'sync-123',
        status: 'delivered',
        deliveredTo: ['agent-2'],
        failedDeliveries: [],
        acknowledgedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockSyncAwareWebSocket.getMessageSyncStatus.mockResolvedValue(mockStatus);

      const result = await service.getMessageStatus('test-message-1');

      expect(result).toEqual(mockStatus);
      expect(mockSyncAwareWebSocket.getMessageSyncStatus).toHaveBeenCalledWith('test-message-1');
    });

    it('should get messaging metrics', () => {
      const metrics = service.getMessagingMetrics();

      expect(metrics).toHaveProperty('totalMessages');
      expect(metrics).toHaveProperty('successfulDeliveries');
      expect(metrics).toHaveProperty('failedDeliveries');
      expect(metrics).toHaveProperty('crossTenantMessages');
      expect(metrics).toHaveProperty('averageDeliveryTime');
    });

    it('should get failover stats', () => {
      const stats = service.getFailoverStats();

      expect(stats).toHaveProperty('totalNodes');
      expect(stats).toHaveProperty('healthyNodes');
      expect(stats).toHaveProperty('failedNodes');
      expect(mockFailoverManager.getFailoverStats).toHaveBeenCalled();
    });

    it('should get queue sync metrics', () => {
      const metrics = service.getQueueSyncMetrics();

      expect(metrics).toHaveProperty('totalQueues');
      expect(metrics).toHaveProperty('totalMessages');
      expect(mockQueueSynchronizer.getQueueSyncMetrics).toHaveBeenCalled();
    });
  });

  describe('failover operations', () => {
    it('should trigger manual failover', async () => {
      await service.triggerFailover('tenant-1', 'node-1', 'node-2');

      expect(mockFailoverManager.triggerManualFailover).toHaveBeenCalledWith(
        'tenant-1',
        'node-1',
        'node-2'
      );

      const metrics = service.getMessagingMetrics();
      expect(metrics.failoverEvents).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle send message errors gracefully', async () => {
      mockSyncAwareWebSocket.sendSyncAwareMessage.mockRejectedValue(new Error('Network error'));

      await expect(service.sendMessage('agent-2', mockMessage)).rejects.toThrow('Network error');

      const metrics = service.getMessagingMetrics();
      expect(metrics.failedDeliveries).toBe(1);
    });

    it('should handle broadcast errors gracefully', async () => {
      mockSyncAwareWebSocket.broadcastToTenantSync.mockRejectedValue(new Error('Broadcast error'));

      await expect(
        service.broadcastMessage(mockMessage, { tenantIds: ['tenant-1'] })
      ).rejects.toThrow('Broadcast error');
    });

    it('should handle configuration errors gracefully', async () => {
      mockSyncAwareWebSocket.configureCrossTenantRouting.mockRejectedValue(
        new Error('Configuration error')
      );

      const config: CrossTenantRoutingConfig = {
        sourceTenantId: 'tenant-1',
        targetTenantIds: ['tenant-2'],
        routingRules: [],
        securityPolicy: {
          requireEncryption: false,
          allowedMessageTypes: [],
          maxMessageSize: 1024,
          rateLimiting: {
            maxMessagesPerSecond: 10,
            maxMessagesPerMinute: 100,
          },
        },
      };

      await expect(service.configureCrossTenantMessaging(config)).rejects.toThrow(
        'Configuration error'
      );
    });
  });

  describe('message enhancement', () => {
    it('should enhance message with options', async () => {
      const mockSyncStatus: MessageSyncStatus = {
        messageId: 'test-message-1',
        syncId: 'sync-123',
        status: 'delivered',
        deliveredTo: ['agent-2'],
        failedDeliveries: [],
        acknowledgedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockSyncAwareWebSocket.sendSyncAwareMessage.mockImplementation(
        (agentId, message, options) => {
          const syncMetadata = SyncAwareMessageUtils.extractSyncMetadata(message);
          expect(syncMetadata.priority).toBe('critical');
          expect(syncMetadata.requiresAck).toBe(true);
          expect(syncMetadata.crossTenantAllowed).toBe(true);
          return Promise.resolve(mockSyncStatus);
        }
      );

      await service.sendMessage('agent-2', mockMessage, {
        tenantId: 'tenant-2',
        allowCrossTenant: true,
        priority: 'critical',
        requiresAck: true,
      });

      expect(mockSyncAwareWebSocket.sendSyncAwareMessage).toHaveBeenCalled();
    });
  });
});
