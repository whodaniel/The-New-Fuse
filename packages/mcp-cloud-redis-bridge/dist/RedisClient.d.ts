import { EventEmitter } from 'node:events';
export interface RedisConfig {
    url: string;
    ingressChannel: string;
    egressPrefix: string;
}
export declare class CloudRedisClient extends EventEmitter {
    private publisher;
    private subscriber;
    private connected;
    private config;
    constructor(config?: Partial<RedisConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    hGetAll(key: string): Promise<Record<string, string>>;
    private ensureConnected;
    getIngressChannel(): string;
}
//# sourceMappingURL=RedisClient.d.ts.map