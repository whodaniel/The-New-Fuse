import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { RecoveryManager } from '../src/coordination/RecoveryManager.js';
import { SharedStateManager } from '../src/coordination/shared-state-manager.js';
import { PersistentMetricsCollector } from '../src/monitoring/PersistentMetricsCollector.js';
import { PresenceTracker } from '../src/presence/presence-tracker.js';
import { TaskQueueManager } from '../src/queues/task-queue-manager.js';
import { MessageSerializer } from '../src/serializers/message-serializer.js';
import { AgentStatus } from '../src/types/coordination.types.js';
import { createTestRedisService, flushPrefix } from './redis-client.js';

const PREFIX = 'test:';

describe('RecoveryManager (real redis)', () => {
  let redis: UnifiedRedisService;
  let recovery: RecoveryManager;
  let shared: SharedStateManager;
  let serializer: MessageSerializer;

  beforeAll(async () => {
    redis = await createTestRedisService();
  });
  afterAll(async () => {
    await redis.onModuleDestroy();
  });
  beforeEach(async () => {
    serializer = new MessageSerializer();
    const presence = new PresenceTracker(redis, { keyPrefix: PREFIX }, serializer);
    shared = new SharedStateManager(redis, PREFIX, serializer);
    const metrics = new PersistentMetricsCollector(redis, PREFIX + 'metrics:');
    const taskQueueManager = new TaskQueueManager(redis, serializer, {}, metrics);
    recovery = new RecoveryManager(redis, presence, shared, taskQueueManager, serializer, PREFIX);
    await flushPrefix(redis, PREFIX);
  });

  it('detectOfflineAgents reports no offline agents when none are present', async () => {
    const offline = await (recovery as any).detectOfflineAgents();
    expect(offline).toEqual([]);
  });

  it('recovers an offline agent and releases its real redis locks', async () => {
    // Seed a real presence key for an offline agent.
    await redis.set(
      PREFIX + 'presence:agent-offline',
      serializer.serialize({ agentId: 'agent-offline', status: AgentStatus.OFFLINE })
    );

    // Acquire a real lock owned by that agent.
    await shared.acquireLock('doc-1', 'agent-offline', 30);
    expect(await shared.isLocked('doc-1')).toBe(true);

    await (recovery as any).performHealthCheck();

    // The lock is released from real redis.
    expect(await shared.isLocked('doc-1')).toBe(false);
  });
});
