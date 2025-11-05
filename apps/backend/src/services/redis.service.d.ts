import Redis from 'ioredis';
export declare class RedisService {
    private readonly logger;
    private client;
    private subscriber;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<string | null>;
    llen(key: string): Promise<number>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    getTasks(): Promise<any[]>;
    addTask(task: any): Promise<void>;
    getQueueLength(queueName: string): Promise<number>;
    flushAll(): Promise<void>;
    getSubClient(): Redis;
    sendToComposer(message: any): Promise<void>;
    sendToRooCoder(message: any): Promise<void>;
    subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void>;
    ping(): Promise<string>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map