import Queue from 'bull';

// Enum from backend (mirrored)
export enum SystemQueueName {
  EMAIL = 'email',
  AGENT_EXECUTION = 'agent-execution',
  REPORT_GENERATION = 'report-generation',
  DATA_SYNC = 'data-sync',
  CLEANUP = 'cleanup',
}

export class SystemQueueService {
  private queues: Map<string, Queue.Queue> = new Map();
  private redisUrl: string;

  constructor(redisUrl?: string) {
    this.redisUrl =
      redisUrl ||
      process.env.REDIS_URL ||
      process.env.CLOUD_RUNTIME_REDIS_URL ||
      process.env.LIVE_REDIS_URL ||
      process.env.REDIS_PRIVATE_URL ||
      process.env.REDIS_TLS_URL ||
      'redis://localhost:6379';
    this.initializeQueues();
  }

  private initializeQueues() {
    Object.values(SystemQueueName).forEach((queueName) => {
      this.queues.set(
        queueName,
        new Queue(queueName, this.redisUrl, {
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
          },
        })
      );
    });
  }

  /**
   * Dispatches a system task to the backend via Redis/Bull
   */
  async dispatchTask(queueName: SystemQueueName, type: string, payload: any): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(type, payload);
    return job.id?.toString() || 'unknown';
  }

  /**
   * Helper for Agent Execution
   */
  async scheduleAgentExecution(agentId: string, task: string, context: any) {
    return this.dispatchTask(SystemQueueName.AGENT_EXECUTION, 'execute', {
      agentId,
      task,
      context,
      timestamp: Date.now(),
    });
  }

  async close() {
    await Promise.all(parse(this.queues.values()).map((q) => q.close()));
  }
}

// Helper to iterate values if target is ES5... but we are in modern node.
function parse(iterator: IterableIterator<Queue.Queue>) {
  return Array.from(iterator);
}
