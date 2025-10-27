import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Task } from './task.entity';

@Injectable()
export class TaskQueue {
  private readonly logger = new Logger(TaskQueue.name);
  private readonly prefix = 'task:queue';

  constructor(private readonly redisService: RedisService) {}

  private getQueueKey(type: string): string {
    return `${this.prefix}:${type}`;
  }

  async add(task: Task): Promise<void> {
    this.logger.log(`Adding task ${task.id} to queue ${task.type}`);
    const client = this.redisService.getClient();
    await client.zadd(
      this.getQueueKey(task.type || 'default'),
      task.priority.toString(),
      JSON.stringify(task)
    );
  }

  async getNext(type = 'default'): Promise<Task | null> {
    this.logger.log(`Getting next task from queue ${type}`);
    const client = this.redisService.getClient();
    const result = await client.zpopmax(this.getQueueKey(type));
    if (result) {
      return JSON.parse(result[0]);
    }
    return null;
  }
}
