/**
 * Connection Pool Monitoring System
 */
import { IConnectionPoolMonitor } from '../interfaces/IMonitoring';
import { ConnectionPoolMetrics } from '../types/monitoring';
import { Logger } from '../utils/Logger';
export interface ConnectionPoolMonitorConfig {
    /** Metrics retention period (ms) */
    retentionPeriod: number;
}
/**
 * Connection pool monitor implementation
 */
export declare class ConnectionPoolMonitor implements IConnectionPoolMonitor {
    private readonly config;
    private readonly logger;
    private readonly eventHistory;
    private readonly metricsHistory;
    private poolSize;
    private activeConnections;
    private idleConnections;
    private pendingRequests;
    private totalCreated;
    private totalDestroyed;
    private totalLifetime;
    private connectionLifetimes;
    constructor(config: ConnectionPoolMonitorConfig, logger?: Logger);
    /**
     * Record connection creation
     */
    recordConnectionCreated(): void;
    /**
     * Record connection destruction
     */
    recordConnectionDestroyed(lifetime: number): void;
    /**
     * Record connection acquisition
     */
    recordConnectionAcquired(waitTime: number): void;
    /**
     * Record connection release
     */
    recordConnectionReleased(): void;
    /**
     * Record pending request
     */
    recordPendingRequest(): void;
    /**
     * Get pool metrics
     */
    getPoolMetrics(): ConnectionPoolMetrics;
    /**
     * Get pool statistics
     */
    getPoolStatistics(hours: number): ConnectionPoolMetrics[];
    /**
     * Get connection pool analysis
     */
    getPoolAnalysis(hours?: number): {
        utilizationRate: number;
        averageWaitTime: number;
        peakConnections: number;
        connectionTurnover: number;
        efficiency: number;
        recommendations: string[];
    };
    /**
     * Generate pool report
     */
    generatePoolReport(hours?: number): string;
    /**
     * Clean up old records and collect metrics
     */
    private cleanup;
    /**
     * Generate connection ID
     */
    private generateConnectionId;
}
//# sourceMappingURL=ConnectionPoolMonitor.d.ts.map