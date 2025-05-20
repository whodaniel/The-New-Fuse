import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TaskScheduler } from './TaskScheduler.js';
export declare class TaskModule implements OnModuleInit, OnModuleDestroy {
    private readonly taskScheduler;
    constructor(taskScheduler: TaskScheduler);
    onModuleInit(): Promise<void>;
}
