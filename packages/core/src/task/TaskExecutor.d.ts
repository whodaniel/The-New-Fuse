import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import { TaskRepository } from '@the-new-fuse/database';
export declare class TaskExecutor extends EventEmitter {
    private readonly taskRepository;
    private readonly configService;
    private readonly redis;
    private logger;
    private runningTasks;
    constructor(taskRepository: TaskRepository, configService: ConfigService, redis: Redis);
    timestamp: new () => Date;
}
