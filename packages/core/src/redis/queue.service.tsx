import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';

export interface QueueTask<T = any> {
  id: string;
  type: string;
  data: T;
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  createdAt?: Date;
}

@Injectable()
export class QueueService {
  constructor(private readonly redis: RedisService) {}

  async enqueue(queueName: string, task: QueueTask, priority: number = 1): Promise<void> {
    const taskStr = JSON.stringify({
      ...task,
      createdAt: new Date(),
      retryCount: task.retryCount || 0,
      maxRetries: task.maxRetries || 3,
    });
    
    await this.redis.zadd(queueName, priority, taskStr);
  }

  async dequeue<T>(queueName: string): Promise<QueueTask<T> | null> {
    const result = await this.redis.zpopmax(queueName);
    if (!result.length) return null;
    return JSON.parse(result[0]);
  }

  async retry(queueName: string, task: QueueTask, retryPenalty: number = 0.5): Promise<void> {
    const newPriority = (task.priority || 1) * Math.pow(retryPenalty, task.retryCount || 0);
    await this.enqueue(queueName, {
      ...task,
      retryCount: (task.retryCount || 0) + 1,
    }, newPriority);
  }
}