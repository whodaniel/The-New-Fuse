import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskQuery,
  TaskDependency,
  TaskMetadata,
} from './types.js';
import { PriorityQueue } from './queue.js';
import { TaskScheduler } from './scheduler.js';
import { TaskExecutor } from './executor.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../services/redis.service.js';

@Injectable()
export class TaskManager {
  constructor(
    private readonly queue: PriorityQueue,
    private readonly scheduler: TaskScheduler,
    private readonly executor: TaskExecutor,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
  ) {}

  async createTask(
    type: string,
    input: unknown,
    options: {
      priority?: number;
      dependencies?: TaskDependency[];
      metadata?: TaskMetadata;
    } = {},
  ): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type,
      priority: options.priority || 0,
      status: TaskStatus.PENDING,
      dependencies: options.dependencies || [],
      metadata: options.metadata || {
        createdBy: 'system'
      },
      payload: input,
      createdAt: new Date(),
      updatedAt: new Date(),
      execute: async () => {} // Placeholder for execute function
    };

    await this.scheduler.schedule(task);
    return task;
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return this.queue.getTask(taskId);
  }

  async findTasks(query: TaskQuery): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    
    return allTasks.filter(task => {
      if (query.types && !query.types.includes(task.type)) {
        return false;
      }
      if (query.priorities && !query.priorities.includes(task.priority || 0)) {
        return false;
      }
      if (query.statuses && !query.statuses.includes(task.status)) {
        return false;
      }
      if (query.creator && task.metadata?.createdBy !== query.creator) {
        return false;
      }
      if (query.assignee && task.metadata?.assignedTo !== query.assignee) {
        return false;
      }
      if (query.tags && !query.tags.every(tag => task.metadata?.tags?.includes(tag))) {
        return false;
      }
      if (query.startDate && task.createdAt < query.startDate) {
        return false;
      }
      if (query.endDate && task.createdAt > query.endDate) {
        return false;
      }
      if (query.metadata) {
        for (const [key, value] of Object.entries(query.metadata)) {
          const metadataValue = task.metadata?.[key as keyof TaskMetadata];
          if (metadataValue !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  async cancelTask(taskId: string): Promise<void> {
    await this.scheduler.cancel(taskId);
    this.eventEmitter.emit('task.cancelled', { taskId });
  }

  async pauseTask(taskId: string): Promise<void> {
    const task = await this.queue.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.status = TaskStatus.PAUSED;
    task.updatedAt = new Date();
    await this.queue.update(task);
    this.eventEmitter.emit('task.paused', { taskId });
  }

  async resumeTask(taskId: string): Promise<void> {
    const task = await this.queue.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.status = TaskStatus.PENDING;
    task.updatedAt = new Date();
    await this.queue.update(task);
    await this.scheduler.schedule(task);
    this.eventEmitter.emit('task.resumed', { taskId });
  }

  async retryTask(taskId: string): Promise<void> {
    const task = await this.queue.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.status = TaskStatus.PENDING;
    task.updatedAt = new Date();
    if (!task.metadata) task.metadata = {};
    task.metadata.retryCount = (task.metadata.retryCount || 0) + 1;
    await this.queue.update(task);
    await this.scheduler.schedule(task);
    this.eventEmitter.emit('task.retry', { taskId });
  }

  registerExecutor(type: string, executor: (task: Task) => Promise<void>): void {
    this.executor.registerExecutor(type, executor);
  }

  async getTaskProgress(taskId: string): Promise<number> {
    return this.executor.getTaskProgress(taskId);
  }

  async updateTaskProgress(
    taskId: string,
    progress: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.executor.updateTaskProgress(taskId, progress, metadata);
  }

  async getAllTasks(): Promise<Task[]> {
    const taskIds = await this.redisService.keys('task:queue:task:*');
    const tasks = await Promise.all(
      taskIds.map((id) => this.queue.getTask(id.replace('task:queue:task:', '')))
    );
    return tasks.filter((task): task is Task => task !== null);
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<number, number>;
    averageCompletionTime: number;
  }> {
    const tasks = await this.getAllTasks();
    return {
      total: tasks.length,
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: tasks.reduce((acc, task) => {
        acc[task.priority || 0] = (acc[task.priority || 0] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      averageCompletionTime: this.calculateAverageCompletionTime(tasks)
    };
  }

  private calculateAverageCompletionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(
      task => task.status === TaskStatus.COMPLETED && task.startedAt && task.completedAt
    );

    if (completedTasks.length === 0) {
      return 0;
    }

    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt!.getTime() - task.startedAt!.getTime());
    }, 0);

    return totalTime / completedTasks.length;
  }
}
