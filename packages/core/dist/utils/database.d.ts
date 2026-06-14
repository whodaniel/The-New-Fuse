import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export declare class DatabaseError extends Error {
    constructor(message: string);
}
export declare class ConnectionError extends DatabaseError {
    constructor(message: string);
}
export declare class QueryError extends DatabaseError {
    originalError?: any | undefined;
    constructor(message: string, originalError?: any | undefined);
}
export interface DatabaseMetrics {
    connections: number;
    activeConnections: number;
    idleConnections: number;
    queries: number;
    errors: number;
    latency: number;
}
export declare class DatabaseService extends EventEmitter {
    private redisService;
    private metrics;
    constructor(redisService: UnifiedRedisService);
    initialize(): Promise<void>;
    query<T>(sql: string, _params?: any[]): Promise<T[]>;
    close(): Promise<void>;
    getMetrics(shardName?: string): DatabaseMetrics | undefined;
    private updateRedisMetrics;
    private updateRedisLatency;
}
//# sourceMappingURL=database.d.ts.map