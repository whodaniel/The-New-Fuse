import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } // @ts-ignore
from 'uuid';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
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
export class TaskQueue<T> extends EventEmitter {
  private readonly logger = new Logger(TaskQueue.name);
  private readonly redisService: UnifiedRedisService;
  private readonly queueKey: string;
  private readonly processingKey: string;
  private readonly completedKey: string;
  private readonly failedKey: string;

  constructor(
    redisService: UnifiedRedisService,
    private options: TaskQueueOptions = {}
  ) {
    super();
    this.redisService = redisService;
    this.queueKey = 'task:queue';
    this.processingKey = 'task:processing';
    this.completedKey = 'task:completed';
    this.failedKey = 'task:failed';
  }

  async addTask(taskDetails: Partial<Task<T>>): Promise<Task<T>> {
    const task: Task<T> = {
      id: uuid(),
      status: 'pending',
      createdAt: new Date(),
      ...taskDetails,
    } as Task<T>;
    await this.redisService.lpush(this.queueKey, JSON.stringify(task));
    return task;
  }
}
