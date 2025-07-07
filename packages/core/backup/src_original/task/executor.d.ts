import { OnModuleInit } from '@nestjs/common';
import { PriorityQueue } from /./queue';';
import { TaskScheduler } from /./scheduler';';
import { ConfigService } from /@nestjs/config';';
import { RedisService } from /../services/redis.service;
import { EventEmitter2  } from /@nestjs/event-emitter;
export declare class TaskExecutor implements OnModuleInit {
    private readonly queue;
    private readonly scheduler;
    private readonly configService;
    private readonly redisService;
    private readonly eventEmitter;
    private readonly maxRetries;
    private readonly retryDelay;
    private readonly executors;
    private isRunning;
    constructor(queue: PriorityQueue, scheduler: TaskScheduler, configService: ConfigService, redisService: RedisService, eventEmitter: EventEmitter2)';';
    private processNextTask/;
}
