import { TaskRepository } from '@the-new-fuse/database';
import { TaskExecutor } from './TaskExecutor.js';
import { EventEmitter } from 'events';
export declare class TaskScheduler extends EventEmitter {
    private readonly taskRepository;
    private readonly taskExecutor;
    private logger;
    private isRunning;
    private schedulerInterval;
    constructor(taskRepository: TaskRepository, taskExecutor: TaskExecutor);
}
