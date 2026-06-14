import { ConfigService } from '@nestjs/config';
import 'winston-daily-rotate-file';
export interface SecurityLogEntry {
    timestamp: string;
    level: string;
    message: string;
    category: 'authentication' | 'authorization' | 'rate_limit' | 'input_validation' | 'api_access' | 'security_violation';
    requestId?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    success?: boolean;
    details?: any;
}
export declare class SecurityLoggingService {
    private configService;
    private readonly logger;
    private readonly securityLogger;
    constructor(configService: ConfigService);
    /**
     * Log authentication events
     */
    logAuthEvent(event: 'login' | 'logout' | 'token_refresh' | 'auth_failure' | 'auth_bypass_attempt', details: {
        userId?: string;
        ip?: string;
        userAgent?: string;
        method?: string;
        endpoint?: string;
        success: boolean;
        reason?: string;
        metadata?: any;
    }): void;
    /**
     * Log authorization events
     */
    logAuthZEvent(event: 'access_granted' | 'access_denied' | 'privilege_escalation_attempt', details: {
        userId?: string;
        ip?: string;
        userAgent?: string;
        method?: string;
        endpoint?: string;
        resource?: string;
        permissions?: string[];
        success: boolean;
        reason?: string;
    }): void;
    /**
     * Log rate limiting events
     */
    logRateLimit(action: 'limit_exceeded' | 'ip_blocked' | 'quota_exceeded', details: {
        ip?: string;
        userAgent?: string;
        endpoint?: string;
        method?: string;
        limit?: number;
        current?: number;
        window?: number;
        reason?: string;
    }): void;
    /**
     * Log input validation failures
     */
    logInputValidation(endpoint: string, method: string, details: {
        ip?: string;
        userId?: string;
        field?: string;
        value?: any;
        reason?: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
    }): void;
    /**
     * Log API access events
     */
    logApiAccess(method: string, endpoint: string, details: {
        requestId?: string;
        userId?: string;
        ip?: string;
        userAgent?: string;
        statusCode: number;
        responseTime?: number;
        bytesSent?: number;
    }): void;
    /**
     * Log security violations
     */
    logSecurityViolation(violation: 'sql_injection' | 'xss_attempt' | 'path_traversal' | 'unauthorized_access' | 'suspicious_pattern', details: {
        ip?: string;
        userId?: string;
        endpoint?: string;
        method?: string;
        payload?: any;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        action?: 'blocked' | 'logged' | 'quarantined';
    }): void;
    /**
     * Get security metrics for monitoring
     */
    getSecurityMetrics(): any;
}
//# sourceMappingURL=security-logging.service.d.ts.map