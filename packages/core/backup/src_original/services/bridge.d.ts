export declare class CascadeBridge {
    private redisClient;
    private isRunning;
    private messageQueue;
    constructor(redisHost?: string, redisPort?: number, redisDb?: number);
    private createMessageQueue;
}
