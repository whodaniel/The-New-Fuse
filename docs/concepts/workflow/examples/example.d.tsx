export declare class Example {
    private redisClient;
    private pubsub;
    private connected;
    private logger;
    constructor(redisHost: string, redisPort: number, redisDb: number);
    connect(): Promise<void>;
    sendMessage(message: Record<string, any>): Promise<void>;
    private handleMessage;
    disconnect(): Promise<void>;
    isConnected(): boolean;
}
