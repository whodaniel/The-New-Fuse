// REDIS MIGRATION: This file has been automatically migrated to use UnifiedRedisService
// TODO: Update service injection and method calls as needed

import { PersistentMetricsCollector } from '../src/monitoring/PersistentMetricsCollector';
import { A2APriority, AgentTask, TaskStatus } from '../src/types/coordination.types';

// Mock Redis
jest.mock('ioredis');

describe('PersistentMetricsCollector', () => {
  let collector: PersistentMetricsCollector;
  let mockRedis: any;
  let mockPipeline: any;

  beforeEach(() => {
    mockPipeline = {
      incr: jest.fn(),
      incrby: jest.fn(),
      lpush: jest.fn(),
      ltrim: jest.fn(),
      expire: jest.fn(),
      hincrby: jest.fn(),
      hset: jest.fn(),
      exec: jest.fn().mockResolvedValue([]),
    };

    mockRedis = {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
      get: jest.fn(),
      mget: jest.fn(),
      hgetall: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    };

    collector = new PersistentMetricsCollector(mockRedis as unknown as Redis, 'test:');
  });

  describe('recordTaskCreated', () => {
    it('should increment task counter and add to recent list', async () => {
      const task: AgentTask = {
        id: '123',
        type: 'test-task',
        priority: A2APriority.MEDIUM,
        assignedBy: 'agent-1',
        status: TaskStatus.PENDING,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        payload: {},
      };

      await collector.recordTaskCreated(task);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.incr).toHaveBeenCalledWith('test:tasks:created');
      expect(mockPipeline.lpush).toHaveBeenCalledWith(
        'test:tasks:recent',
        expect.stringContaining('"id":"123"')
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('recordTaskCompleted', () => {
    it('should increment completed counter and update agent metrics', async () => {
      const task: AgentTask = {
        id: '123',
        type: 'test-task',
        priority: A2APriority.MEDIUM,
        assignedBy: 'agent-1',
        assignedTo: 'worker-1',
        status: TaskStatus.COMPLETED,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        payload: {},
      };

      await collector.recordTaskCompleted(task, 100);

      expect(mockPipeline.incr).toHaveBeenCalledWith('test:tasks:completed');
      expect(mockPipeline.hincrby).toHaveBeenCalledWith('test:agent:worker-1', 'completed', 1);
      expect(mockPipeline.hincrby).toHaveBeenCalledWith('test:agent:worker-1', 'totalTime', 100);
      expect(mockPipeline.incrby).toHaveBeenCalledWith('test:execution:totalTime', 100);
    });
  });

  describe('getSystemMetrics', () => {
    it('should retrieve and calculate metrics', async () => {
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('tasks:created')) return Promise.resolve('10');
        if (key.includes('tasks:completed')) return Promise.resolve('8');
        if (key.includes('tasks:failed')) return Promise.resolve('2');
        if (key.includes('execution:count')) return Promise.resolve('8');
        if (key.includes('execution:totalTime')) return Promise.resolve('800');
        return Promise.resolve(null);
      });

      mockRedis.mget.mockResolvedValue(['2', '2', '2', '2', '2']); // 10 tasks in 5 mins = 2 TPM

      const metrics = await collector.getSystemMetrics();

      expect(metrics.totalTasksCreated).toBe(10);
      expect(metrics.totalTasksCompleted).toBe(8);
      expect(metrics.averageExecutionTime).toBe(100);
      expect(metrics.tasksPerMinute).toBe(2);
    });
  });
});
