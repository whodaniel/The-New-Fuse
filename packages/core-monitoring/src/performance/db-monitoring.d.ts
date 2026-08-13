/**
 * Database Query Performance Monitoring
 * Tracks slow queries, connection pool metrics, and query patterns
 */
export interface QueryMetric {
    id: string;
    query: string;
    duration: number;
    timestamp: number;
    database: string;
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
    table?: string;
    rowsAffected?: number;
    success: boolean;
    error?: string;
    stackTrace?: string[];
}
export interface ConnectionPoolMetric {
    database: string;
    timestamp: number;
    total: number;
    active: number;
    idle: number;
    waiting: number;
    utilization: number;
}
export interface QueryPattern {
    pattern: string;
    count: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    lastSeen: number;
}
export interface DatabaseMonitorConfig {
    enabled: boolean;
    slowQueryThreshold: number;
    captureStackTrace: boolean;
    maxQueryLength: number;
    sampleRate: number;
    retentionPeriod: number;
}
export declare class DatabaseMonitor {
    private config;
    private queries;
    private poolMetrics;
    private queryPatterns;
    private cleanupInterval;
    constructor(config?: Partial<DatabaseMonitorConfig>);
    /**
     * Initialize database monitoring
     */
    initialize(): Promise<void>;
    /**
     * Track a database query
     */
    trackQuery(database: string, query: string, duration: number, options?: {
        operation?: QueryMetric['operation'];
        table?: string;
        rowsAffected?: number;
        success?: boolean;
        error?: string;
    }): void;
    /**
     * Track a query execution
     */
    trackQueryExecution<T>(database: string, query: string, executor: () => Promise<T>, options?: {
        operation?: QueryMetric['operation'];
        table?: string;
    }): Promise<T>;
    /**
     * Record connection pool metrics
     */
    recordPoolMetrics(database: string, metrics: {
        total: number;
        active: number;
        idle: number;
        waiting: number;
    }): void;
    /**
     * Get slow queries
     */
    getSlowQueries(limit?: number): QueryMetric[];
    /**
     * Get query patterns
     */
    getQueryPatterns(limit?: number): QueryPattern[];
    /**
     * Get recent pool metrics
     */
    getPoolMetrics(database?: string, limit?: number): ConnectionPoolMetric[];
    /**
     * Get statistics
     */
    getStatistics(database?: string): {
        totalQueries: number;
        slowQueries: number;
        avgDuration: number;
        maxDuration: number;
        errorRate: number;
        operationCounts: Record<string, number>;
    };
    /**
     * Update query pattern
     */
    private updateQueryPattern;
    /**
     * Normalize query for pattern matching
     */
    private normalizeQuery;
    /**
     * Detect operation from query
     */
    private detectOperation;
    /**
     * Truncate query to max length
     */
    private truncateQuery;
    /**
     * Capture stack trace
     */
    private captureStackTrace;
    /**
     * Should sample this query
     */
    private shouldSample;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Cleanup old data
     */
    private cleanup;
    /**
     * Cleanup on destroy
     */
    destroy(): void;
}
/**
 * Create database monitor from environment variables
 */
export declare function createDatabaseMonitorFromEnv(): DatabaseMonitor;
//# sourceMappingURL=db-monitoring.d.ts.map