import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import { Queue, QueueEvents, Worker } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

import { TaskStatus } from '../types/coordination.types';
import { PersistentMetricsCollector } from '../monitoring/PersistentMetricsCollector';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

import type { Job } from 'bullmq';
import type { MessageSerializer } from '../serializers/message-serializer';
import type { AgentTask, QueueConfig, TaskProcessor } from '../types/coordination.types';

/**
 * Task queue manager using BullMQ
 */
export class TaskQueueManager extends EventEmitter {
  private readonly logger = new Logger(TaskQueueManager.name);
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();
  private readonly queueEvents: Map<string, QueueEvents> = new Map();
  private readonly processors: Map<string, TaskProcessor> = new Map();
  private readonly serializer: MessageSerializer;
  private readonly redisConnection: any;

  constructor(
    private readonly redisService: UnifiedRedisService,
    serializer: MessageSerializer,
    private readonly defaultConfig: Partial<QueueConfig> = {},
    private readonly metricsCollector?: PersistentMetricsCollector
  ) {
    super();
    this.redisConnection = redisService.getClient();
    this.serializer = serializer;
  }

  /**
   * Create or get a queue
   */
  async createQueue(name: string, config?: Partial<QueueConfig>): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name) as Queue;
    }

    const queueConfig = { ...this.defaultConfig, ...config };

    const queue = new Queue(name, {
      connection: this.redisConnection as any,
      defaultJobOptions: {
        attempts: queueConfig.maxRetries || 3,
        backoff: {
          type: 'exponential',
          delay: queueConfig.retryDelay || 1000,
        },
        removeOnComplete: queueConfig.removeOnComplete !== false ? 100 : false,
        removeOnFail: queueConfig.removeOnFail !== false ? 100 : false,
      },
    });

    this.queues.set(name, queue);

    // Set up queue events
    const events = new QueueEvents(name, { connection: this.redisConnection as any });
    this.queueEvents.set(name, events);

    this.setupQueueEventHandlers(name, events);

    this.logger.log(`Queue created: ${name}`);
    return queue;
  }

  /**
   * Register task processor
   */
  async registerProcessor(
    queueName: string,
    processor: TaskProcessor,
    config?: Partial<QueueConfig>
  ): Promise<void> {
    const queueConfig = { ...this.defaultConfig, ...config };

    // Ensure queue exists
    await this.createQueue(queueName, queueConfig);

    // Create worker
    const worker = new Worker(
      queueName,
      async (job: Job) => {
        const task = job.data as AgentTask;
        const startTime = Date.now();

        try {
          this.logger.debug(`Processing task ${task.id} of type ${task.type}`);

          task.status = TaskStatus.IN_PROGRESS;
          task.updatedAt = Date.now();

          const result = await processor(task);

          task.status = TaskStatus.COMPLETED;
          task.completedAt = Date.now();
          task.result = result;
          task.updatedAt = Date.now();

          const duration = Date.now() - startTime;
          if (this.metricsCollector) {
            await this.metricsCollector.recordTaskCompleted(task, duration);
          }

          return result;
        } catch (error) {
          task.status = TaskStatus.FAILED;
          task.error = error instanceof Error ? error.message : String(error);
          task.updatedAt = Date.now();

          if (this.metricsCollector) {
            await this.metricsCollector.recordTaskFailed(task, task.error);
          }

          throw error;
        }
      },
      {
        connection: this.redisConnection as any,
        concurrency: queueConfig.concurrency || 1,
        autorun: true,
      }
    );

    this.workers.set(queueName, worker);
    this.processors.set(queueName, processor);

    this.logger.log(`Processor registered for queue: ${queueName}`);
  }

  /**
   * Add task to queue
   */
  async addTask(
    queueName: string,
    task: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'retryCount'>
  ): Promise<AgentTask> {
    const queue = await this.createQueue(queueName);

    // Extract maxRetries to avoid duplication when spreading taskRest
    const { maxRetries, ...taskRest } = task as any;
    const fullTask: AgentTask = {
      ...taskRest,
      id: uuidv4(),
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      maxRetries: (maxRetries ?? 3) as number,
    };

    await queue.add(task.type, fullTask, {
      priority: this.mapPriorityToNumber(fullTask.priority),
      jobId: fullTask.id,
    });

    this.logger.debug(`Task added to queue ${queueName}: ${fullTask.id}`);
    return fullTask;
  }

  /**
   * Get task status
   */
  async getTaskStatus(queueName: string, taskId: string): Promise<AgentTask | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    const job = await queue.getJob(taskId);
    if (!job) {
      return null;
    }

    return job.data as AgentTask;
  }

  /**
   * Cancel task
   */
  async cancelTask(queueName: string, taskId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    const job = await queue.getJob(taskId);
    if (!job) {
      return false;
    }

    const task = job.data as AgentTask;
    task.status = TaskStatus.CANCELLED;
    task.updatedAt = Date.now();

    await job.remove();
    this.logger.debug(`Task cancelled: ${taskId}`);

    return true;
  }

  /**
   * Retry failed task
   */
  async retryTask(queueName: string, taskId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    const job = await queue.getJob(taskId);
    if (!job) {
      return false;
    }

    const task = job.data as AgentTask;

    if (task.retryCount >= task.maxRetries) {
      this.logger.warn(`Task ${taskId} exceeded max retries`);
      return false;
    }

    task.status = TaskStatus.RETRY;
    task.retryCount++;
    task.updatedAt = Date.now();
    task.error = undefined;

    await job.retry();
    this.logger.debug(`Task retry initiated: ${taskId} (attempt ${task.retryCount})`);

    return true;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return null;
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`Queue paused: ${queueName}`);
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`Queue resumed: ${queueName}`);
    }
  }

  /**
   * Clean queue (remove completed/failed jobs)
   */
  async cleanQueue(
    queueName: string,
    grace: number = 3600000,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return 0;
    }

    const jobs = await queue.clean(grace, 100, status);
    this.logger.log(`Cleaned ${jobs.length} ${status} jobs from queue: ${queueName}`);

    return jobs.length;
  }

  /**
   * Close all queues and workers
   */
  async close(): Promise<void> {
    this.logger.log('Closing task queue manager...');

    // Close all workers
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      this.logger.log(`Worker closed: ${name}`);
    }
    this.workers.clear();

    // Close all queue events
    for (const [name, events] of this.queueEvents.entries()) {
      await events.close();
      this.logger.log(`Queue events closed: ${name}`);
    }
    this.queueEvents.clear();

    // Close all queues
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      this.logger.log(`Queue closed: ${name}`);
    }
    this.queues.clear();

    this.processors.clear();
    this.logger.log('Task queue manager closed');
  }

  /**
   * Map A2A priority to BullMQ priority number
   */
  private mapPriorityToNumber(priority: number): number {
    // Lower number = higher priority in BullMQ
    return priority;
  }

  /**
   * Setup queue event handlers
   */
  private setupQueueEventHandlers(queueName: string, events: QueueEvents): void {
    events.on('completed', ({ jobId }) => {
      this.logger.debug(`Job completed in queue ${queueName}: ${jobId}`);
    });

    events.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`Job failed in queue ${queueName}: ${jobId}`, failedReason);
    });

    events.on('progress', ({ jobId, data }) => {
      this.logger.debug(`Job progress in queue ${queueName}: ${jobId}`, data);
    });

    events.on('waiting', ({ jobId }) => {
      this.logger.debug(`Job waiting in queue ${queueName}: ${jobId}`);
    });

    events.on('active', ({ jobId }) => {
      this.logger.debug(`Job active in queue ${queueName}: ${jobId}`);
    });

    events.on('stalled', ({ jobId }) => {
      this.logger.warn(`Job stalled in queue ${queueName}: ${jobId}`);
      this.emit('task:stalled', jobId, queueName);
    });
  }

  /**
   * Listen for stalled tasks
   */
  onTaskStalled(callback: (jobId: string, queueName: string) => void): void {
    this.on('task:stalled', callback);
  }

  /**
   * Fail active and waiting tasks for a specific agent
   */
  async failTasksForAgent(queueName: string, agentId: string, reason: string): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    let count = 0;

    // Check waiting, delayed and active jobs
    // Note: getJobs can be expensive on large queues. Ideally, we should use a secondary index.
    const jobs = await queue.getJobs(['waiting', 'delayed', 'active']);

    for (const job of jobs) {
      const task = job.data as AgentTask;

      if (task.assignedTo === agentId) {
        try {
          // Force fail the job
          // For active jobs, if locked by another worker (the dead agent), this might fail with "Missing lock".
          // In that case, we rely on BullMQ's stall detection to eventually release/fail it.
          await job.moveToFailed(new Error(reason), job.token || '0', true);
          count++;
          this.logger.log(`Failed task ${task.id} for offline agent ${agentId}`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes('Missing lock')) {
            this.logger.debug(`Could not fail active task ${task.id} immediately (lock held). Waiting for stall detection.`);
          } else {
            this.logger.warn(`Failed to fail task ${task.id}: ${msg}`);
          }
        }
      }
    }

    return count;
  }
}
