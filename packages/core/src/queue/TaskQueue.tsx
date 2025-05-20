import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';
import { Task, TaskPriority, TaskStatus } from '@the-new-fuse/types';
import { v4 as uuidv4 } from 'uuid';

export class TaskQueue {
  private redis: Redis;
  private logger: Logger;
  private readonly queueKey = 'task:queue';
  private readonly processingKey = 'task:processing';
  private readonly completedKey = 'task:completed';
  private isProcessing = false;

  constructor(private config: {
    redisUrl: string;
    maxRetries: number;
    processingTimeout: number;
    batchSize: number;
  }) {
    this.redis = new Redis(config.redisUrl);
    this.logger = new Logger('CoreQueueTaskQueue');
  }

  async addTask(task: Task, priority: TaskPriority = TaskPriority.NORMAL): Promise<string> {
    const taskId = uuidv4();
    const taskData = {
      ...task,
      id: taskId,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    const score = Date.now() + (priority * 1000);

    await this.redis.zadd(this.queueKey, score, JSON.stringify(taskData));

    return taskId;
  }

  async getNextTask(): Promise<Task | null> {
    const taskData = await this.redis.zpopmin(this.queueKey);
    if (!taskData) return null;

    const task: Task = JSON.parse(taskData[0]);
    task.status = TaskStatus.PROCESSING;
    task.startedAt = new Date().toISOString();

    await this.redis.hset(this.processingKey, task.id, JSON.stringify(task));

    return task;
  }

  async completeTask(taskId: string, result: unknown): Promise<void> {
    const taskData = await this.redis.hget(this.processingKey, taskId);
    if (!taskData) throw new Error(`Task ${taskId} not found in processing`);

    const task: Task = JSON.parse(taskData);
    const completedTask = {
      ...task,
      status: TaskStatus.COMPLETED,
      result,
      completedAt: new Date().toISOString()
    };

    await Promise.all([
      this.redis.hdel(this.processingKey, taskId),
      this.redis.hset(this.completedKey, taskId, JSON.stringify(completedTask))
    ]);
  }

  async failTask(taskId: string, error: Error): Promise<void> {
    const taskData = await this.redis.hget(this.processingKey, taskId);
    if (!taskData) throw new Error(`Task ${taskId} not found in processing`);

    const task: Task = JSON.parse(taskData);
    const failedTask = {
      ...task,
      status: TaskStatus.FAILED,
      error: error.message,
      failedAt: new Date().toISOString()
    };

    await Promise.all([
      this.redis.hdel(this.processingKey, taskId),
      this.redis.hset(this.completedKey, taskId, JSON.stringify(failedTask))
    ]);
  }
}