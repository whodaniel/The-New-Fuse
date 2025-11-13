/**
 * Connection Pool Optimization System
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
    /** Minimum pool size */
    minSize: number;
    /** Maximum pool size */
    maxSize: number;
    /** Connection timeout (ms) */
    connectionTimeout: number;
    /** Idle timeout (ms) */
    idleTimeout: number;
    /** Maximum wait time for connection (ms) */
    maxWaitTime: number;
    /** Health check interval (ms) */
    healthCheckInterval: number;
    /** Enable connection validation */
    validateConnections: boolean;
    /** Connection retry attempts */
    retryAttempts: number;
    /** Retry delay (ms) */
    retryDelay: number;
}
/**
 * Connection interface
 */
export interface IConnection {
    /** Connection ID */
    id: string;
    /** Connection status */
    status: 'idle' | 'active' | 'invalid';
    /** Creation timestamp */
    createdAt: Date;
    /** Last used timestamp */
    lastUsed: Date;
    /** Usage count */
    usageCount: number;
    /** Connect to target */
    connect(): Promise<void>;
    /** Disconnect */
    disconnect(): Promise<void>;
    /** Check if connection is healthy */
    isHealthy(): Promise<boolean>;
    /** Execute operation */
    execute<T>(operation: () => Promise<T>): Promise<T>;
}
/**
 * Connection factory interface
 */
export interface IConnectionFactory<T extends IConnection> {
    /** Create new connection */
    createConnection(): Promise<T>;
    /** Validate connection */
    validateConnection(connection: T): Promise<boolean>;
}
/**
 * Pool statistics
 */
export interface PoolStatistics {
    /** Total connections */
    totalConnections: number;
    /** Active connections */
    activeConnections: number;
    /** Idle connections */
    idleConnections: number;
    /** Invalid connections */
    invalidConnections: number;
    /** Pending requests */
    pendingRequests: number;
    /** Total requests served */
    totalRequests: number;
    /** Average wait time */
    averageWaitTime: number;
    /** Pool utilization rate */
    utilizationRate: number;
}
/**
 * Optimized connection pool implementation
 */
export declare class OptimizedConnectionPool<T extends IConnection> extends EventEmitter {
    private readonly config;
    private readonly factory;
    private readonly logger;
    private readonly connections;
    private readonly idleConnections;
    private readonly activeConnections;
    private readonly pendingRequests;
    private healthCheckTimer?;
    private optimizationTimer?;
    private running;
    private stats;
    constructor(config: ConnectionPoolConfig, factory: IConnectionFactory<T>, logger?: Logger);
    /**
     * Initialize the connection pool
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the connection pool
     */
    shutdown(): Promise<void>;
    /**
     * Acquire a connection from the pool
     */
    acquire(): Promise<T>;
    /**
     * Release a connection back to the pool
     */
    release(connection: T): Promise<void>;
    /**
     * Get pool statistics
     */
    getStatistics(): PoolStatistics;
    /**
     * Optimize pool size based on usage patterns
     */
    optimizePoolSize(): Promise<void>;
    /**
     * Get an idle connection
     */
    private getIdleConnection;
    /**
     * Create a new connection
     */
    private createConnection;
    /**
     * Destroy a connection
     */
    private destroyConnection;
    /**
     * Move connection to active set
     */
    private moveToActive;
    /**
     * Move connection to idle set
     */
    private moveToIdle;
    /**
     * Ensure minimum connections
     */
    private ensureMinimumConnections;
    /**
     * Scale up the pool
     */
    private scaleUp;
    /**
     * Start health checks
     */
    private startHealthChecks;
    /**
     * Perform health checks on idle connections
     */
    private performHealthChecks;
    /**
     * Start optimization
     */
    private startOptimization;
    /**
     * Record wait time for statistics
     */
    private recordWaitTime;
}
/**
 * Connection pool factory
 */
export declare class ConnectionPoolFactory {
    /**
     * Create optimized connection pool
     */
    static createOptimizedPool<T extends IConnection>(factory: IConnectionFactory<T>, config?: Partial<ConnectionPoolConfig>): OptimizedConnectionPool<T>;
    /**
     * Create high-throughput pool
     */
    static createHighThroughputPool<T extends IConnection>(factory: IConnectionFactory<T>): OptimizedConnectionPool<T>;
    /**
     * Create resource-efficient pool
     */
    static createResourceEfficientPool<T extends IConnection>(factory: IConnectionFactory<T>): OptimizedConnectionPool<T>;
}
//# sourceMappingURL=ConnectionPoolOptimizer.d.ts.map