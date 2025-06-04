import { RedisService } from '@core/redis/redis.service.ts';
import { QueueService } from '@core/redis/queue.service';
import { PubSubService } from '@core/redis/pubsub.service';
export declare class TaskService {
    private readonly redis;
    private readonly queue;
    private readonly pubsub;
    constructor(redis: RedisService, queue: QueueService, pubsub: PubSubService);
    createTask(data: any): Promise<string>;
    processTaskQueue(): Promise<void>;
    subscribeToTaskUpdates(callback: (message: any) => void): Promise<void>;
}
