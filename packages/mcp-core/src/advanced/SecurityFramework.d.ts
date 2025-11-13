/**
 * Advanced Security Framework for AI Agent Interactions
 *
 * Provides comprehensive security capabilities including authentication, authorization,
 * encryption, audit logging, threat detection, and compliance management.
 */
import { EventEmitter } from 'events';
export interface SecurityConfig {
    encryption: {
        algorithm: string;
        keyLength: number;
        ivLength: number;
    };
    authentication: {
        jwtSecret: string;
        jwtExpiration: string;
        refreshTokenExpiration: string;
        maxLoginAttempts: number;
        lockoutDuration: number;
    };
    authorization: {
        enableRBAC: boolean;
        enableABAC: boolean;
        defaultPermissions: string[];
        adminRoles: string[];
    };
    audit: {
        enableLogging: boolean;
        logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
        retentionDays: number;
        sensitiveFields: string[];
    };
    threatDetection: {
        enableAnomalyDetection: boolean;
        enableRateLimiting: boolean;
        maxRequestsPerMinute: number;
        suspiciousActivityThreshold: number;
    };
}
export interface SecurityContext {
    userId: string;
    agentId: string;
    sessionId: string;
    permissions: string[];
    roles: string[];
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
}
export interface AuthenticationResult {
    success: boolean;
    token?: string;
    refreshToken?: string;
    expiresAt?: Date;
    permissions?: string[];
    roles?: string[];
    error?: string;
}
export interface AuthorizationRequest {
    resource: string;
    action: string;
    context: SecurityContext;
    attributes?: Record<string, any>;
}
export interface AuditEvent {
    id: string;
    timestamp: Date;
    userId: string;
    agentId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'blocked';
    details: Record<string, any>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    ipAddress: string;
    userAgent: string;
}
export interface ThreatAlert {
    id: string;
    type: 'brute_force' | 'anomaly' | 'rate_limit' | 'suspicious_activity' | 'data_breach';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedResources: string[];
    timestamp: Date;
    source: string;
    mitigationActions: string[];
}
export interface EncryptionResult {
    encryptedData: string;
    iv: string;
    tag?: string;
}
export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    rules: SecurityRule[];
    enabled: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface SecurityRule {
    id: string;
    condition: string;
    action: 'allow' | 'deny' | 'log' | 'alert';
    parameters: Record<string, any>;
    enabled: boolean;
}
export declare class SecurityFramework extends EventEmitter {
    private config;
    private auditLog;
    private threatAlerts;
    private securityPolicies;
    private activeSessions;
    private rateLimitCounters;
    private suspiciousActivities;
    constructor(config: SecurityConfig);
    private initializeSecurityFramework;
    /**
     * Authenticate user/agent and create security context
     */
    authenticate(credentials: {
        type: 'password' | 'token' | 'certificate' | 'biometric';
        identifier: string;
        secret: string;
        additionalData?: Record<string, any>;
    }, requestInfo: {
        ipAddress: string;
        userAgent: string;
        agentId?: string;
    }): Promise<AuthenticationResult>;
    /**
     * Authorize access to resources
     */
    authorize(request: AuthorizationRequest): Promise<{
        granted: boolean;
        reason?: string;
        conditions?: string[];
    }>;
    /**
     * Encrypt sensitive data
     */
    encrypt(data: string, key?: string): EncryptionResult;
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedResult: EncryptionResult, key?: string): string;
    /**
     * Encrypt data with specific key
     */
    encryptData(data: string, key: string): Promise<{
        encrypted: string;
        iv: string;
        tag?: string;
    }>;
    /**
     * Decrypt data with specific key
     */
    decryptData(encryptedData: {
        encrypted: string;
        iv: string;
        tag?: string;
    }, key: string): Promise<string>;
    /**
     * Generate secure hash
     */
    generateHash(data: string, salt?: string): string;
    /**
     * Generate HMAC signature
     */
    generateHMAC(data: string, secret: string): string;
    /**
     * Verify HMAC signature
     */
    verifyHMAC(data: string, signature: string, secret: string): boolean;
    /**
     * Create security policy
     */
    createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
    /**
     * Get security metrics and status
     */
    getSecurityMetrics(): {
        auditEvents: number;
        threatAlerts: number;
        activeSessions: number;
        securityPolicies: number;
        riskDistribution: Record<string, number>;
        recentThreats: ThreatAlert[];
    };
    private authenticateWithPassword;
    private authenticateWithToken;
    private authenticateWithCertificate;
    private authenticateWithBiometric;
    private validatePassword;
    private generateJWT;
    private generateRefreshToken;
    private generateEncryptionKey;
    private generateId;
    private isRateLimited;
    private updateRateLimitCounter;
    private checkSuspiciousActivity;
    private checkRBAC;
    private checkABAC;
    private checkSecurityPolicies;
    private evaluateRuleCondition;
    private logAuditEvent;
    private createThreatAlert;
    private createDefaultSecurityPolicies;
    private startSecurityMonitoring;
    private initializeAnomalyDetection;
    private scheduleAuditLogCleanup;
    private cleanupExpiredSessions;
    private analyzeSecurityMetrics;
}
//# sourceMappingURL=SecurityFramework.d.ts.map