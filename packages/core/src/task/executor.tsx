import { Injectable, OnModuleInit } from '@nestjs/common';
import { Task, TaskStatus, TaskResult } from './types.js';
import { PriorityQueue } from './queue.js';
import { TaskScheduler } from './scheduler.js';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../services/redis.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TaskExecutor implements OnModuleInit {
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly executors: Map<string, Function> = new Map();
  private isRunning: boolean = false;

  constructor(
    private readonly queue: PriorityQueue,
    private readonly scheduler: TaskScheduler,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.maxRetries = this.configService.get('TASK_MAX_RETRIES', 3);
    this.retryDelay = this.configService.get('TASK_RETRY_DELAY_MS', 1000);
  }

  onModuleInit(): Promise<any> {
    // Start processing tasks
    return this.start();
  }

  registerExecutor(type: string, executor: Function): void {
    this.executors.set(type, executor);
  }

  async start(): Promise<any> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    return this.processNextTask();
  }

  async stop(): Promise<any> {
    this.isRunning = false;
  }

  private async processNextTask(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Get next scheduled task
      const task = await this.queue.getNextTask();

      if (!task) {
        // No tasks available, wait and try again
        setTimeout(() => this.processNextTask(), 1000);
        return;
      }

      await this.executeTask(task);
    } catch (error) {
      console.error('Error processing task:', error);
    } finally {
      // Process next task if still running
      if (this.isRunning) {
        setImmediate(() => this.processNextTask());
      }
    }
  }

  private async executeTask(task: Task): Promise<void> {
    const executor = this.executors.get(task.type);
    
    if (!executor) {
      console.error(`No executor registered for task type ${task.type}`);
      return;
    }

    // Update task status
    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();
    await this.queue.update(task);

    try {
      // Emit task started event
      this.eventEmitter.emit('task.started', task);

      const startTime = Date.now();
      const result = await this.executeWithRetry(task, executor);
      const endTime = Date.now();

      // Update task with result
      task.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
      task.completedAt = new Date();
      task.result = {
        ...result,
        metrics: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration: endTime - startTime,
        },
      };

      // Emit task completion event
      this.eventEmitter.emit(
        result.success ? 'task.completed' : 'task.failed',
        task,
      );
    } catch (error) {
      // Handle execution error
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          startTime: task.startedAt,
          endTime: new Date(),
          duration: Date.now() - (task.startedAt as any).getTime(),
        },
      };

      // Emit task failed event
      this.eventEmitter.emit('task.failed', task);
    } finally {
      // Update task in queue
      await this.queue.update(task);
    }
  }

  private async executeWithRetry(
    task: Task,
    executor: Function,
  ): Promise<TaskResult> {
    let lastError: Error | null = null;
    const maxRetries = (task as any).metadata?.maxRetries ?? this.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await executor(task);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)),
          );
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    };
  }

  async getTaskProgress(taskId: string): Promise<number> {
    const task = await this.queue.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    return (task as any).metadata?.progress || 0;
  }

  async updateTaskProgress(
    taskId: string,
    progress: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const task = await this.queue.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!task.metadata) {
      task.metadata = {};
    }
    
    task.metadata = { 
      ...task.metadata, 
      progress, 
      ...metadata 
    };

    await this.queue.update(task);
    this.eventEmitter.emit('task.progress', { taskId, progress, metadata });
  }
}
