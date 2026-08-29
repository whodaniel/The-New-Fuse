import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { RedisCoordinator } from '../src/redis-coordinator.js';
import { A2APriority, TaskStatus } from '../src/types/coordination.types.js';
import { createTestRedisService, flushPrefix } from './redis-client.js';

const PREFIX = 'test:';

describe('RedisCoordinator (real redis)', () => {
  let redis: UnifiedRedisService;
  let coordinator: RedisCoordinator;

  beforeAll(async () => {
    redis = await createTestRedisService();
  });
  afterAll(async () => {
    await redis.onModuleDestroy();
  });
  beforeEach(async () => {
    coordinator = new RedisCoordinator(redis, {
      keyPrefix: PREFIX,
      heartbeatInterval: 1000,
      heartbeatTimeout: 3000,
    });
    await coordinator.onModuleInit();
    await flushPrefix(redis, PREFIX);
  });
  afterEach(async () => {
    await coordinator.onModuleDestroy().catch(() => undefined);
  });

  it('registers an agent in real redis (presence written, active count incremented)', async () => {
    await coordinator.registerAgent('agent-1', { role: 'worker' });

    expect(await redis.get(PREFIX + 'presence:agent-1')).not.toBeNull();
    expect(coordinator.getMetrics().activeAgents).toBeGreaterThanOrEqual(1);
  });

  it('unregisters an agent: marks presence offline and removes from active set', async () => {
    await coordinator.registerAgent('agent-1', { role: 'worker' });
    await coordinator.unregisterAgent('agent-1');

    // Presence key is retained as an offline tombstone (by design — RecoveryManager
    // relies on it to detect offline agents and release their locks/tasks).
    const raw = await redis.get(PREFIX + 'presence:agent-1');
    expect(raw).not.toBeNull();
    const presence = JSON.parse(raw!);
    expect(presence.status).toBe('offline');

    // Agent must be removed from the active set.
    const isActive = await redis.sismember(PREFIX + 'agents:active', 'agent-1');
    expect(isActive).toBe(false);
  });

  it('sends a direct message through real pub/sub without error', async () => {
    await expect(
      coordinator.sendDirectMessage('agent-1', 'agent-2', { message: 'hello' })
    ).resolves.not.toThrow();
  });

  it('creates and assigns a task persisted in real redis', async () => {
    const task = await coordinator.createTask({
      type: 'data-processing',
      assignedBy: 'coordinator',
      assignedTo: 'worker-1',
      payload: { data: [1, 2, 3] },
      priority: A2APriority.HIGH,
      maxRetries: 3,
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe(TaskStatus.PENDING);
  });

  it('sets and gets shared state with an incremented version in real redis', async () => {
    const state = await coordinator.setSharedState(
      'shared-config',
      { setting: 'value' },
      'agent-1'
    );

    expect(state.key).toBe('shared-config');
    expect(state.version).toBe(1);
    expect(state.value).toEqual({ setting: 'value' });

    const raw = await redis.get(PREFIX + 'state:shared-config');
    expect(raw).not.toBeNull();
  });

  it('exposes coordination metrics', () => {
    const m = coordinator.getMetrics();
    expect(m).toBeDefined();
    expect(m.messagesPublished).toBeGreaterThanOrEqual(0);
  });
});
