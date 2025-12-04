export {};
import { EventEmitter } from 'events';
interface DatabaseMetrics {
    queries: number;
    errors: number;
    avgLatencyMs: number;
    connections: {
        active: number;
        idle: number;
        max: number;
    };
    cache: {
        hits: number;
        misses: number;
        size: number;
    };
}
export declare class DatabaseConfig extends EventEmitter {
    private shardMap;
    private redis;
    private metrics;
    constructor();
    initializeRedis(): Promise<void>;
    initShards(shardConfigs: Record<string, any>): Promise<void>;
    addShard(shardName: string, config: any): Promise<void>;
    updateRedisMetrics(shard: string, metric: string, value: number): Promise<void>;
    getConnection(shard: string): Promise<Connection>;
    getMetrics(): DatabaseMetrics;
    close(): Promise<void>;
}
export {};
