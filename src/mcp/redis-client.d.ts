/**
 * MCP Redis Client Implementation
 *
 * This file implements a Redis client that connects to Redis through the MCP framework.
 * It supports all Redis operations and SSL/TLS configuration.
 */
import { RedisService } from '../types/redis/service.tsx';
export interface MCPRedisConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
    ssl?: boolean;
    ca_path?: string;
    ssl_keyfile?: string;
    ssl_certfile?: string;
    cert_reqs?: string;
    ca_certs?: string;
    cluster_mode?: boolean;
}
export declare class MCPRedisClient implements RedisService {
    private client;
    private config;
    private isConnected;
    constructor(config: MCPRedisConfig);
    private initializeClient;
    getClient(): any;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<string>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    rename(source: string, destination: string): Promise<"OK">;
    type(key: string): Promise<string>;
    dbsize(): Promise<number>;
    hset(key: string, field: string, value: string): Promise<number>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string>>;
    hdel(key: string, field: string): Promise<number>;
    hexists(key: string, field: string): Promise<number>;
    lpush(key: string, value: string | string[]): Promise<number>;
    rpush(key: string, value: string | string[]): Promise<number>;
    lpop(key: string): Promise<string | null>;
    rpop(key: string): Promise<string | null>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    llen(key: string): Promise<number>;
    sadd(key: string, member: string | string[]): Promise<number>;
    srem(key: string, member: string | string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    zadd(key: string, score: number, member: string): Promise<number>;
    zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]>;
    zrem(key: string, member: string | string[]): Promise<number>;
    xadd(key: string, id: string, fields: Record<string, string>): Promise<string>;
    xdel(key: string, id: string): Promise<number>;
    xrange(key: string, start: string, end: string, count?: number): Promise<Array<[string, string[]]>>;
    publish(channel: string, message: string | Record<string, unknown>): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    json_get(key: string, path?: string): Promise<string | null>;
    json_set(key: string, path: string, json: string | object): Promise<"OK">;
    json_del(key: string, path?: string): Promise<number>;
    set_vector_in_hash(key: string, field: string, vector: number[]): Promise<number>;
    get_vector_from_hash(key: string, field: string): Promise<number[] | null>;
    vector_search_hash(indexName: string, query: string, options?: Record<string, any>): Promise<any[]>;
    create_vector_index_hash(indexName: string, schema: Record<string, any>): Promise<"OK">;
    get_indexes(): Promise<string[]>;
    get_index_info(indexName: string): Promise<Record<string, any>>;
    get_indexed_keys_number(indexName: string): Promise<number>;
    client_list(): Promise<string>;
    info(section?: string): Promise<string>;
    pipeline(): any;
    scheduleTask(task: Record<string, unknown>): Promise<string>;
    getRunningTaskIds(): Promise<string[]>;
    scheduleTaskOptimization(options: Record<string, unknown>): Promise<void>;
    getTask(id: string): Promise<Record<string, unknown> | null>;
    cancelTask(id: string): Promise<boolean>;
    getNextPendingTasks(limit: number): Promise<Record<string, unknown>[]>;
}
/**
 * Create an MCP Redis client with the given configuration
 */
export declare function createMCPRedisClient(config: MCPRedisConfig): RedisService;
//# sourceMappingURL=redis-client.d.ts.map