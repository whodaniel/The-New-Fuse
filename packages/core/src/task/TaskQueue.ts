import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

export interface Task<T = any> {
  id: string;
  type: string;
  data: T;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timedout';
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  timeout?: number;
}

export interface TaskQueueOptions {
  concurrency?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}


@Injectable()
export class TaskQueue<T = any> extends EventEmitter {
  private readonly logger = new Logger(TaskQueue.name);
  private readonly redis: Redis;
  private readonly queueKey: string;
  private readonly processingKey: string;
  private readonly completedKey: string;
  private readonly failedKey: string;
  
  private runningTasks = 0;
  private queue: Task<T>[] = [];
  private activeTasks = new Map<string, Task<T>>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly options: TaskQueueOptions = {}
  ) {
    super();
    
    this.options = {
      concurrency: 1,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.queueKey = 'task:queue';
    this.processingKey = 'task:processing';
    this.completedKey = 'task:completed';
    this.failedKey = 'task:failed';

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('task:added', (task: Task<T>) => {
      this.logger.log(`Task ${task.id} added to queue`);
      this.processQueue();
    });

    this.on('task:completed', (task: Task<T>) => {
      this.logger.log(`Task ${task.id} completed`);
      this.runningTasks--;
      this.activeTasks.delete(task.id);
      this.clearTimer(task.id);
      this.processQueue();
    });

    this.on('task:failed', ({ task, error }) => {
      this.logger.error(`Task ${task.id} failed: ${error.message}`);
      this.runningTasks--;
      this.activeTasks.delete(task.id);
      this.clearTimer(task.id);
      this.processQueue();
    });

    this.on('task:cancelled', (task: Task<T>) => {
      this.logger.log(`Task ${task.id} cancelled`);
      this.runningTasks--;
      this.activeTasks.delete(task.id);
      this.clearTimer(task.id);
      this.processQueue();
    });

    this.on('task:timedout', (task: Task<T>) => {
      this.logger.warn(`Task ${task.id} timed out`);
      this.handleTaskTimeout(task);
    });

    this.on('queue:empty', () => {
      this.logger.log('Queue is empty');
    });
  }

  async addTask(taskDetails: Omit<Task<T>, 'id' | 'status' | 'createdAt'>): Promise<Task<T>> {
    try {
      const newTask: Task<T> = {
        ...taskDetails,
        id: uuid(),
        status: 'pending',
        createdAt: new Date()
      };

      await this.redis.lpush(this.queueKey, JSON.stringify(newTask));
      this.queue.push(newTask);
      
      this.emit('task:added', newTask);
      return newTask;
    } catch (error) {
      this.logger.error(`Failed to enqueue task:`, error);
      throw error;
    }
  }

  async processQueue(): Promise<void> {
    if (this.runningTasks >= (this.options.concurrency || 1) || this.queue.length === 0) {
      if (this.queue.length === 0 && this.runningTasks === 0) {
        this.emit('queue:empty');
      }
      return;
    }

    try {
      const taskData = await this.redis.rpop(this.queueKey);
      if (!taskData) return;

      const task: Task<T> = JSON.parse(taskData);
      const queueIndex = this.queue.findIndex(t => t.id === task.id);
      if (queueIndex !== -1) {
        this.queue.splice(queueIndex, 1);
      }

      await this.startTask(task);
    } catch (error) {
      this.logger.error('Failed to dequeue task:', error);
    }
  }

  private async startTask(task: Task<T>): Promise<void> {
    try {
      task.status = 'running';
      task.startedAt = new Date();
      this.runningTasks++;
      this.activeTasks.set(task.id, task);

      await this.redis.hset(this.processingKey, task.id, JSON.stringify(task));
      this.emit('task:started', task);

      if (task.timeout) {
        this.setTaskTimeout(task);
      }
    } catch (error) {
      this.logger.error(`Failed to start task ${task.id}:`, error);
      this.runningTasks--;
      throw error;
    }
  }

  async completeTask(taskId: string, result?: any): Promise<void> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in active tasks`);
      }

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();

      await this.redis.hdel(this.processingKey, taskId);
      await this.redis.hset(this.completedKey, taskId, JSON.stringify(task));

      this.emit('task:completed', task);
    } catch (error) {
      this.logger.error(`Failed to complete task ${taskId}:`, error);
      throw error;
    }
  }

  async failTask(taskId: string, error: Error): Promise<void> {
    try {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in active tasks`);
      }

      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date();

      await this.redis.hdel(this.processingKey, taskId);
      await this.redis.hset(this.failedKey, taskId, JSON.stringify(task));

      this.emit('task:failed', { task, error });
    } catch (error) {
      this.logger.error(`Failed to mark task ${taskId} as failed:`, error);
      throw error;
    }
  }

  async cancelTask(id: string): Promise<boolean> {
    const taskIndex = this.queue.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      const task = this.queue[taskIndex];
      if (task.status === 'pending') {
        task.status = 'cancelled';
        this.queue.splice(taskIndex, 1);
        await this.redis.lrem(this.queueKey, 1, JSON.stringify(task));
        this.emit('task:cancelled', task);
        return true;
      }
    }

    const activeTask = this.activeTasks.get(id);
    if (activeTask && activeTask.status === 'running') {
      activeTask.status = 'cancelled';
      this.emit('task:cancelled', activeTask);
      return true;
    }

    return false;
  }

  getTask(id: string): Task<T> | undefined {
    return this.queue.find(task => task.id === id) || this.activeTasks.get(id);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveTasksCount(): number {
    return this.runningTasks;
  }

  async getQueueStats(): Promise<{
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const [pending, running, completed, failed] = await Promise.all([
      this.redis.llen(this.queueKey),
      this.redis.hlen(this.processingKey),
      this.redis.hlen(this.completedKey),
      this.redis.hlen(this.failedKey)
    ]);

    return { pending, running, completed, failed };
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.redis.del(this.queueKey),
      this.redis.del(this.processingKey),
      this.redis.del(this.completedKey),
      this.redis.del(this.failedKey)
    ]);

    this.queue = [];
    this.activeTasks.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.runningTasks = 0;
  }

  private setTaskTimeout(task: Task<T>): void {
    const timeout = task.timeout || this.options.timeout || 30000;
    const timer = setTimeout(() => {
      this.emit('task:timedout', task);
    }, timeout);

    this.timers.set(task.id, timer);
  }

  private clearTimer(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
  }

  private handleTaskTimeout(task: Task<T>): void {
    task.status = 'timedout';
    task.error = 'Task execution timed out';
    task.completedAt = new Date();

    this.runningTasks--;
    this.activeTasks.delete(task.id);
    this.clearTimer(task.id);

    this.emit('task:timedout', task);
  }
}