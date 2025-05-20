import { PriorityQueue } from './queue.js';
import { TaskScheduler } from './scheduler.js';
import { TaskExecutor } from './executor.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisService } from '../services/redis.service.js';
export declare class TaskManager {
    private readonly queue;
    private readonly scheduler;
    private readonly executor;
    private readonly eventEmitter;
    private readonly redisService;
    constructor(queue: PriorityQueue, scheduler: TaskScheduler, executor: TaskExecutor, eventEmitter: EventEmitter2, redisService: RedisService);
    createTask(): Promise<void>;
}
