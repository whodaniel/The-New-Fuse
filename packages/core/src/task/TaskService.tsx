import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TaskStatus, TaskPriority, TaskStatusType } from '@the-new-fuse/types';

import { Task } from '@the-new-fuse/types';

// Additional types specific to TaskService
interface TaskSchedule {
  startAt?: Date;
  deadline?: Date;
  recurrence?: string;
}

interface TaskError {
  message: string;
  timestamp: string;
  stack?: string;
  retryCount?: number;
}

interface RetryHistoryEntry extends TaskError {
  nextRetryTime: string;
}

interface TaskExecution {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: unknown;
  error?: string;
  metadata: Record<string, unknown>;
}

interface TaskHandler {
  type: string;
  handler: (task: Task) => Promise<any>;
  metadata: Record<string, unknown>;
}

interface TaskError extends Error {
  code?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class TaskService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis;
  private db: DatabaseService;
  private handlers: Map<string, TaskHandler> = new Map();
  private activeTasks: Map<string, Task> = new Map();
  private readonly maxConcurrentTasks: number = 10;
  private readonly taskTimeout: number = 60000;
  private readonly retryLimit: number = 3;
  private readonly retryDelay: number = 5000;

  constructor() {
    super();
    this.logger = new Logger(TaskService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.recoverTasks();
    this.startTaskProcessor();
  }

  registerHandler(
    type: string,
    handler: (task: Task) => Promise<any>,
    metadata: Record<string, unknown> = {}
  ): void {
    this.handlers.set(type, { type, handler, metadata });
  }

  async createTask(
    data: {
      name: string;
      description: string;
      type: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      createdBy: string;
      assignedTo?: string;
      dependencies?: string[];
      schedule?: {
        startAt?: Date;
        deadline?: Date;
        recurrence?: string;
      };
      metadata?: Record<string, unknown>;
    }
  ): Promise<Task> {
    try {
      // Validate handler exists
      if (!this.handlers.has(data.type)) {
        const error = new Error(`No handler registered for task type '${data.type}'`) as TaskError;
        error.code = 'HANDLER_NOT_FOUND';
        error.details = { taskType: data.type };
        throw error;
      }

      // Create task
      const task: Task = {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        type: data.type,
        priority: data.priority || 'medium',
        status: 'pending',
        progress: 0,
        createdBy: data.createdBy,
        assignedTo: data.assignedTo,
        dependencies: data.dependencies || [],
        schedule: data.schedule,
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store task
      await (this.db as any).tasks.create({
        data: {
          ...task,
          dependencies: JSON.stringify(task.dependencies),
          schedule: task.schedule ? JSON.stringify(task.schedule) : null,
          metadata: JSON.stringify(task.metadata)
        }
      });

      // Cache task
      await this.cacheTask(task);

      // Schedule task if needed
      if (task.schedule?.startAt) {
        await this.scheduleTask(task);
      }

      // Emit event
      this.emit('taskCreated', {
        taskId: task.id,
        type: task.type,
        createdBy: task.createdBy
      });

      return task;

    } catch (error) {
      const errorObj = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error), stack: undefined };
      this.logger.error('Failed to create task:', errorObj);
      throw error;
    }
  }

  private async cacheTask(task: Task): Promise<void> {
    const key = `task:${task.id}`;
    await this.redis.set(key, JSON.stringify(task));
  }

  private async scheduleTask(task: Task): Promise<void> {
    if(!task.schedule?.startAt) return;
    const score = task.schedule.startAt.getTime();
    await this.redis.zadd('task:schedule', score, task.id);
  }

  async executeTask(taskId: string): Promise<TaskExecution> {
    try {
      const task = await this.getTask(taskId);

      if (!task) {
        const error = new Error(`Task ${taskId} not found`) as TaskError;
        error.code = 'TASK_NOT_FOUND';
        error.details = { taskId };
        throw error;
      }

      // Check dependencies
      if (!await this.checkDependencies(task)) {
        const error = new Error(`Dependencies not met for task ${taskId}`) as TaskError;
        error.code = 'DEPENDENCIES_NOT_MET';
        error.details = { taskId, dependencies: task.dependencies };
        throw error;
      }

      // Create execution record
      const execution: TaskExecution = {
        id: uuidv4(),
        taskId: task.id,
        status: 'pending',
        startTime: new Date(),
        metadata: {}
      };

      // Update task status
      task.status = 'running';
      task.updatedAt = new Date();
      await this.updateTask(task.id, task);

      try {
        // Execute handler
        const handler = this.handlers.get(task.type);
        if (!handler) {
          const error = new Error(`No handler found for task type '${task.type}'`) as TaskError;
          error.code = 'HANDLER_NOT_FOUND';
          error.details = { taskId, taskType: task.type };
          throw error;
        }

        execution.status = 'running';
        const result = await Promise.race([
          handler.handler(task),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Task timed out')), this.taskTimeout))
        ]);

        execution.status = 'completed';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        execution.result = result;

        // Update task
        task.status = 'completed';
        await this.updateTask(task.id, task);
      } catch (error) {
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        execution.error = error instanceof Error ? error.message : String(error);

        // Update task
        task.status = 'failed';
        await this.updateTask(task.id, task);

        // Retry if possible
        await this.handleTaskFailure(task, error instanceof Error ? error : new Error(String(error)));
      }

      // Store execution record
      await (this.db as any).taskExecutions.create({
        data: {
          ...execution,
          result: execution.result ? JSON.stringify(execution.result) : null,
          metadata: JSON.stringify(execution.metadata)
        }
      });

      // Emit event
      this.emit('taskExecuted', {
        taskId: task.id,
        executionId: execution.id,
        status: execution.status
      });

      return execution;

    } catch (error) {
      const errorObj = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error), stack: undefined };
      this.logger.error('Task execution failed:', errorObj);
      throw error;
    }
  }

  private async handleTaskFailure(task: Task, error: Error): Promise<void> {
    const retryCount = ((task as any).metadata.retries || 0) + 1;

    if (retryCount <= this.retryLimit) {
      const errorInfo = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error), stack: undefined };
      (task as any).metadata.lastError = {
        message: errorInfo,
      };
      
      // Track retry history
      if(!(task as any).metadata.retryHistory){
        (task as any).metadata.retryHistory = [];
      }
      (task as any).metadata.retryHistory.push({
        ...errorInfo,
        retryCount,
        nextRetryTime: new Date(Date.now() + this.retryDelay).toISOString()
      });

      const baseDelay = this.retryDelay * Math.pow(2, retryCount - 1);
      const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
      const retryTime = Date.now() + (baseDelay + jitter) * 1000;

      // Schedule retry with Redis
      await this.redis.zadd('task:retries', retryTime, task.id);
      await this.redis.hset(`task:${task.id}:retry_info`, {
        count: retryCount,
        nextRetry: retryTime,
        lastError: JSON.stringify((task as any).metadata.lastError)
      });

      this.logger.warn(`Scheduled retry ${retryCount} for task ${task.id}`, {
        taskId: task.id,
        retryCount,
        nextRetry: new Date(retryTime),
        error: error.message
      });

      // Emit retry event
      this.emit('taskRetryScheduled', {
        taskId: task.id,
        retryCount,
        nextRetry: new Date(retryTime),
        error: error.message
      });
    } else {
      (task as any).metadata.finalError = {
        message: error.message,
        timestamp: new Date().toISOString(),
        retryCount
      };
      await this.updateTask(task.id, task);

      this.logger.error(`Task ${task.id} failed after ${retryCount} retries:`, {
        taskId: task.id,
        retryCount,
        error: {
          message: error.message,
          stack: error.stack
        },
        retryHistory: (task as any).metadata.retryHistory
      });

      // Emit final failure event
      this.emit('taskRetryExhausted', {
        taskId: task.id,
        retryCount,
        error: error.message,
        metadata: task.metadata
      });
    }
  }

  private async checkDependencies(task: Task): Promise<boolean> {
    for (const dependencyId of task.dependencies) {
      const dependency = await this.getTask(dependencyId);
      if (!dependency || dependency.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  private async startTaskProcessor(): Promise<void> {
    // Process pending tasks
    setInterval(async () => {
      if (this.activeTasks.size >= this.maxConcurrentTasks) {
        return;
      }

      const pendingTasks = await (this.db as any).tasks.findMany({
        where: {
          status: 'pending',
          OR: [
            { schedule: null },
            {
              schedule: {
                startAt: {
                  lte: new Date()
                }
              }
            }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        take: this.maxConcurrentTasks - this.activeTasks.size
      });

      for (const task of pendingTasks) {
        // Track active task before execution
        this.activeTasks.set(task.id, task);
        
        this.executeTask(task.id)
          .then(() => {
            // Remove from active tasks after completion
            this.activeTasks.delete(task.id);
          })
          .catch(error => {
            // Remove from active tasks on error
            this.activeTasks.delete(task.id);
            this.logger.error(`Failed to execute task ${task.id}:`, error instanceof Error ? error : new Error(String(error)));
          });
      }
    }, 1000);

    // Process retries
    setInterval(async () => {
      const now = Date.now();
      const taskIds = await this.redis.zrangebyscore('task:retries', 0, now);
      
      for (const taskId of taskIds) {
        await this.redis.zrem('task:retries', taskId);
        this.executeTask(taskId).catch(error => {
          this.logger.error(`Failed to execute retry for task ${taskId}:`, error instanceof Error ? error : new Error(String(error)));
        });
      }
    }, 1000);

    // Process scheduled tasks
    setInterval(async () => {
      const now = Date.now();
      const taskIds = await this.redis.zrangebyscore('task:schedule', 0, now);

      for (const taskId of taskIds) {
        const task = await this.getTask(taskId);
        if(!task) continue;

        // Remove from schedule
        await this.redis.zrem('task:schedule', taskId);

        // Execute task
        this.executeTask(taskId).catch(error => {
          this.logger.error(`Failed to execute scheduled task ${taskId}:`, error instanceof Error ? error : new Error(String(error)));
        });
      }
    }, 1000);

    // Recover stuck tasks
    setInterval(async () => {
      try {
        // Find stuck tasks
        const stuckTasks = await (this.db as any).tasks.findMany({
          where: {
            status: 'running',
            updatedAt: {
              lt: new Date(Date.now() - this.taskTimeout)
            }
          }
        });

        for (const task of stuckTasks) {
          task.status = 'failed';
          task.metadata = {
            ...JSON.parse(task.metadata),
            error: 'Task timeout during system restart'
          };
          await this.updateTask(task.id, task);

          this.logger.warn(`Recovered stuck task ${task.id}`);
        }

      } catch (error: unknown){
        this.logger.error('Failed to recover tasks:', error instanceof Error ? error : new Error(String(error)));
      }
    }, 1000);
  }

  private calculateNextRun(recurrence: string): Date | null {
    // Implement recurrence calculation(cron-like)
    return null;
  }

  private async getTask(taskId: string): Promise<Task | null> {
    // Try cache first
    const cached = await this.redis.get(`task:${taskId}`);
    if(cached){
      return JSON.parse(cached);
    }

    const task = await (this.db as any).tasks.findUnique({
      where: { id: taskId }
    });

    if(task){
      // Cache task
      await this.cacheTask(task);
    }

    return task;
  }

  private async updateTask(
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task> {
    const task = await this.getTask(taskId);
    if(!task) throw new Error(`Task ${taskId} not found`);

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };

    // Update database
    await (this.db as any).tasks.update({
      where: { id: taskId },
      data: {
        ...updatedTask,
        dependencies: JSON.stringify(updatedTask.dependencies),
        schedule: updatedTask.schedule
          ? JSON.stringify(updatedTask.schedule)
          : null,
        metadata: JSON.stringify(updatedTask.metadata)
      }
    });

    // Update cache
    await this.cacheTask(updatedTask);

    // Emit event
    this.emit('taskUpdated', {
      taskId,
      updates: Object.keys(updates)
    });

    return updatedTask;
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if(!task) throw new Error(`Task ${taskId} not found`);

    // Implement cancellation logic
  }

  async getTasks(
    options: {
      type?: string;
      status?: string;
      priority?: string;
      createdBy?: string;
      assignedTo?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Task[]> {
    return (this.db as any).tasks.findMany({
      where: {
        type: options.type,
        status: options.status,
        priority: options.priority,
        createdBy: options.createdBy,
        assignedTo: options.assignedTo,
        createdAt: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: options.offset,
      take: options.limit
    });
  }

  async getTaskExecutions(
    taskId: string,
    options: {
      status?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TaskExecution[]> {
    return (this.db as any).taskExecutions.findMany({
      where: {
        taskId,
        status: options.status,
        startTime: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { startTime: 'desc' },
      skip: options.offset,
      take: options.limit
    });
  }

  async cleanup(options: {
    olderThan?: Date;
    status?: string;
  } = {}): Promise<void> {
    // Clear old tasks
    await (this.db as any).tasks.deleteMany({
      where: {
        createdAt: options.olderThan
          ? { lt: options.olderThan }
          : undefined,
        status: options.status
      }
    });

    // Clear old executions
    await (this.db as any).taskExecutions.deleteMany({
      where: {
        startTime: options.olderThan
          ? { lt: options.olderThan }
          : undefined,
        status: options.status
      }
    });
  }

  private async reportError(error: Error): Promise<void> {
    // Implement error reporting logic here
    this.logger.error(`Reporting error: ${error.message}`, error.stack);
    
  }
}
