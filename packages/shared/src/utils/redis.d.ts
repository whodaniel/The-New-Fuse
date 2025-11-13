declare class RedisClient {
    private static instance;
    private client;
    private constructor();
    static getInstance(): RedisClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
    delete(key: string): Promise<number>;
}
export declare const redisClient: RedisClient;
export {};
//# sourceMappingURL=redis.d.ts.map