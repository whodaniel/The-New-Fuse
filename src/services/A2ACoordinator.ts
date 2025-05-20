import { createClient, RedisClientType } from '@redis/client';
import { TaskType, Priority } from './RooCodeCommunication.js';

// Basic task structure
export interface CodeTask {
  taskId: string;
  type: TaskType;
  filePath: string;
  description: string;
  priority: Priority;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  assignedAgentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export class A2ACoordinator {
  private client: RedisClientType;
  private readonly stream = 'agent_tasks';
  private readonly group = 'code_agents_group';
  private readonly registryKey = 'agent:tasks:registry';
  private readonly lockPrefix = 'lock:file:';

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    this.client.on('error', err => console.error('[A2A] Redis error', err));
  }

  // connect and create consumer group
  async initialize(): Promise<void> {
    await this.client.connect();
    console.log('[A2A] Connected to Redis');
    try {
      await this.client.xGroupCreate(this.stream, this.group, '0', { MKSTREAM: true });
      console.log(`[A2A] Consumer group '${this.group}' created`);
    } catch (err: any) {
      if (err.message.includes('BUSYGROUP')) {
        console.log(`[A2A] Consumer group '${this.group}' already exists`);
      } else {
        throw err;
      }
    }
  }

  // add a new task to the stream and registry
  async addTask(task: Omit<CodeTask, 'status' | 'assignedAgentId' | 'createdAt'>): Promise<string> {
    const now = new Date().toISOString();
    const full: CodeTask = {
      ...task,
      status: 'pending',
      createdAt: now
    };
    const id = await this.client.xAdd(this.stream, '*', { data: JSON.stringify(full) });
    await this.client.hSet(this.registryKey, id, JSON.stringify(full));
    console.log(`[A2A] Task '${id}' added:`, full);
    return id;
  }

  // update task status in registry
  async updateTaskStatus(taskId: string, status: CodeTask['status'], agentId?: string): Promise<void> {
    const raw = await this.client.hGet(this.registryKey, taskId);
    if (!raw) {
      console.warn(`[A2A] No registry entry for task ${taskId}`);
      return;
    }
    const task = JSON.parse(raw) as CodeTask;
    task.status = status;
    if (agentId) task.assignedAgentId = agentId;
    task.updatedAt = new Date().toISOString();
    await this.client.hSet(this.registryKey, taskId, JSON.stringify(task));
    console.log(`[A2A] Task '${taskId}' status updated to '${status}'`);
  }

  // worker loop for an agent instance
  async startWorker(agentId: string, handler: (task: CodeTask) => Promise<void>): Promise<void> {
    console.log(`[A2A] Worker '${agentId}' starting`);
    while (true) {
      const resp = await this.client.xReadGroup(this.group, agentId, { key: this.stream, id: '>' }, { count: 1, block: 5000 });
      let messages = [];
      if (resp && resp.length > 0) {
        messages = resp[0].messages;
      } else {
        // attempt to claim pending messages older than 1 minute
        const minIdleMs = 60000;
        try {
          const claimResult = await this.client.xAutoClaim(this.stream, this.group, agentId, minIdleMs, { count: 1 });
          messages = claimResult.messages;
          if (messages.length > 0) {
            console.log(`[A2A][${agentId}] Claimed ${messages.length} pending message(s)`);
          }
        } catch (claimErr) {
          console.error(`[A2A][${agentId}] Error auto-claiming:`, claimErr);
        }
        if (messages.length === 0) {
          continue;
        }
      }
      for (const msg of messages) {
        const taskData = JSON.parse(msg.message.data) as CodeTask;
        const taskId = msg.id;
        console.log(`[A2A][${agentId}] Received task ${taskId}`);

        // try lock
        const lockKey = `${this.lockPrefix}${taskData.filePath}`;
        const got = await this.client.set(lockKey, agentId, { NX: true, PX: 30000 });
        if (got !== 'OK') {
          console.warn(`[A2A][${agentId}] Could not lock ${taskData.filePath}`);
          await this.client.xAck(this.stream, this.group, taskId);
          continue;
        }

        // mark in-progress
        await this.updateTaskStatus(taskId, 'in-progress', agentId);

        try {
          await handler(taskData);
          await this.updateTaskStatus(taskId, 'completed');
          console.log(`[A2A][${agentId}] Completed task ${taskId}`);
        } catch (err) {
          console.error(`[A2A][${agentId}] Handler error for ${taskId}`, err);
          await this.updateTaskStatus(taskId, 'failed');
        }

        // release lock
        const lua = `if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end`;
        await this.client.eval(lua, { keys: [lockKey], arguments: [agentId] });
        console.log(`[A2A][${agentId}] Released lock on ${taskData.filePath}`);

        // ack
        await this.client.xAck(this.stream, this.group, taskId);
        console.log(`[A2A][${agentId}] Acknowledged ${taskId}`);
      }
    }
  }

  async shutdown(): Promise<void> {
    await this.client.quit();
    console.log('[A2A] Redis connection closed');
  }
}