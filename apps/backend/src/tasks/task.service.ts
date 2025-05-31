import { Injectable } from '@nestjs/common';
import { RedisService } from '@core/redis/redis.service.ts';
import { QueueService } from '@core/redis/queue.service';
import { PubSubService } from '@core/redis/pubsub.service';
import { REDIS_CHANNELS, REDIS_QUEUES } from '@core/config/redis.config';

@Injectable()
export class TaskService {
  constructor(
    private readonly redis: RedisService,
    private readonly queue: QueueService,
    private readonly pubsub: PubSubService,
  ) {}

  async createTask(data: any): Promise<string> {
    const taskId = `task:${Date.now()}`;
    
    // Store task data
    await this.redis.set(taskId, JSON.stringify(data));
    
    // Add to processing queue
    await this.queue.enqueue(REDIS_QUEUES.TASK_QUEUE, {
      id: taskId,
      data,
      timestamp: new Date().toISOString(),
    });
    
    // Notify subscribers
    await this.pubsub.publish(REDIS_CHANNELS.TASK_UPDATES, {
      type: 'TASK_CREATED',
      taskId,
      data,
    });
    
    return taskId;
  }

  async processTaskQueue(): Promise<void> {
    await this.queue.process(REDIS_QUEUES.TASK_QUEUE, async (job) => {
      const { id, data } = job;
      // Process the task
      await this.processTask(id, data);
      
      // Update task status
      await this.pubsub.publish(REDIS_CHANNELS.TASK_UPDATES, {
        type: 'TASK_COMPLETED',
        taskId: id,
        result: 'success',
      });
    });
  }

  async subscribeToTaskUpdates(callback: (message: any) => void): Promise<void> {
    await this.pubsub.subscribe(REDIS_CHANNELS.TASK_UPDATES, callback);
  }
}
