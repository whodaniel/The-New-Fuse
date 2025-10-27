import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';

// Interface from Incoming change
export interface QueueItem<T> {
  id: string;
  data: T;
  priority: number;
  timestamp: Date;
  retries: number;
  maxRetries: number;
}

// Merged Class:
// - Injectable Redis implementation from Current change
// - Generic <T> and QueueItem<T> from Incoming change
@Injectable()
export class TaskQueue<T> {
  private readonly logger = new Logger(TaskQueue.name);
  private readonly prefix = 'task:queue';

  constructor(private readonly redisService: RedisService) {}

  private getQueueKey(type: string): string {
    return `${this.prefix}:${type}`;
  }

  // Merged 'add' method:
  // Now takes a 'type' string and a generic 'item'
  async add(type: string, item: QueueItem<T>): Promise<void> {
    this.logger.log(`Adding task ${item.id} to queue ${type}`);
    const client = this.redisService.getClient();
    await client.zadd(
      this.getQueueKey(type || 'default'),
      item.priority.toString(), // Use priority from QueueItem
      JSON.stringify(item), // Store the whole QueueItem
    );
  }

  // Merged 'getNext' method:
  // Now returns a generic QueueItem<T>
  async getNext(type = 'default'): Promise<QueueItem<T> | null> {
    this.logger.log(`Getting next task from queue ${type}`);
    const client = this.redisService.getClient();
    const result = await client.zpopmax(this.getQueueKey(type));
    
    if (result) {
      // result[0] is the stringified item
      return JSON.parse(result[0]) as QueueItem<T>;
    }
    
    return null;
  }
}