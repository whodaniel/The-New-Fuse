import { PoolClient } from 'pg';
import { EventEmitter } from 'events';
interface ShardConfig {
    uri: string;
    poolSize?: number;
    maxOverflow?: number;
    poolTimeout?: number;
    poolRecycle?: number;
}
interface DatabaseMetrics {
    connections: Record<string, number>;
    queries: Record<string, number>;
    errors: Record<string, number>;
    latency: Record<string, number[]>;
}
interface HealthStatus {
    status: 'healthy' | 'unhealthy';
    metrics?: {
        connections: number;
        queries: number;
        errors: number;
        avgLatency: number;
    };
    error?: string;
}
export declare class DatabaseConfig extends EventEmitter {
    private shardMap;
    private redisClient;
    private metrics;
    private readonly defaultPoolSize;
    private readonly defaultMaxOverflow;
    private readonly defaultPoolTimeout;
    private readonly defaultPoolRecycle;
    constructor();
    private initializeRedis;
    initShards(shardConfigs: Record<string, ShardConfig>): Promise<void>;
    addShard(shardName: string, config: ShardConfig): Promise<void>;
    getClient(shardName?: string): Promise<PoolClient>;
    getHealthStatus(): Promise<Record<string, HealthStatus>>;
    getMetrics(): DatabaseMetrics;
    private getShardInfo;
    dispose(): Promise<void>;
}
export declare const dbConfig: DatabaseConfig;
export declare function initDb(): Promise<void>;
export declare function getDb(): DatabaseConfig;
export {};
