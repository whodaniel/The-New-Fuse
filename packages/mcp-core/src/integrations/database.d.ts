/**
 * Database Integration for MCP Core
 *
 * This module provides integration with The New Fuse database systems,
 * enabling persistent storage of MCP service information, metrics, and state.
 */
export interface DatabaseIntegrationConfig {
    enabled: boolean;
    autoMigrate: boolean;
    enableMetrics: boolean;
    enableAuditLog: boolean;
    cacheTTL: number;
    batchSize: number;
}
export interface MCPServiceRecord {
    id: string;
    name: string;
    version: string;
    endpoint: string;
    capabilities: string[];
    resources: any;
    tools: any;
    status: string;
    metadata: any;
    healthScore: number;
    tags: string[];
    registeredAt: Date;
    lastHeartbeat: Date;
    lastActivity: Date;
    metrics?: MCPServiceMetrics;
}
export interface MCPServiceMetrics {
    serviceId: string;
    timestamp: Date;
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    connections: number;
    throughput: number;
}
export interface MCPAuditLog {
    id: string;
    serviceId: string;
    action: string;
    details: any;
    timestamp: Date;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}
/**
 * Database Integration Bridge
 * Provides persistent storage capabilities for MCP services
 */
export declare const DatabaseIntegration: {
    isAvailable: boolean;
    /**
     * Initialize database connection and schema
     */
    initialize(config?: Partial<DatabaseIntegrationConfig>): Promise<boolean>;
    /**
     * Save MCP service information to database
     */
    saveServiceInfo(serviceInfo: any): Promise<MCPServiceRecord | null>;
    /**
     * Get MCP service information from database
     */
    getServiceInfo(serviceId: string): Promise<MCPServiceRecord | null>;
    /**
     * Get all MCP services from database
     */
    getAllServices(filters?: {
        status?: string;
        capabilities?: string[];
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<MCPServiceRecord[]>;
    /**
     * Delete MCP service from database
     */
    deleteService(serviceId: string): Promise<boolean>;
    /**
     * Save service metrics to database
     */
    saveMetrics(metrics: Omit<MCPServiceMetrics, "timestamp">): Promise<boolean>;
    /**
     * Get service metrics from database
     */
    getMetrics(serviceId: string, options?: {
        from?: Date;
        to?: Date;
        limit?: number;
        aggregation?: "raw" | "hourly" | "daily";
    }): Promise<MCPServiceMetrics[]>;
    /**
     * Log audit event
     */
    logAudit(auditLog: Omit<MCPAuditLog, "id" | "timestamp">): Promise<boolean>;
    /**
     * Get audit logs
     */
    getAuditLogs(serviceId?: string, options?: {
        action?: string;
        from?: Date;
        to?: Date;
        limit?: number;
        offset?: number;
    }): Promise<MCPAuditLog[]>;
    /**
     * Clean up old records
     */
    cleanup(options?: {
        metricsRetentionDays?: number;
        auditRetentionDays?: number;
        inactiveServiceDays?: number;
    }): Promise<{
        deletedMetrics: number;
        deletedAudits: number;
        deletedServices: number;
    }>;
    /**
     * Execute database operation with retry logic
     */
    executeWithRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
    /**
     * Get database health and statistics
     */
    getHealthStats(): Promise<{
        connected: boolean;
        services: number;
        metrics: number;
        audits: number;
        lastActivity: Date | null;
    }>;
    /**
     * Disconnect from database
     */
    disconnect(): Promise<void>;
};
/**
 * Default database integration configuration
 */
export declare const DEFAULT_DATABASE_CONFIG: DatabaseIntegrationConfig;
/**
 * Database Integration Factory
 */
export declare class DatabaseIntegrationFactory {
    static create(config?: Partial<DatabaseIntegrationConfig>): Promise<{
        config: {
            enabled: boolean;
            autoMigrate: boolean;
            enableMetrics: boolean;
            enableAuditLog: boolean;
            cacheTTL: number;
            batchSize: number;
        };
        integration: {
            isAvailable: boolean;
            /**
             * Initialize database connection and schema
             */
            initialize(config?: Partial<DatabaseIntegrationConfig>): Promise<boolean>;
            /**
             * Save MCP service information to database
             */
            saveServiceInfo(serviceInfo: any): Promise<MCPServiceRecord | null>;
            /**
             * Get MCP service information from database
             */
            getServiceInfo(serviceId: string): Promise<MCPServiceRecord | null>;
            /**
             * Get all MCP services from database
             */
            getAllServices(filters?: {
                status?: string;
                capabilities?: string[];
                tags?: string[];
                limit?: number;
                offset?: number;
            }): Promise<MCPServiceRecord[]>;
            /**
             * Delete MCP service from database
             */
            deleteService(serviceId: string): Promise<boolean>;
            /**
             * Save service metrics to database
             */
            saveMetrics(metrics: Omit<MCPServiceMetrics, "timestamp">): Promise<boolean>;
            /**
             * Get service metrics from database
             */
            getMetrics(serviceId: string, options?: {
                from?: Date;
                to?: Date;
                limit?: number;
                aggregation?: "raw" | "hourly" | "daily";
            }): Promise<MCPServiceMetrics[]>;
            /**
             * Log audit event
             */
            logAudit(auditLog: Omit<MCPAuditLog, "id" | "timestamp">): Promise<boolean>;
            /**
             * Get audit logs
             */
            getAuditLogs(serviceId?: string, options?: {
                action?: string;
                from?: Date;
                to?: Date;
                limit?: number;
                offset?: number;
            }): Promise<MCPAuditLog[]>;
            /**
             * Clean up old records
             */
            cleanup(options?: {
                metricsRetentionDays?: number;
                auditRetentionDays?: number;
                inactiveServiceDays?: number;
            }): Promise<{
                deletedMetrics: number;
                deletedAudits: number;
                deletedServices: number;
            }>;
            /**
             * Execute database operation with retry logic
             */
            executeWithRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
            /**
             * Get database health and statistics
             */
            getHealthStats(): Promise<{
                connected: boolean;
                services: number;
                metrics: number;
                audits: number;
                lastActivity: Date | null;
            }>;
            /**
             * Disconnect from database
             */
            disconnect(): Promise<void>;
        };
        isInitialized: boolean;
        getService(serviceId: string): Promise<MCPServiceRecord | null>;
        saveService(serviceInfo: any): Promise<MCPServiceRecord | null>;
        recordMetrics(serviceId: string, metrics: Omit<MCPServiceMetrics, "serviceId" | "timestamp">): Promise<boolean>;
        performCleanup(): Promise<{
            deletedMetrics: number;
            deletedAudits: number;
            deletedServices: number;
        }>;
    }>;
}
export default DatabaseIntegration;
//# sourceMappingURL=database.d.ts.map