import { createClient, RedisClientType } from '@redis/client';

async function main() {
  // connect
  const client: RedisClientType = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  client.on('error', err => console.error('[Redis] Error', err));
  await client.connect();
  console.log('[Demo] Connected to Redis');

  const stream = 'agent_tasks';
  const group = 'agents_group';
  const consumerA = 'agentA';
  const consumerB = 'agentB';
  const lockKey = 'lock:demo_task';

  // 1. Create consumer group
  try {
    await client.xGroupCreate(stream, group, '0', { MKSTREAM: true });
    console.log(`[Demo] Consumer group '${group}' created`);
  } catch (err: any) {
    if (err.message.includes('BUSYGROUP')) {
      console.log(`[Demo] Consumer group '${group}' already exists`);
    } else {
      throw err;
    }
  }

  // 2. AgentA adds a task to the stream
  const msgId = await client.xAdd(stream, '*', {
    task: 'demo_task',
    payload: JSON.stringify({ action: 'refactor', file: 'src/index.ts' }),
    timestamp: Date.now().toString()
  });
  console.log(`[AgentA] Enqueued task with ID ${msgId}`);

  // 3. AgentB reads and processes one message
  const responses = await client.xReadGroup(group, consumerB, { key: stream, id: '>' }, { count: 1, block: 5000 });
  if (responses && responses.length) {
    for (const res of responses) {
      for (const msg of res.messages) {
        console.log(`[AgentB] Received message ${msg.id}`, msg.message);

        // 4. Acquire lock
        const lockAcquired = (await client.set(lockKey, consumerB, { NX: true, PX: 30000 })) === 'OK';
        if (!lockAcquired) {
          console.warn('[AgentB] Could not acquire lock, skipping');
        } else {
          console.log('[AgentB] Lock acquired, processing task...');
          // simulate work
          await new Promise(r => setTimeout(r, 1000));
          console.log('[AgentB] Task processed');

          // release lock via Lua script
          const lua = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
          await client.eval(lua, { keys: [lockKey], arguments: [consumerB] });
          console.log('[AgentB] Lock released');

          // 5. Acknowledge message
          await client.xAck(stream, group, msg.id);
          console.log(`[AgentB] Acknowledged message ${msg.id}`);
        }
      }
    }
  } else {
    console.log('[AgentB] No messages to process');
  }

  // cleanup
  await client.quit();
  console.log('[Demo] Disconnected');
  process.exit(0);
}

main().catch(err => {
  console.error('[Demo] Error', err);
  process.exit(1);
});