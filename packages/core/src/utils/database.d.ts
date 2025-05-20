/**
 * Enhanced database configuration with sharding support, connection pooling,
 * Redis integration, and health monitoring.
 */
import { EventEmitter } from 'events';
export declare class DatabaseConfig extends EventEmitter {
    private shardMap;
    private metrics;
    private redis;
    private readonly defaultPoolSize;
    private readonly defaultMaxOverflow;
    private readonly defaultPoolTimeout;
    private readonly defaultPoolRecycle;
    constructor();
}
