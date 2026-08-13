import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cluster, Redis } from 'ioredis';
import { RedisConfig } from './RedisConfig.js';
import { CacheOptions, PubSubMessage, QueueTask, RedisHealth, RedisMetrics, RedisOperationLog, SearchResult } from './types.js';
export declare class UnifiedRedisService implements OnModuleInit, OnModuleDestroy {
    private readonly redisConfig;
    private readonly logger;
    private mainClient;
    private pubSubClient;
    private upstashClient?;
    private subscribers;
    private patternSubscribers;
    private metrics;
    private operationLogs;
    private readonly MAX_LOG_SIZE;
    private _isConnected;
    /**
     * Check if Redis is connected and available
     */
    get isConnected(): boolean;
    constructor(redisConfig: RedisConfig);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initializeConnections;
    /**
     * Create a dummy Redis client that fails gracefully for when Redis is unavailable
     */
    private createDummyClient;
    private setupEventHandlers;
    private executeOperation;
    private logOperation;
    private updateMetrics;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number, mode?: 'NX' | 'XX', ttlUnit?: 'EX' | 'PX'): Promise<string | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<boolean>;
    pexpire(key: string, ttlMs: number): Promise<boolean>;
    pttl(key: string): Promise<number>;
    incrby(key: string, increment: number): Promise<number>;
    decrby(key: string, decrement: number): Promise<number>;
    hset(key: string, field: string, value: string): Promise<void>;
    hset(key: string, data: Record<string, string>): Promise<void>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    hdel(key: string, field: string): Promise<number>;
    hincrby(key: string, field: string, increment: number): Promise<number>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<string | null>;
    lpop(key: string): Promise<string | null>;
    llen(key: string): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    lrem(key: string, value: string, count?: number): Promise<number>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    mset(data: Record<string, string>): Promise<void>;
    zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number>;
    zcard(key: string): Promise<number>;
    zcount(key: string, min: number | string, max: number | string): Promise<number>;
    incr(key: string): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zpopmax(key: string): Promise<string[]>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrem(key: string, member: string): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<boolean>;
    sinter(...keys: string[]): Promise<string[]>;
    ltrim(key: string, start: number, stop: number): Promise<void>;
    lindex(key: string, index: number): Promise<string | null>;
    publish(channel: string, message: string | object): Promise<number>;
    subscribe(channel: string, callback: (message: PubSubMessage) => void): Promise<void>;
    psubscribe(pattern: string, callback: (message: PubSubMessage) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    punsubscribe(pattern: string): Promise<void>;
    getAll(pattern: string): Promise<string[]>;
    setWorkflowState(workflowId: string, state: any): Promise<void>;
    getWorkflowState<T = any>(workflowId: string): Promise<T | null>;
    enqueue<T>(queueName: string, task: QueueTask<T>, priority?: number): Promise<void>;
    dequeue<T>(queueName: string): Promise<QueueTask<T> | null>;
    requeueWithBackoff<T>(queueName: string, task: QueueTask<T>, retryPenalty?: number): Promise<void>;
    vectorSet(key: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    vectorGet(key: string): Promise<{
        vector: number[];
        metadata?: Record<string, any>;
    } | null>;
    vectorSearch(searchVector: number[], limit?: number): Promise<SearchResult[]>;
    private calculateCosineSimilarity;
    cache<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>;
    invalidateByTag(tag: string): Promise<void>;
    ping(): Promise<string>;
    flushdb(): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    scan(cursor: string, match?: string, count?: number): Promise<[string, string[]]>;
    eval(script: string, keys: string[], args: any[]): Promise<any>;
    pipeline(): Promise<any>;
    /**
     * Get the underlying Redis client.
     * WARNING: Bypasses the UnifiedRedisService abstraction. Use only when absolutely necessary (e.g. BullMQ).
     */
    getClient(): Redis | Cluster;
    getHealth(): Promise<RedisHealth>;
    getMetrics(): RedisMetrics;
    getOperationLogs(limit?: number): RedisOperationLog[];
    private closeAllConnections;
}
//# sourceMappingURL=UnifiedRedisService.d.ts.map