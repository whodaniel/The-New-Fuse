import { Injectable } from '@nestjs/common';
export interface QueueTask<T = any> {
  // Implementation needed
}
  id: string;
  type: string;
  data: T;
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  createdAt?: Date;
}

export interface RedisService {
  // Implementation needed
}
  zadd(key: string, score: number, member: string): Promise<number>;
  zpopmax(key: string): Promise<string[]>;
}

@Injectable()
export class QueueService {
  // Implementation needed
}
  constructor(private readonly redis: RedisService) {}

  async enqueue(queueName: string, task: QueueTask, priority: number = 1): Promise<void> {
  // Implementation needed
}
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
  // Implementation needed
}
    const result = await this.redis.zpopmax(queueName);
    if (!result.length) return null;
    return JSON.parse(result[0]);
  }

  async retry(queueName: string, task: QueueTask, retryPenalty: number = 0.5): Promise<void> {
  // Implementation needed
}
    const newPriority = (task.priority || 1) * Math.pow(retryPenalty, task.retryCount || 0);
    await this.enqueue(queueName, {
  // Implementation needed
}
      ...task,
      retryCount(task.retryCount || 0) + 1
    }, newPriority);
  }
}