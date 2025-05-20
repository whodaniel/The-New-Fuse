import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { TaskPriority, TaskStatus } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@the-new-fuse/utils';
import { EventEmitter } from 'events';

interface TaskMetadata {
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number;
  error?: string;
}

interface TaskWithTimestamp extends Omit<Task<any>, 'metadata'> {
  metadata: TaskMetadata;
}

interface TaskQueueOptions<T> {
  concurrency?: number;
  priorityQueue?: boolean;
  taskTimeout?: number;
  onTaskSuccess?: (result: any, task: Task<T>) => void;
  onTaskError?: (error: Error, task: Task<T>) => void;
  onQueueEmpty?: () => void;
  onQueueDrained?: () => void;
}

interface Task<T> {
  id: string;
  payload: T;
  priority?: number;
  retries?: number;
  timeout?: number;
  execute: () => Promise<any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timedout' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
  result?: any;
  type?: string;
}

interface TaskQueueEvents<T> {
  'task:added': (task: Task<T>) => void;
  'task:started': (task: Task<T>) => void;
  'task:completed': (task: Task<T>) => void;
  'task:failed': (data: { task: Task<T>, error: Error }) => void;
  'task:cancelled': (task: Task<T>) => void;
}

@Injectable()
export class TaskQueue<T> extends EventEmitter {
  private redis: Redis;
  private logger: Logger;
  private readonly queueKey = 'task:queue';
  private readonly processingKey = 'task:processing';
  private readonly completedKey = 'task:completed';
  private options: TaskQueueOptions<T>;
  private queue: Task<T>[] = [];
  private runningTasks: number = 0;
  private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private activeTasks: Map<string, Task<T>> = new Map();
  private context: any; // Context for task execution

  constructor() {
    super(); // Call EventEmitter constructor
    const redisUrl = (process as any).env.REDIS_URL || 'redis://localhost:6379/0';
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true
    });
    this.logger = new Logger('TaskQueue');
    this.options = {
      concurrency: 1,
      priorityQueue: false,
      taskTimeout: 0,
    };
  }

  async enqueue(task: TaskWithTimestamp): Promise<void> {
    try {
      const score = this.calculatePriorityScore(task);
      await this.redis.zadd(this.queueKey, score, JSON.stringify(task));
      this.logger.debug(`Task ${task.id} enqueued with priority score ${score}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enqueue task ${task.id}:`, { error: errorMessage });
      throw error;
    }
  }

  async dequeue(): Promise<TaskWithTimestamp | null> {
    try {
      const results = await this.redis.zpopmax(this.queueKey);
      if (!results || results.length === 0) {
        return null;
      }
      const taskString = results[0];
      const task = JSON.parse(taskString) as TaskWithTimestamp;

      task.status = TaskStatus.IN_PROGRESS;
      if (!(task as any).metadata) { (task as any).metadata = {}; }
      (task as any).metadata.startedAt = new Date();
      await this.redis.hset(this.processingKey, task.id, JSON.stringify(task));
      this.logger.debug(`Task ${task.id} dequeued and moved to processing`);
      return task;
    } catch (error) {
      this.logger.error('Failed to dequeue task', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  async complete(task: TaskWithTimestamp): Promise<void> {
    try {
      await this.redis.hdel(this.processingKey, task.id);
      (task as any).metadata.actualDuration = Date.now() - task.metadata.startedAt!.getTime();
      await this.redis.hset(this.completedKey, task.id, JSON.stringify(task));
      this.logger.debug(`Task ${task.id} marked as completed`);
    } catch (error) {
      const errorMessage = String(error);
      this.logger.error(`Failed to complete task ${task.id}:`, { error: errorMessage });
      throw error;
    }
  }

  async fail(task: TaskWithTimestamp, error: Error): Promise<void> {
    try {
      await this.redis.hdel(this.processingKey, task.id);
      task.status = TaskStatus.FAILED;
      (task as any).metadata.completedAt = new Date();
      (task as any).metadata.error = error instanceof Error ? error.message : String(error);
      await this.redis.hset(this.completedKey, task.id, JSON.stringify(task));
      this.logger.debug(`Task ${task.id} marked as failed`);
    } catch (err) {
      const errorMessage = String(err);
      this.logger.error(`Failed to mark task ${task.id} as failed:`, { error: errorMessage });
      throw err;
    }
  }

  private calculatePriorityScore(task: TaskWithTimestamp): number {
    const priorityMap: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 1,
      [TaskPriority.NORMAL]: 2,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.URGENT]: 4,
    };
    return priorityMap[task.priority as TaskPriority] || priorityMap[TaskPriority.NORMAL];
  }

  async cleanup(maxAge: number = 2): Promise<void> {
    const now = Date.now();
    const twoDaysAgo = now - (maxAge * 24 * 60 * 60 * 1000);

    try {
      const completedTasks = await this.redis.hgetall(this.completedKey);
      for (const [taskId, taskJson] of Object.entries(completedTasks)) {
        const task = JSON.parse(taskJson);
        if ((task as any).metadata?.startedAt && new Date(task.metadata.startedAt).getTime() < twoDaysAgo) {
          await this.redis.hdel(this.completedKey, taskId);
          this.logger.debug(`Cleaned up old completed task ${taskId}`);
        }
      }

      const processingTasks = await this.redis.hgetall(this.processingKey);
      for (const [taskId, taskJson] of Object.entries(processingTasks)) {
        const task = JSON.parse(taskJson);
        if ((task as any).metadata?.startedAt && new Date(task.metadata.startedAt).getTime() < twoDaysAgo) {
          await this.redis.hdel(this.processingKey, taskId);
          this.logger.debug(`Cleaned up stuck processing task ${taskId}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to clean up tasks:`, { error: errorMessage });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  public addTask(taskDetails: Omit<Task<T>, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt' | 'retries' | 'execute' | 'priority'> & { execute: (context: any) => Promise<T>; priority?: number }): Task<T> {
    const newTask: Task<T> = {
      id: uuidv4(),
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      retries: 0,
      priority: taskDetails.priority || 0,
      ...taskDetails,
      startedAt: undefined,
      completedAt: undefined,
      result: undefined,
      error: undefined,
    };
    this.queue.push(newTask);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.logger.info(`Task ${newTask.id} of type ${newTask.type} added to queue`);
    this.emit('task:added', newTask);
    this.processQueue();
    return newTask;
  }

  private async processQueue(): Promise<void> {
    if (this.runningTasks >= (this.options.concurrency ?? 1) || this.queue.length === 0) {
      if (this.runningTasks === 0 && this.queue.length === 0) {
        this.options.onQueueDrained?.();
      }
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.runningTasks++;
    task.status = 'running';
    task.startedAt = new Date();
    this.activeTasks.set(task.id, task);

    const taskTimeoutDuration = task.timeout ?? this.options.taskTimeout;
    if (taskTimeoutDuration && taskTimeoutDuration > 0) {
      const timeoutId = setTimeout(() => {
        this.handleTaskTimeout(task);
      }, taskTimeoutDuration);
      this.taskTimeouts.set(task.id, timeoutId);
    }

    try {
      this.logger.debug(`Executing task ${task.id} of type ${task.type}`);
      task.status = 'running';
      task.startedAt = new Date();
      this.emit('task:started', task);

      const result = await task.execute();
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      this.emit('task:completed', task);
      this.logger.info(`Task ${task.id} completed successfully`);
      this.handleTaskSuccess(task, result);
    } catch (error: any) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error;
      this.emit('task:failed', { task, error });
      this.logger.error(`Task ${task.id} failed: ${error.message}`, error);
      this.handleTaskError(task, error);
    }
  }

  public getTask(id: string): Task<T> | undefined {
    return this.queue.find(task => task.id === id) || this.activeTasks.get(id);
  }

  public cancelTask(id: string): boolean {
    const taskIndex = this.queue.findIndex(task => task.id === id);
    if (taskIndex > -1) {
      const task = this.queue[taskIndex];
      if (task.status === 'pending') {
        this.queue.splice(taskIndex, 1);
        task.status = 'cancelled';
        this.emit('task:cancelled', task);
        this.logger.info(`Task ${id} cancelled from queue`);
        return true;
      }
    }
    // If task is active, it might be more complex to cancel
    // For now, we only cancel pending tasks
    this.logger.warn(`Task ${id} could not be cancelled (not pending or not found)`);
    return false;
  }

  public override on<K extends keyof TaskQueueEvents<T>>(event: K, listener: TaskQueueEvents<T>[K]): this {
    return super.on(event, listener);
  }

  public override emit<K extends keyof TaskQueueEvents<T>>(event: K, ...args: Parameters<TaskQueueEvents<T>[K]>): boolean {
    return super.emit(event, ...args);
  }

  private handleTaskSuccess(task: Task<T>, result: any): void {
    this.clearTaskTimeout(task.id);
    task.status = 'completed';
    task.completedAt = new Date();
    this.runningTasks--;
    this.options.onTaskSuccess?.(result, task);
    this.processQueue();
    if (this.queue.length === 0 && this.runningTasks === 0) {
      this.options.onQueueEmpty?.();
    }
  }

  private handleTaskError(task: Task<T>, error: Error): void {
    this.clearTaskTimeout(task.id);
    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();
    this.runningTasks--;
    this.options.onTaskError?.(error, task);
    this.processQueue();
    if (this.queue.length === 0 && this.runningTasks === 0) {
      this.options.onQueueEmpty?.();
    }
  }

  private handleTaskTimeout(task: Task<T>): void {
    task.status = 'timedout';
    task.error = new Error('Task timed out');
    task.completedAt = new Date();
    this.runningTasks--;
    this.options.onTaskError?.(task.error, task);
    this.taskTimeouts.delete(task.id);
    this.processQueue();
    if (this.queue.length === 0 && this.runningTasks === 0) {
      this.options.onQueueEmpty?.();
    }
  }

  private clearTaskTimeout(taskId: string): void {
    const timeoutId = this.taskTimeouts.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.taskTimeouts.delete(taskId);
    }
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getRunningTasks(): number {
    return this.runningTasks;
  }
}
