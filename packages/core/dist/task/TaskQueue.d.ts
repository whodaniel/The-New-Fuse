import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { EventEmitter } from 'events';
export interface Task<T = any> {
    id: string;
    type: string;
    data: T;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timedout';
    priority: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    timeout?: number;
}
export interface TaskQueueOptions {
    concurrency?: number;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
export declare class TaskQueue<T> extends EventEmitter {
    private options;
    private readonly logger;
    private readonly redisService;
    private readonly queueKey;
    private readonly processingKey;
    private readonly completedKey;
    private readonly failedKey;
    constructor(redisService: UnifiedRedisService, options?: TaskQueueOptions);
    addTask(taskDetails: Partial<Task<T>>): Promise<Task<T>>;
}
//# sourceMappingURL=TaskQueue.d.ts.map