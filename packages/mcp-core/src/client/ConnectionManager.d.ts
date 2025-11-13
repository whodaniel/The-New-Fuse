/**
 * Connection Manager for MCP Client
 *
 * Handles connection pooling, lifecycle management, connection reuse,
 * automatic reconnection with exponential backoff, and health monitoring
 * for MCP client connections.
 */
import { EventEmitter } from 'events';
import { IConnectionManager, MCPConnection, ConnectionOptions, ConnectionStatus, ConnectionMetrics } from '../interfaces/IMCPConnection';
/**
 * Connection health status interface
 */
interface ConnectionHealth {
    endpoint: string;
    isHealthy: boolean;
    lastHealthCheck: Date;
    consecutiveFailures: number;
    averageResponseTime: number;
    lastError?: Error;
}
/**
 * Connection pool configuration interface
 */
interface ConnectionPoolConfig {
    maxConnections: number;
    maxIdleTime: number;
    healthCheckInterval: number;
    reconnectInterval: number;
    maxReconnectAttempts: number;
}
/**
 * Enhanced Connection Manager implementation with robust connection pooling,
 * automatic reconnection, and health monitoring
 */
export declare class ConnectionManager extends EventEmitter implements IConnectionManager {
    private connections;
    private connectionOptions;
    private connectionHealth;
    private reconnectTimers;
    private healthCheckTimer?;
    private poolConfig;
    private isShuttingDown;
    constructor(poolConfig?: Partial<ConnectionPoolConfig>);
    createConnection(endpoint: string, options: ConnectionOptions): Promise<MCPConnection>;
    private connectWithRetry;
    getConnection(endpoint: string): MCPConnection | null;
    closeConnection(endpoint: string): Promise<void>;
    getConnectionStatus(endpoint: string): ConnectionStatus;
    getConnectionMetrics(): ConnectionMetrics;
    listConnections(): MCPConnection[];
    closeAllConnections(): Promise<void>;
    /**
     * Cleanup inactive connections
     */
    cleanupInactiveConnections(): Promise<void>;
    /**
     * Get connection pool statistics
     */
    getPoolStatistics(): {
        totalConnections: number;
        activeConnections: number;
        inactiveConnections: number;
        healthyConnections: number;
        unhealthyConnections: number;
        endpoints: string[];
        poolConfig: ConnectionPoolConfig;
    };
    /**
     * Handle connection disconnection with automatic reconnection
     */
    private handleConnectionDisconnected;
    /**
     * Handle connection errors
     */
    private handleConnectionError;
    /**
     * Schedule automatic reconnection for a disconnected endpoint
     */
    private scheduleReconnection;
    /**
     * Start health monitoring for all connections
     */
    private startHealthMonitoring;
    /**
     * Perform health checks on all connections
     */
    private performHealthChecks;
    /**
     * Clean up idle connections that haven't been used recently
     */
    private cleanupIdleConnections;
    /**
     * Get health status for a specific connection
     */
    getConnectionHealth(endpoint: string): ConnectionHealth | null;
    /**
     * Get health status for all connections
     */
    getAllConnectionHealth(): ConnectionHealth[];
    /**
     * Force a health check for a specific connection
     */
    checkConnectionHealth(endpoint: string): Promise<boolean>;
    /**
     * Graceful shutdown of the connection manager
     */
    shutdown(): Promise<void>;
    /**
     * Get detailed connection statistics
     */
    getDetailedStatistics(): {
        pool: {
            totalConnections: number;
            activeConnections: number;
            healthyConnections: number;
            maxConnections: number;
            utilizationPercentage: number;
        };
        performance: {
            averageResponseTime: number;
            totalFailures: number;
            reconnectionAttempts: number;
        };
        health: {
            healthyPercentage: number;
            unhealthyConnections: number;
            lastHealthCheck: Date | null;
        };
    };
    /**
     * Get security metrics for connections
     */
    getSecurityMetrics(): {
        security: {
            tlsEnabled: number;
            tlsPercentage: number;
            authenticatedConnections: number;
            authenticationPercentage: number;
            authenticationTypes: Record<string, number>;
        };
        compliance: {
            secureConnections: number;
            insecureConnections: number;
        };
    };
    /**
     * Get performance metrics over time
     */
    getPerformanceMetrics(): {
        throughput: {
            totalDataTransferred: number;
            averageDataPerConnection: number;
        };
        latency: {
            averageResponseTime: number;
            minResponseTime: number;
            maxResponseTime: number;
        };
        reliability: {
            uptime: number;
            successRate: number;
            failureRate: number;
        };
    };
}
export {};
//# sourceMappingURL=ConnectionManager.d.ts.map