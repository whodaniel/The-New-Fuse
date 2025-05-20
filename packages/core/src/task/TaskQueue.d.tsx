export declare class TaskQueue {
    private redis;
    private logger;
    private readonly queueKey;
    private readonly processingKey;
    private readonly completedKey;
    constructor();
    dequeue(): Promise<void>;
}
