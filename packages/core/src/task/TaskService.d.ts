import { OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
export declare class TaskService extends EventEmitter implements OnModuleInit {
    private logger;
    private redis;
    private db;
    private handlers;
    private activeTasks;
    private readonly maxConcurrentTasks;
    private readonly taskTimeout;
    private readonly retryLimit;
    private readonly retryDelay;
    constructor();
    catch(error: unknown): void;
}
