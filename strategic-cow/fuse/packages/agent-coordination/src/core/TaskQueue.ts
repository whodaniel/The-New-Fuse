import Bull, { Job, JobOptions, Queue } from 'bull';
import { EventEmitter } from 'events';
import { QueueStats, Task, TaskPriority, TaskStatus } from './types';

/**
 * Priority-based task queue using Bull
 */
export class TaskQueue extends EventEmitter {
  private queues: Map<TaskPriority, Queue<Task>>;
  private redisConfig: Bull.QueueOptions;

  constructor(
    redisUrl: string = 'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570'
  ) {
    super();

    this.redisConfig = {
      redis: redisUrl,
    };

    this.queues = new Map();
    this.initializeQueues();
  }

  /**
   * Initialize priority queues
   */
  private initializeQueues(): void {
    Object.values(TaskPriority)
      .filter((value) => typeof value === 'number')
      .forEach((priority) => {
        const queue = new Bull<Task>(`tasks:priority:${priority}`, this.redisConfig);

        queue.on('completed', (job: Job<Task>) => {
          this.emit('task:completed', job.data);
        });

        queue.on('failed', (job: Job<Task>, err: Error) => {
          this.emit('task:failed', job.data, err);
        });

        queue.on('progress', (job: Job<Task>, progress: number) => {
          this.emit('task:progress', job.data, progress);
        });

        this.queues.set(priority as TaskPriority, queue);
      });
  }

  /**
   * Add a task to the queue
   */
  async addTask(task: Task, options?: JobOptions): Promise<Job<Task>> {
    const queue = this.queues.get(task.priority);
    if (!queue) {
      throw new Error(`Invalid priority: ${task.priority}`);
    }

    const jobOptions: JobOptions = {
      priority: task.priority,
      attempts: task.maxRetries || 3,
      timeout: task.timeout || 60000,
      removeOnComplete: false,
      removeOnFail: false,
      ...options,
    };

    const job = await queue.add(task, jobOptions);
    this.emit('task:queued', task);

    return job;
  }

  /**
   * Get next available task based on priority
   */
  async getNextTask(): Promise<Task | null> {
    // Check queues in priority order
    const priorities = [
      TaskPriority.CRITICAL,
      TaskPriority.HIGH,
      TaskPriority.NORMAL,
      TaskPriority.LOW,
      TaskPriority.BACKGROUND,
    ];

    for (const priority of priorities) {
      const queue = this.queues.get(priority);
      if (!queue) continue;

      const waiting = await queue.getWaitingCount();
      if (waiting > 0) {
        const job = await queue.getNextJob();
        if (job) {
          return job.data;
        }
      }
    }

    return null;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(taskId);
      if (job) {
        return job.data;
      }
    }
    return null;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(taskId);
      if (job) {
        await job.update({
          ...job.data,
          status,
          updatedAt: new Date(),
        });
        this.emit('task:updated', job.data);
        return;
      }
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(taskId);
      if (job) {
        await job.remove();
        this.emit('task:cancelled', job.data);
        return true;
      }
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  async getStatistics(): Promise<
    {
      priority: TaskPriority;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    }[]
  > {
    const stats: QueueStats[] = [];

    for (const [priority, queue] of this.queues.entries()) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      stats.push({
        priority,
        waiting,
        active,
        completed,
        failed,
      });
    }

    return stats;
  }

  /**
   * Get total queue depth
   */
  async getQueueDepth(): Promise<number> {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += await queue.getWaitingCount();
    }
    return total;
  }

  /**
   * Pause all queues
   */
  async pauseAll(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.pause()));
    this.emit('queues:paused');
  }

  /**
   * Resume all queues
   */
  async resumeAll(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.resume()));
    this.emit('queues:resumed');
  }

  /**
   * Clean completed/failed jobs
   */
  async clean(grace: number = 5000): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
    }
  }

  /**
   * Close all queues
   */
  async close(): Promise<void> {
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
    this.removeAllListeners();
  }
}
