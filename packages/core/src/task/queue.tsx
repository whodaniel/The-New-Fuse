import { Injectable } from '@nestjs/common';
import { Task, TaskPriority, TaskStatus, TaskType } from './types.js';
import { RedisService } from '../services/redis.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PriorityQueue {
  private readonly prefix: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.prefix = 'task:queue:';
  }

  async enqueue(task: Task, priority?: number): Promise<void> {
    const score = this.calculateScore(task, priority || 0);
    await this.redisService.zadd(
      this.getQueueKey(task.type || 'default'),
      score,
      task.id
    );
    await this.redisService.hset(
      this.getTaskKey(task.id),
      this.serializeTask(task)
    );
  }

  async dequeue(type?: string): Promise<Task | null> {
    const queueKey = this.getQueueKey(type || '*');
    const taskIds = await this.redisService.zpopmax(queueKey, 1);
    
    if (!taskIds || !taskIds.length) {
      return null;
    }
    
    const taskId = taskIds[0];
    const taskData = await this.redisService.hgetall(this.getTaskKey(taskId));
    
    if (!taskData || !Object.keys(taskData).length) {
      return null;
    }
    
    return this.deserializeTask(taskData);
  }

  async peek(type?: string): Promise<Task | null> {
    const queueKey = this.getQueueKey(type || '*');
    const taskIds = await this.redisService.zrange(queueKey, -1, -1, 'WITHSCORES');
    
    if (!taskIds || !taskIds.length) {
      return null;
    }
    
    const taskId = taskIds[0];
    const taskData = await this.redisService.hgetall(this.getTaskKey(taskId));
    
    if (!taskData || !Object.keys(taskData).length) {
      return null;
    }
    
    return this.deserializeTask(taskData);
  }

  async remove(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    
    if (!task) {
      return;
    }
    
    await Promise.all([
      this.redisService.zrem(this.getQueueKey(task.type || 'default'), taskId),
      this.redisService.del(this.getTaskKey(taskId))
    ]);
  }

  async update(task: Task): Promise<void> {
    await this.redisService.hset(
      this.getTaskKey(task.id),
      this.serializeTask(task)
    );
  }
  
  async getTask(taskId: string): Promise<Task | null> {
    const taskData = await this.redisService.hgetall(this.getTaskKey(taskId));
    
    if (!taskData || !Object.keys(taskData).length) {
      return null;
    }
    
    return this.deserializeTask(taskData);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    // This is a simplified implementation
    // In a real application, we'd use Redis sets to track tasks by status
    const keys = await this.redisService.keys(`${this.prefix}task:*`);
    const tasks: Task[] = [];
    
    for (const key of keys) {
      const taskData = await this.redisService.hgetall(key);
      if (taskData && taskData.status === status) {
        tasks.push(this.deserializeTask(taskData));
      }
    }
    
    return tasks;
  }
  
  async getTasksByDependency(taskId: string): Promise<Task[]> {
    // This is a simplified implementation
    // In a real application, we'd use Redis sets to track dependencies
    const keys = await this.redisService.keys(`${this.prefix}task:*`);
    const tasks: Task[] = [];
    
    for (const key of keys) {
      const taskData = await this.redisService.hgetall(key);
      if (taskData && taskData.dependencies) {
        const dependencies = JSON.parse(taskData.dependencies);
        if (dependencies.some((dep: any) => dep.taskId === taskId)) {
          tasks.push(this.deserializeTask(taskData));
        }
      }
    }
    
    return tasks;
  }
  
  private getTaskKey(taskId: string): string {
    return `${this.prefix}task:${taskId}`;
  }

  private serializeTask(task: Task): Record<string, string> {
    return {
      id: task.id,
      type: task.type || 'default',
      priority: String(task.priority || 0),
      status: task.status,
      dependencies: JSON.stringify(task.dependencies || []),
      metadata: JSON.stringify(task.metadata || {}),
      input: JSON.stringify(task.payload || {}),
      output: task.result ? JSON.stringify(task.result) : '',
      createdAt: task.createdAt ? task.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: task.updatedAt ? task.updatedAt.toISOString() : new Date().toISOString(),
      startedAt: task.startedAt ? task.startedAt.toISOString() : '',
      completedAt: task.completedAt ? task.completedAt.toISOString() : ''
    };
  }

  private deserializeTask(data: Record<string, string>): Task {
    return {
      id: data.id,
      type: data.type,
      priority: parseInt(data.priority, 10) || 0,
      status: data.status,
      dependencies: JSON.parse(data.dependencies || '[]'),
      metadata: JSON.parse(data.metadata || '{}'),
      payload: JSON.parse(data.input || '{}'),
      result: data.output ? JSON.parse(data.output) : undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      execute: async () => {} // Placeholder for execute function
    };
  }

  async getLength(type?: string): Promise<number> {
    const queueKey = this.getQueueKey(type || '*');
    return this.redisService.zcard(queueKey);
  }
  
  async getNextTask(): Promise<Task | null> {
    // A simple implementation that gets the next task from any queue
    return this.dequeue();
  }

  private calculateScore(task: Task, priority: number): number {
    const now = Date.now();
    const baseScore = priority * 10000000; // Base priority score
    
    // Add penalty/bonus for dependencies
    const dependencyPenalty = task.dependencies?.length ? task.dependencies.length * -1000 : 0;
    
    // Add deadline bonus (closer deadline = higher score)
    let deadlinePenalty = 0;
    if (task.metadata?.endTime instanceof Date) {
      const deadline = task.metadata.endTime.getTime();
      const timeUntilDeadline = deadline - now;
      deadlinePenalty = Math.max(0, 1000000 - Math.floor(timeUntilDeadline / 60000)); // Convert to minutes
    }

    return baseScore + dependencyPenalty + deadlinePenalty;
  }

  private getQueueKey(type: string): string {
    return `${this.prefix}${type}`;
  }
}
