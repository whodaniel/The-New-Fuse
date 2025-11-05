import { RedisService } from '@the-new-fuse/core';
export declare class TaskService {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisService);
    createTask(data: any): Promise<string>;
    processTaskQueue(): Promise<void>;
    processTask(id: string, data: any): Promise<void>;
    subscribeToTaskUpdates(callback: (message: any) => void): Promise<void>;
}
//# sourceMappingURL=task.service.d.ts.map