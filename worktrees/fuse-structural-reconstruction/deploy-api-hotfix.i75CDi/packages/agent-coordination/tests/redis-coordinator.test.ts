import { RedisCoordinator } from '../src/redis-coordinator';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { AgentStatus, A2APriority } from '@the-new-fuse/a2a-core';
import { TaskStatus } from '../src/types/coordination.types';

describe('RedisCoordinator', () => {
  let coordinator: RedisCoordinator;
  let mockRedisService: jest.Mocked<UnifiedRedisService>;

  beforeEach(() => {
    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
    } as any;

    coordinator = new RedisCoordinator(mockRedisService, {
      keyPrefix: 'test:',
      heartbeatInterval: 1000,
      heartbeatTimeout: 3000,
    });
  });

  describe('Agent Registration', () => {
    it('should register an agent', async () => {
      const agentId = 'agent-1';
      const metadata = { role: 'worker' };

      await coordinator.registerAgent(agentId, metadata);

      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRedisService.sadd).toHaveBeenCalled();
    });

    it('should unregister an agent', async () => {
      const agentId = 'agent-1';

      await coordinator.unregisterAgent(agentId);

      expect(mockRedisService.srem).toHaveBeenCalled();
    });
  });

  describe('Direct Messaging', () => {
    it('should send direct message between agents', async () => {
      const fromAgent = 'agent-1';
      const toAgent = 'agent-2';
      const payload = { message: 'Hello' };

      await coordinator.sendDirectMessage(fromAgent, toAgent, payload);

      expect(mockRedisService.publish).toHaveBeenCalled();
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast message to all agents', async () => {
      const fromAgent = 'agent-1';
      const payload = { announcement: 'System update' };

      await coordinator.broadcast(fromAgent, payload);

      expect(mockRedisService.publish).toHaveBeenCalled();
    });
  });

  describe('Task Distribution', () => {
    it('should create and assign task', async () => {
      const task = {
        type: 'data-processing',
        assignedBy: 'coordinator',
        assignedTo: 'worker-1',
        payload: { data: [1, 2, 3] },
        priority: A2APriority.HIGH,
        maxRetries: 3,
      };

      mockRedisService.publish.mockResolvedValue(1);
      
      const createdTask = await coordinator.createTask(task);

      expect(createdTask).toBeDefined();
      expect(createdTask.id).toBeDefined();
      expect(createdTask.status).toBe(TaskStatus.PENDING);
    });
  });

  describe('Shared State', () => {
    it('should set and get shared state', async () => {
      const key = 'shared-config';
      const value = { setting: 'value' };
      const ownerId = 'agent-1';

      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);

      const state = await coordinator.setSharedState(key, value, ownerId);

      expect(state.key).toBe(key);
      expect(state.value).toEqual(value);
      expect(state.ownerId).toBe(ownerId);
      expect(state.version).toBe(1);
    });
  });

  describe('Metrics', () => {
    it('should track coordination metrics', () => {
      const metrics = coordinator.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.messagesPublished).toBeGreaterThanOrEqual(0);
      expect(metrics.tasksCreated).toBeGreaterThanOrEqual(0);
    });
  });
});
