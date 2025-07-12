export interface QueueTask<T = any> {
    id: string;
    type: string;
    data: T;
    priority?: number;
    retryCount?: number;
    maxRetries?: number;
    createdAt?: Date;
}
export interface RedisService {
    zadd(key: string, score: number, member: string): Promise<number>;
    zpopmax(key: string): Promise<string[]>;
}
export declare class QueueService {
    private readonly redis;
    constructor(redis: RedisService);
    enqueue(queueName: string, task: QueueTask, priority?: number): Promise<void>;
    dequeue<T>(queueName: string): Promise<QueueTask<T> | null>;
    retry(queueName: string, task: QueueTask, retryPenalty?: number): Promise<void>;
}
//# sourceMappingURL=queue.service.d.ts.map