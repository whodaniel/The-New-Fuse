import { BaseService } from '../core/BaseService';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { ConfigService } from './ConfigService';
/**
 * Service for interacting with Redis via UnifiedRedisService.
 * Provides Redis commands while maintaining BaseService compatibility.
 */
export declare class RedisService extends BaseService {
    private readonly unifiedRedis;
    private logger;
    constructor(configService: ConfigService, unifiedRedis: UnifiedRedisService);
    /**
     * Connection is managed by UnifiedRedisService
     */
    connect(): Promise<void>;
    /**
     * Disconnection is managed by UnifiedRedisService
     */
    disconnect(): Promise<void>;
    /**
     * Gets the UnifiedRedisService instance.
     */
    getClient(): UnifiedRedisService;
    set(key: string, value: string | number | Buffer, expirySeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string | string[]): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    publish(channel: string, message: string | Buffer): Promise<void>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    hset(key: string, field: string, value: string): Promise<void>;
    hset(key: string, data: Record<string, string>): Promise<void>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    hdel(key: string, field: string): Promise<number>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<string | null>;
    llen(key: string): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    ping(): Promise<string>;
    flushdb(): Promise<void>;
    cache<T>(key: string, factory: () => Promise<T>, options?: {
        ttl?: number;
        tags?: string[];
    }): Promise<T>;
    enqueue(queueName: string, task: any, priority?: number): Promise<void>;
    dequeue<T>(queueName: string): Promise<T | null>;
    getHealth(): Promise<any>;
    getMetrics(): any;
}
//# sourceMappingURL=RedisService.d.ts.map