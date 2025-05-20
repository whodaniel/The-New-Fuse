export declare class TaskQueue {
    private config;
    private redis;
    private logger;
    private readonly queueKey;
    private readonly processingKey;
    private readonly completedKey;
    private isProcessing;
    constructor(config: {
        redisUrl: string;
        maxRetries: number;
        processingTimeout: number;
        batchSize: number;
    });
}
