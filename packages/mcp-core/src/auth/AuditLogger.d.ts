/**
 * Audit Logger for MCP security events
 *
 * Provides comprehensive audit logging for security events, access attempts,
 * and system activities with configurable storage backends and retention policies.
 */
import { EventEmitter } from 'events';
import { AuthAuditEvent } from './AuthenticationManager';
import { MCPOperation } from './PermissionValidator';
/**
 * Audit event severity levels
 */
export declare enum AuditSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Audit event categories
 */
export declare enum AuditCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    RESOURCE_ACCESS = "resource_access",
    TOOL_EXECUTION = "tool_execution",
    SYSTEM_ADMIN = "system_admin",
    SECURITY_VIOLATION = "security_violation",
    CONFIGURATION = "configuration",
    DATA_ACCESS = "data_access"
}
/**
 * Enhanced audit event interface
 */
export interface EnhancedAuditEvent extends AuthAuditEvent {
    /** Event ID */
    id: string;
    /** Event severity */
    severity: AuditSeverity;
    /** Event category */
    category: AuditCategory;
    /** MCP operation */
    mcpOperation?: MCPOperation;
    /** Session ID */
    sessionId?: string;
    /** Request ID */
    requestId?: string;
    /** Source system/component */
    source: string;
    /** Target system/component */
    target?: string;
    /** Event duration (ms) */
    duration?: number;
    /** Request size (bytes) */
    requestSize?: number;
    /** Response size (bytes) */
    responseSize?: number;
    /** Geographic location */
    location?: {
        country?: string;
        region?: string;
        city?: string;
        coordinates?: [number, number];
    };
    /** Device information */
    device?: {
        type?: string;
        os?: string;
        browser?: string;
        version?: string;
    };
    /** Risk score (0-100) */
    riskScore?: number;
    /** Tags for categorization */
    tags?: string[];
}
/**
 * Audit storage backend interface
 */
export interface AuditStorageBackend {
    /** Store audit event */
    store(event: EnhancedAuditEvent): Promise<void>;
    /** Query audit events */
    query(filter: AuditQueryFilter): Promise<EnhancedAuditEvent[]>;
    /** Delete old events */
    cleanup(retentionDays: number): Promise<number>;
    /** Get storage statistics */
    getStats(): Promise<AuditStorageStats>;
}
/**
 * Audit query filter
 */
export interface AuditQueryFilter {
    /** Start date */
    startDate?: Date;
    /** End date */
    endDate?: Date;
    /** User ID */
    userId?: string;
    /** Event type */
    type?: string;
    /** Category */
    category?: AuditCategory;
    /** Severity */
    severity?: AuditSeverity;
    /** Success status */
    success?: boolean;
    /** Resource pattern */
    resource?: string;
    /** Operation */
    operation?: string;
    /** Source */
    source?: string;
    /** Minimum risk score */
    minRiskScore?: number;
    /** Tags */
    tags?: string[];
    /** Limit */
    limit?: number;
    /** Offset */
    offset?: number;
}
/**
 * Audit storage statistics
 */
export interface AuditStorageStats {
    /** Total events */
    totalEvents: number;
    /** Events by category */
    eventsByCategory: Record<AuditCategory, number>;
    /** Events by severity */
    eventsBySeverity: Record<AuditSeverity, number>;
    /** Storage size (bytes) */
    storageSize: number;
    /** Oldest event date */
    oldestEvent?: Date;
    /** Newest event date */
    newestEvent?: Date;
}
/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
    /** Enable audit logging */
    enabled: boolean;
    /** Storage backend */
    storageBackend: AuditStorageBackend;
    /** Retention period in days */
    retentionDays: number;
    /** Enable real-time alerting */
    enableAlerting: boolean;
    /** Alert thresholds */
    alertThresholds: {
        failedLoginAttempts: number;
        highRiskEvents: number;
        suspiciousActivity: number;
    };
    /** Enable event enrichment */
    enableEnrichment: boolean;
    /** Batch size for bulk operations */
    batchSize: number;
    /** Flush interval (ms) */
    flushInterval: number;
}
/**
 * File-based audit storage backend
 */
export declare class FileAuditStorage implements AuditStorageBackend {
    private logDirectory;
    private events;
    constructor(logDirectory?: string);
    store(event: EnhancedAuditEvent): Promise<void>;
    query(filter: AuditQueryFilter): Promise<EnhancedAuditEvent[]>;
    cleanup(retentionDays: number): Promise<number>;
    getStats(): Promise<AuditStorageStats>;
    private ensureLogDirectory;
    private getDateString;
}
/**
 * Audit Logger class
 */
export declare class AuditLogger extends EventEmitter {
    private config;
    private eventBuffer;
    private flushTimer?;
    private eventIdCounter;
    constructor(config?: Partial<AuditLoggerConfig>);
    /**
     * Log authentication event
     */
    logAuthentication(userId: string, success: boolean, method: string, clientIp?: string, userAgent?: string, error?: string): Promise<void>;
    /**
     * Log authorization event
     */
    logAuthorization(userId: string, resource: string, operation: string, success: boolean, reason?: string, mcpOperation?: MCPOperation): Promise<void>;
    /**
     * Log resource access event
     */
    logResourceAccess(userId: string, resource: string, operation: string, success: boolean, duration?: number, requestSize?: number, responseSize?: number): Promise<void>;
    /**
     * Log tool execution event
     */
    logToolExecution(userId: string, toolName: string, success: boolean, duration?: number, parameters?: Record<string, any>, result?: any, error?: string): Promise<void>;
    /**
     * Log security violation
     */
    logSecurityViolation(userId: string, violationType: string, description: string, severity?: AuditSeverity, resource?: string, clientIp?: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log system administration event
     */
    logSystemAdmin(userId: string, operation: string, target: string, success: boolean, changes?: Record<string, any>, error?: string): Promise<void>;
    /**
     * Query audit events
     */
    queryEvents(filter: AuditQueryFilter): Promise<EnhancedAuditEvent[]>;
    /**
     * Get audit statistics
     */
    getAuditStats(): Promise<AuditStorageStats>;
    /**
     * Clean up old audit events
     */
    cleanup(): Promise<number>;
    /**
     * Flush buffered events to storage
     */
    flush(): Promise<void>;
    /**
     * Create audit event with common fields
     */
    private createAuditEvent;
    /**
     * Log audit event
     */
    private logEvent;
    /**
     * Enrich event with additional context
     */
    private enrichEvent;
    /**
     * Calculate risk score for event
     */
    private calculateRiskScore;
    /**
     * Parse user agent string
     */
    private parseUserAgent;
    /**
     * Check alert conditions
     */
    private checkAlertConditions;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Start flush timer
     */
    private startFlushTimer;
    /**
     * Stop flush timer
     */
    private stopFlushTimer;
    /**
     * Cleanup resources
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=AuditLogger.d.ts.map