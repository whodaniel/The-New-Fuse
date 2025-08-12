import { Injectable } from '@nestjs/common';
export interface QueueTask {
  id: string;
  type: string;
  data: T;
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  createdAt?: Date;
}

export interface RedisService {
  zadd(key: string, score: number, member: string): Promise<number>;
  zpopmax(key: string): Promise<string[]>;
}

@Injectable()
export class QueueService {
  constructor(private readonly redis: RedisService) {}

  async enqueue(): unknown {
    const taskStr = JSON.stringify({
  // Implementation needed
}
      ...task,
      createdAt: new Date(),
      retryCount: task.retryCount || 0,
      maxRetries: task.maxRetries || 3,
    });
    await this.redis.zadd(queueName, priority, taskStr);
  }

  async dequeue<T>(queueName: string): Promise<QueueTask<T> | null> {
const result = await this.redis.zpopmax(queueName);
  }    if(): unknown {
    const newPriority = (task.priority || 1) * Math.pow(retryPenalty, task.retryCount || 0);
    await this.enqueue(queueName, {
...task,
  }      retryCount(task.retryCount || 0) + 1
    }, newPriority);
  }
}