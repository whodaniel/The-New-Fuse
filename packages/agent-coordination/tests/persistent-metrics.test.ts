import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { PersistentMetricsCollector } from '../src/monitoring/PersistentMetricsCollector.js';
import { A2APriority, AgentTask, TaskStatus } from '../src/types/coordination.types.js';
import { createTestRedisService, flushPrefix } from './redis-client.js';

const PREFIX = 'test:';

describe('PersistentMetricsCollector (real redis)', () => {
  let redis: UnifiedRedisService;
  let collector: PersistentMetricsCollector;

  beforeAll(async () => {
    redis = await createTestRedisService();
  });
  afterAll(async () => {
    await redis.onModuleDestroy();
  });
  beforeEach(async () => {
    collector = new PersistentMetricsCollector(redis, PREFIX);
    await flushPrefix(redis, PREFIX);
  });

  const baseTask = (over: Partial<AgentTask> = {}): AgentTask => ({
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
    ...over,
  });

  it('recordTaskCreated increments the real tasks:created counter and stores the recent task', async () => {
    await collector.recordTaskCreated(baseTask());

    expect(await redis.get(PREFIX + 'tasks:created')).toBe('1');

    const recent = await redis.lrange(PREFIX + 'tasks:recent', 0, 0);
    expect(recent.length).toBe(1);
    expect(recent[0]).toContain('"id":"123"');
  });

  it('recordTaskCompleted updates the completed counter and per-agent stats in real redis', async () => {
    await collector.recordTaskCompleted(baseTask({ assignedTo: 'worker-1' }), 100);

    expect(await redis.get(PREFIX + 'tasks:completed')).toBe('1');
    expect(await redis.hget(PREFIX + 'agent:worker-1', 'completed')).toBe('1');
    expect(await redis.hget(PREFIX + 'agent:worker-1', 'totalTime')).toBe('100');
  });

  it('getSystemMetrics reflects the real counters stored in redis', async () => {
    await collector.recordTaskCreated(baseTask());
    await collector.recordTaskCreated(baseTask());
    await collector.recordTaskCompleted(baseTask({ assignedTo: 'w' }), 50);

    const m = await collector.getSystemMetrics();
    expect(m.totalTasksCreated).toBe(2);
    expect(m.totalTasksCompleted).toBe(1);
    expect(m.averageExecutionTime).toBe(50);
  });
});
