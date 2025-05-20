import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LoggingService } from '../LoggingService.ts';
import { MetricsService } from '../MetricsService.ts';
import { RedisService } from '../redis/redis.service.ts';

export interface Task {
  id: string;
  type: string;
  data: unknown;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
  attempts: number;
  maxAttempts: number;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskConfig {
  maxAttempts?: number;
  defaultPriority?: TaskPriority;
}

@Injectable()
export class TaskService {
  private readonly logger: LoggingService;
  private readonly config: TaskConfig;

  constructor(
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    config: TaskConfig = {}
  ) {
    this.logger = new LoggingService('TaskService');
    this.config = {
      maxAttempts: config.maxAttempts || 3,
      defaultPriority: config.defaultPriority || 'medium'
    };
  }

  async createTask(type: string, data: unknown, priority?: TaskPriority): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type,
      data,
      status: 'pending',
      priority: priority || this.config.defaultPriority,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
      maxAttempts: this.config.maxAttempts
    };

    await this.saveTask(task);
    this.metrics.trackCount('task_created', { type });
    return task;
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskStr = await this.redis.get(`task:${taskId}`);
      if (!taskStr) {
        return null;
      }
      return JSON.parse(taskStr) as Task;
    } catch (error) {
      this.logger.error('Failed to get task', { taskId, error });
      throw error;
    }
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = status;
    task.updatedAt = Date.now();
    
    if (error) {
      task.error = error;
      task.attempts++;
    }

    if (status === 'completed' || status === 'failed') {
      task.completedAt = Date.now();
    }

    await this.saveTask(task);
    this.metrics.trackCount(`task_${status}`, { type: task.type });
  }

  async getNextPendingTask(): Promise<Task | null> {
    try {
      const taskIds = await this.redis.keys('task:*');
      for (const taskKey of taskIds) {
        const taskStr = await this.redis.get(taskKey);
        if (!taskStr) continue;
        
        const task = JSON.parse(taskStr) as Task;
        if (task.status === 'pending' && task.attempts < task.maxAttempts) {
          return task;
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to get next pending task', { error });
      throw error;
    }
  }

  async cleanupCompletedTasks(olderThan: number = 24 * 60 * 60 * 1000): Promise<number> {
    let cleaned = 0;
    const taskIds = await this.redis.keys('task:*');
    const now = Date.now();

    for (const taskKey of taskIds) {
      const taskStr = await this.redis.get(taskKey);
      if (!taskStr) continue;

      const task = JSON.parse(taskStr) as Task;
      if ((task.status === 'completed' || task.status === 'failed') && 
          task.completedAt && 
          (now - task.completedAt) > olderThan) {
        await this.redis.del(taskKey);
        cleaned++;
      }
    }

    this.metrics.trackCount('tasks_cleaned', { count: cleaned });
    return cleaned;
  }

  private async saveTask(task: Task): Promise<void> {
    await this.redis.set(`task:${task.id}`, JSON.stringify(task));
  }
}