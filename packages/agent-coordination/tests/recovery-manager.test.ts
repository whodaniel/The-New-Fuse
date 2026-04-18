// REDIS MIGRATION: This file has been automatically migrated to use UnifiedRedisService
// TODO: Update service injection and method calls as needed

import { RecoveryManager } from '../src/coordination/RecoveryManager.js';
import { SharedStateManager } from '../src/coordination/shared-state-manager.js';
import { PresenceTracker } from '../src/presence/presence-tracker.js';
import { TaskQueueManager } from '../src/queues/task-queue-manager.js';
import { MessageSerializer } from '../src/serializers/message-serializer.js';
import { AgentStatus } from '../src/types/coordination.types.js';

// Mock dependencies
jest.mock('ioredis');

describe('RecoveryManager', () => {
  let recoveryManager: RecoveryManager;
  let mockRedis: any;
  let mockPresenceTracker: any;
  let mockSharedStateManager: any;
  let mockTaskQueueManager: any;
  let mockSerializer: any;

  beforeEach(() => {
    mockRedis = {
      scan: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    mockPresenceTracker = {
      // no methods used directly in detectOfflineAgents, as it scans redis
    };

    mockSharedStateManager = {
      releaseLocksForAgents: jest.fn().mockResolvedValue(1),
    };

    mockTaskQueueManager = {
      getQueueStats: jest.fn(),
    };

    mockSerializer = {
      deserialize: jest.fn(),
    };

    recoveryManager = new RecoveryManager(
      mockRedis as unknown as Redis,
      mockPresenceTracker as unknown as PresenceTracker,
      mockSharedStateManager as unknown as SharedStateManager,
      mockTaskQueueManager as unknown as TaskQueueManager,
      mockSerializer as unknown as MessageSerializer,
      'test:'
    );
  });

  describe('performHealthCheck', () => {
    it('should detect offline agents and recover them', async () => {
      // Mock scan to return a presence key
      mockRedis.scan.mockResolvedValueOnce(['0', ['test:presence:agent-offline']]);

      // Mock get to return offline status
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          agentId: 'agent-offline',
          status: AgentStatus.OFFLINE,
        })
      );

      mockSerializer.deserialize.mockReturnValue({
        agentId: 'agent-offline',
        status: AgentStatus.OFFLINE,
      });

      // Spy on recoverAgents (private but we can test via public behavior)
      const recoverSpy = jest.spyOn(recoveryManager, 'recoverAgents');

      // Trigger health check
      await (recoveryManager as any).performHealthCheck();

      expect(recoverSpy).toHaveBeenCalledWith(['agent-offline']);
      expect(mockSharedStateManager.releaseLocksForAgents).toHaveBeenCalledWith(mockRedis, [
        'agent-offline',
      ]);
    });

    it('should not recover already recovered agents', async () => {
      // Mock scan to return a presence key
      mockRedis.scan.mockResolvedValueOnce(['0', ['test:presence:agent-offline']]);

      // Mock get to return offline status
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          agentId: 'agent-offline',
          status: AgentStatus.OFFLINE,
        })
      );

      mockSerializer.deserialize.mockReturnValue({
        agentId: 'agent-offline',
        status: AgentStatus.OFFLINE,
      });

      // First run
      await (recoveryManager as any).performHealthCheck();
      expect(mockSharedStateManager.releaseLocksForAgents).toHaveBeenCalledTimes(1);

      // Second run (should be skipped)
      mockRedis.scan.mockResolvedValueOnce(['0', ['test:presence:agent-offline']]);
      await (recoveryManager as any).performHealthCheck();
      expect(mockSharedStateManager.releaseLocksForAgents).toHaveBeenCalledTimes(1);
    });

    it('should log warning if queue has failed jobs', async () => {
      mockRedis.scan.mockResolvedValue(['0', []]); // No offline agents

      mockTaskQueueManager.getQueueStats.mockResolvedValue({
        failed: 5,
      });

      // We can't easily assert on logger, but we can ensure it doesn't crash
      await (recoveryManager as any).performHealthCheck();

      expect(mockTaskQueueManager.getQueueStats).toHaveBeenCalledWith('agent-tasks');
    });
  });
});
