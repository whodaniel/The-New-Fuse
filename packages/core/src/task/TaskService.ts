import { Injectable, Logger } from '@nestjs/common';
import { TaskManager } from './TaskManager';
import { TaskQueue } from './TaskQueue';
import { TaskExecutor, Task, TaskStatusType } from './TaskExecutor';

export interface TaskCreationOptions {
  type: string;
  data: any;
  params?: Record<string, any>;
  config?: Record<string, any>;
  priority?: number;
  dependencies?: string[];
  maxRetries?: number;
  timeout?: number;
}

export interface TaskExecutionOptions {
  queue?: boolean;
  priority?: number;
  timeout?: number;
}

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private readonly taskQueues = new Map<string, TaskQueue>();

  constructor(
    private readonly taskManager: TaskManager,
    private readonly taskExecutor: TaskExecutor,
    private readonly defaultQueue: TaskQueue
  ) {}

  async createTask(options: TaskCreationOptions): Promise<Task> {
    return this.taskManager.createTask(options);
  }

  async executeTask(taskId: string): Promise<any> {
    return this.taskManager.executeTask(taskId);
  }

  async executeTaskWithQueue(
    taskOptions: TaskCreationOptions,
    executionOptions: TaskExecutionOptions = {}
  ): Promise<Task> {
    const task = await this.createTask(taskOptions);
    
    if (executionOptions.queue) {
      await this.defaultQueue.addTask({
        type: task.type,
        data: task.data,
        priority: executionOptions.priority || taskOptions.priority || 0,
        timeout: executionOptions.timeout || taskOptions.timeout
      });
    } else {
      await this.executeTask(task.id);
    }

    return task;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return this.taskManager.getTask(taskId);
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusType | null> {
    return this.taskExecutor.getTaskStatus(taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    return this.taskManager.cancelTask(taskId);
  }

  async getPendingTasks(): Promise<Task[]> {
    return this.taskManager.getPendingTasks();
  }

  async getTasksByStatus(status: TaskStatusType): Promise<Task[]> {
    return this.taskManager.getTasksByStatus(status);
  }

  async getTaskMetadata(taskId: string) {
    return this.taskManager.getTaskMetadata(taskId);
  }

  async createQueue(name: string, options?: any): Promise<TaskQueue> {
    if (this.taskQueues.has(name)) {
      return this.taskQueues.get(name)!;
    }

    const queue = new TaskQueue(options);
    this.taskQueues.set(name, queue);
    
    return queue;
  }

  async getQueue(name: string): Promise<TaskQueue | undefined> {
    return this.taskQueues.get(name);
  }

  async getQueueStats(): Promise<any> {
    return this.defaultQueue.getQueueStats();
  }

  async clearQueue(): Promise<void> {
    return this.defaultQueue.clear();
  }

  async scheduleTask(
    taskOptions: TaskCreationOptions,
    scheduleOptions: {
      delay?: number;
      cron?: string;
      queue?: string;
    } = {}
  ): Promise<Task> {
    const task = await this.createTask(taskOptions);
    
    if (scheduleOptions.delay) {
      setTimeout(() => {
        this.executeTask(task.id).catch(error => {
          this.logger.error(`Failed to execute scheduled task ${task.id}:`, error);
        });
      }, scheduleOptions.delay);
    }

    return task;
  }

  async batchExecute(
    tasks: TaskCreationOptions[],
    options: {
      parallel?: boolean;
      maxConcurrency?: number;
    } = {}
  ): Promise<Task[]> {
    const createdTasks: Task[] = [];
    
    if (options.parallel) {
      const concurrency = options.maxConcurrency || 5;
      const chunks = this.chunkArray(tasks, concurrency);
      
      for (const chunk of chunks) {
        const chunkTasks = await Promise.all(
          chunk.map(task => this.createTask(task))
        );
        createdTasks.push(...chunkTasks);
        
        await Promise.all(
          chunkTasks.map(task => 
            this.executeTask(task.id).catch(error => {
              this.logger.error(`Failed to execute task ${task.id}:`, error);
            })
          )
        );
      }
    } else {
      for (const taskOptions of tasks) {
        const task = await this.createTask(taskOptions);
        createdTasks.push(task);
        
        try {
          await this.executeTask(task.id);
        } catch (error) {
          this.logger.error(`Failed to execute task ${task.id}:`, error);
        }
      }
    }

    return createdTasks;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}