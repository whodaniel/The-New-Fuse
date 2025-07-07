export interface QueueTask<T = any> {
    id: string;
    type: string;
    data: T;
    priority?: number;
    retryCount?: number;
    maxRetries?: number;
}
export declare class QueueService {
    private readonly redis;
    constructor(redis: RedisService);
    enqueue(queueName: string, task: QueueTask, priority?: number): Promise<void>;
}
//# sourceMappingURL=queue.service.d.ts.map