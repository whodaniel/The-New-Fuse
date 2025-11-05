import { LoggingService } from '../services/logging.service';
export interface AuditEvent {
    id: string;
    userId?: string;
    agentId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
}
export declare class AuditService {
    private readonly logger;
    constructor(logger: LoggingService);
    /**
     * Log an audit event
     */
    logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Log a successful action
     */
    logSuccess(action: string, resource: string, userId?: string, agentId?: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log a failed action
     */
    logFailure(action: string, resource: string, errorMessage: string, userId?: string, agentId?: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log user authentication events
     */
    logAuthEvent(action: 'login' | 'logout' | 'login_failed' | 'token_refresh', userId: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log agent actions
     */
    logAgentAction(action: string, agentId: string, userId?: string, resource?: string, resourceId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log data access events
     */
    logDataAccess(action: 'read' | 'create' | 'update' | 'delete', resource: string, resourceId: string, userId?: string, agentId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log security events
     */
    logSecurityEvent(action: string, severity: 'low' | 'medium' | 'high' | 'critical', userId?: string, agentId?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log workflow execution events
     */
    logWorkflowExecution(workflowName: string, userId: string, userEmail?: string, action?: string, agentIds?: string[]): Promise<void>;
    /**
     * Log permission change events
     */
    logPermissionChange(action: 'grant' | 'revoke' | 'modify', userId: string, agentId: string, resource: string, details?: Record<string, any>): Promise<void>;
    /**
     * Generate a unique ID for audit events
     */
    private generateId;
    /**
     * Get audit events for a user (placeholder - would query database in real implementation)
     */
    getUserAuditEvents(userId: string, limit?: number): Promise<AuditEvent[]>;
    /**
     * Get audit events for an agent (placeholder - would query database in real implementation)
     */
    getAgentAuditEvents(agentId: string, limit?: number): Promise<AuditEvent[]>;
    /**
     * Get logs with filtering and pagination
     */
    getLogs(filters?: {
        userId?: string;
        agentId?: string;
        action?: string;
        resource?: string;
        success?: boolean;
        startDate?: Date;
        endDate?: Date;
    }, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<{
        logs: AuditEvent[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Get audit logs with full details
     */
    getAuditLogs(options?: {
        userId?: string;
        agentId?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<AuditEvent[]>;
    /**
     * Get audit statistics and metrics
     */
    getAuditStats(timeframe?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        totalEvents: number;
        successfulEvents: number;
        failedEvents: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        topResources: Array<{
            resource: string;
            count: number;
        }>;
        userActivityCount: number;
        agentActivityCount: number;
    }>;
    /**
     * Export audit logs for compliance
     */
    exportAuditLogs(format: 'json' | 'csv' | 'xlsx', filters?: {
        userId?: string;
        agentId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Buffer | string>;
    /**
     * Find audit log by ID
     */
    findById(id: string): Promise<AuditEvent | null>;
    /**
     * Log workflow versioning events
     */
    logWorkflowVersioning(action: 'create' | 'update' | 'delete' | 'publish' | 'rollback', workflowId: string, version: string, userId?: string, agentId?: string, details?: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=audit.service.d.ts.map