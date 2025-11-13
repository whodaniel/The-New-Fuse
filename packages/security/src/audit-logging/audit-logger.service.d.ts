import { PrismaService } from '@the-new-fuse/database';
import { ConfigService } from '@nestjs/config';
export interface AuditLogEntry {
    id?: string;
    userId?: string;
    sessionId?: string;
    action: string;
    resource: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'auth' | 'data' | 'admin' | 'security' | 'system';
    outcome: 'success' | 'failure' | 'blocked' | 'partial';
    metadata?: Record<string, any>;
}
export interface SecurityAlert {
    type: 'suspicious_activity' | 'brute_force' | 'account_takeover' | 'privilege_escalation';
    userId?: string;
    ipAddress: string;
    description: string;
    severity: 'medium' | 'high' | 'critical';
    details: Record<string, any>;
    timestamp: Date;
}
export interface AuditSearchQuery {
    userId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    outcome?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare class AuditLoggerService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly MAX_DETAILS_SIZE;
    private readonly RETENTION_DAYS;
    private readonly FAILED_LOGIN_THRESHOLD;
    private readonly SUSPICIOUS_ACTIVITY_THRESHOLD;
    private readonly BRUTE_FORCE_THRESHOLD;
    constructor(prisma: PrismaService, configService: ConfigService);
    /**
     * Log an authentication event
     */
    logAuthEvent(entry: Omit<AuditLogEntry, 'timestamp' | 'category'>): Promise<void>;
    /**
     * Log user login attempt
     */
    logLoginAttempt(email: string, userId: string | null, success: boolean, ipAddress: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log user registration
     */
    logUserRegistration(userId: string, email: string, ipAddress: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log password change
     */
    logPasswordChange(userId: string, success: boolean, ipAddress: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log password reset request
     */
    logPasswordResetRequest(email: string, ipAddress: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log token refresh
     */
    logTokenRefresh(userId: string, success: boolean, ipAddress: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log logout event
     */
    logLogout(userId: string, sessionType: 'single' | 'all_devices', ipAddress: string, userAgent?: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(userId: string | null, activityType: string, ipAddress: string, description: string, details?: Record<string, any>, userAgent?: string): Promise<void>;
    /**
     * Log rate limit exceeded
     */
    logRateLimitExceeded(endpoint: string, identifier: string, ipAddress: string, details?: Record<string, any>): Promise<void>;
    /**
     * Search audit logs with advanced filtering
     */
    searchAuditLogs(query: AuditSearchQuery): Promise<{
        logs: AuditLogEntry[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get security alerts for a time period
     */
    getSecurityAlerts(startDate: Date, endDate: Date, severity?: 'medium' | 'high' | 'critical'): Promise<SecurityAlert[]>;
    /**
     * Generate security report for a user
     */
    generateUserSecurityReport(userId: string, days?: number): Promise<{
        totalEvents: number;
        failedLogins: number;
        successfulLogins: number;
        passwordChanges: number;
        suspiciousActivities: number;
        uniqueIPs: string[];
        recentEvents: AuditLogEntry[];
    }>;
    /**
     * Cleanup old audit logs (run as cron job)
     */
    cleanupOldLogs(retentionDays?: number): Promise<number>;
}
//# sourceMappingURL=audit-logger.service.d.ts.map