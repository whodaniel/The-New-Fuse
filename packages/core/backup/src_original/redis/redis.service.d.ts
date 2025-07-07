import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly redis;
    private readonly subClient;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    hset(key: string, field: string, value: string): Promise<void>;
    hset(key: string, data: Record<string, string>): Promise<void>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    publish(channel: string, message: string | object): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<string | null>;
    llen(key: string): Promise<number>;
    ping(): Promise<string>;
    flushdb(): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map