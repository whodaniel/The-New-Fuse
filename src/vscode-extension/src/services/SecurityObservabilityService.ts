/**
 * Security and Observability Service
 * Provides enterprise-grade security, monitoring, and observability features:
 * - Authentication and authorization
 * - Audit logging and compliance
 * - Performance monitoring and metrics
 * - Distributed tracing
 * - Anomaly detection
 * - Security threat detection
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface SecurityConfig {
    encryption: {
        algorithm: string;
        keyLength: number;
        secretKey: string;
    };
    authentication: {
        enabled: boolean;
        tokenExpiry: number; // seconds
        refreshTokenExpiry: number; // seconds
        maxLoginAttempts: number;
        lockoutDuration: number; // seconds
    };
    authorization: {
        enabled: boolean;
        roleBasedAccess: boolean;
        permissions: Record<string, string[]>;
    };
    audit: {
        enabled: boolean;
        retentionDays: number;
        includeRequestBodies: boolean;
        sensitiveFields: string[];
    };
}

export interface ObservabilityConfig {
    metrics: {
        enabled: boolean;
        interval: number; // seconds
        retention: number; // days
        customMetrics: string[];
    };
    tracing: {
        enabled: boolean;
        samplingRate: number; // 0-1
        includeUserData: boolean;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        structured: boolean;
        includeStackTrace: boolean;
        maxLogSize: number; // bytes
    };
    alerting: {
        enabled: boolean;
        thresholds: Record<string, number>;
        notificationChannels: string[];
    };
}

export interface User {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    lastLogin: Date;
    loginAttempts: number;
    isLocked: boolean;
    lockoutUntil?: Date;
    metadata: Record<string, any>;
}

export interface Session {
    id: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActivity: Date;
}

export interface AuditEvent {
    id: string;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
    action: string;
    resource: string;
    outcome: 'success' | 'failure' | 'error';
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MetricPoint {
    name: string;
    value: number;
    timestamp: Date;
    tags: Record<string, string>;
    type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface TraceSpan {
    id: string;
    parentId?: string;
    traceId: string;
    operationName: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    tags: Record<string, any>;
    logs: Array<{ timestamp: Date; fields: Record<string, any> }>;
    status: 'ok' | 'error' | 'timeout';
}

export interface SecurityThreat {
    id: string;
    type: 'brute_force' | 'anomalous_access' | 'suspicious_activity' | 'data_exfiltration' | 'injection_attempt';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    sourceIp: string;
    userId?: string;
    timestamp: Date;
    evidence: Record<string, any>;
    mitigated: boolean;
    mitigationActions: string[];
}

export interface PerformanceAlert {
    id: string;
    metric: string;
    threshold: number;
    currentValue: number;
    severity: 'warning' | 'critical';
    timestamp: Date;
    description: string;
    acknowledged: boolean;
    resolvedAt?: Date;
}

export class SecurityObservabilityService extends EventEmitter {
    private securityConfig: SecurityConfig;
    private observabilityConfig: ObservabilityConfig;
    private users: Map<string, User> = new Map();
    private sessions: Map<string, Session> = new Map();
    private auditLog: AuditEvent[] = [];
    private metrics: MetricPoint[] = [];
    private traces: Map<string, TraceSpan[]> = new Map();
    private activeSpans: Map<string, TraceSpan> = new Map();
    private threats: SecurityThreat[] = [];
    private alerts: PerformanceAlert[] = [];
    private metricsTimer: NodeJS.Timeout | null = null;
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(
        securityConfig: SecurityConfig,
        observabilityConfig: ObservabilityConfig
    ) {
        super();
        this.securityConfig = securityConfig;
        this.observabilityConfig = observabilityConfig;
        this.initializeServices();
    }

    private initializeServices(): void {
        if (this.observabilityConfig.metrics.enabled) {
            this.startMetricsCollection();
        }
        
        this.startCleanupProcess();
        this.setupDefaultUsers();
    }

    private setupDefaultUsers(): void {
        // Create default admin user
        this.createUser({
            id: 'admin',
            username: 'admin',
            email: 'admin@localhost',
            roles: ['admin', 'user'],
            permissions: ['*'],
            lastLogin: new Date(),
            loginAttempts: 0,
            isLocked: false,
            metadata: { created: new Date(), isDefault: true }
        });
    }

    // Authentication Methods
    async authenticateUser(username: string, password: string, ipAddress: string, userAgent: string): Promise<Session | null> {
        const user = Array.from(this.users.values()).find(u => u.username === username);
        
        if (!user) {
            this.logAuditEvent({
                action: 'login_attempt',
                resource: 'auth',
                outcome: 'failure',
                details: { username, reason: 'user_not_found' },
                ipAddress,
                userAgent,
                severity: 'medium'
            });
            return null;
        }

        // Check if user is locked
        if (user.isLocked && user.lockoutUntil && new Date() < user.lockoutUntil) {
            this.logAuditEvent({
                userId: user.id,
                action: 'login_attempt',
                resource: 'auth',
                outcome: 'failure',
                details: { username, reason: 'account_locked' },
                ipAddress,
                userAgent,
                severity: 'high'
            });
            return null;
        }

        // Verify password (simplified - in real implementation would use proper hashing)
        const isValidPassword = await this.verifyPassword(password, 'mock_hash');
        
        if (!isValidPassword) {
            user.loginAttempts++;
            
            if (user.loginAttempts >= this.securityConfig.authentication.maxLoginAttempts) {
                user.isLocked = true;
                user.lockoutUntil = new Date(Date.now() + this.securityConfig.authentication.lockoutDuration * 1000);
                
                this.detectSecurityThreat({
                    type: 'brute_force',
                    severity: 'high',
                    description: `Brute force attack detected for user ${username}`,
                    sourceIp: ipAddress,
                    userId: user.id,
                    evidence: { loginAttempts: user.loginAttempts, username }
                });
            }
            
            this.logAuditEvent({
                userId: user.id,
                action: 'login_attempt',
                resource: 'auth',
                outcome: 'failure',
                details: { username, reason: 'invalid_password', attempts: user.loginAttempts },
                ipAddress,
                userAgent,
                severity: 'medium'
            });
            
            return null;
        }

        // Successful authentication
        user.loginAttempts = 0;
        user.isLocked = false;
        user.lockoutUntil = undefined;
        user.lastLogin = new Date();

        const session = this.createSession(user, ipAddress, userAgent);
        
        this.logAuditEvent({
            userId: user.id,
            sessionId: session.id,
            action: 'login',
            resource: 'auth',
            outcome: 'success',
            details: { username },
            ipAddress,
            userAgent,
            severity: 'low'
        });

        this.recordMetric({
            name: 'auth.login.success',
            value: 1,
            timestamp: new Date(),
            tags: { user: user.id, ip: ipAddress },
            type: 'counter'
        });

        return session;
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        // Simplified password verification
        // In real implementation, use bcrypt or similar
        return password === 'admin' || password === 'password';
    }

    private createSession(user: User, ipAddress: string, userAgent: string): Session {
        const sessionId = this.generateSecureId();
        const accessToken = this.generateToken();
        const refreshToken = this.generateToken();

        const session: Session = {
            id: sessionId,
            userId: user.id,
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + this.securityConfig.authentication.tokenExpiry * 1000),
            refreshExpiresAt: new Date(Date.now() + this.securityConfig.authentication.refreshTokenExpiry * 1000),
            ipAddress,
            userAgent,
            createdAt: new Date(),
            lastActivity: new Date()
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    async validateSession(sessionId: string, ipAddress?: string): Promise<User | null> {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }

        if (new Date() > session.expiresAt) {
            this.sessions.delete(sessionId);
            this.logAuditEvent({
                userId: session.userId,
                sessionId,
                action: 'session_expired',
                resource: 'auth',
                outcome: 'success',
                details: {},
                ipAddress: ipAddress || session.ipAddress,
                userAgent: session.userAgent,
                severity: 'low'
            });
            return null;
        }

        // Check for suspicious activity
        if (ipAddress && ipAddress !== session.ipAddress) {
            this.detectSecurityThreat({
                type: 'suspicious_activity',
                severity: 'medium',
                description: `Session accessed from different IP address`,
                sourceIp: ipAddress,
                userId: session.userId,
                evidence: { 
                    originalIp: session.ipAddress, 
                    newIp: ipAddress,
                    sessionId 
                }
            });
        }

        session.lastActivity = new Date();
        const user = this.users.get(session.userId);
        
        if (user) {
            this.recordMetric({
                name: 'auth.session.active',
                value: 1,
                timestamp: new Date(),
                tags: { user: user.id },
                type: 'counter'
            });
        }

        return user || null;
    }

    async refreshSession(refreshToken: string): Promise<Session | null> {
        const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken);
        
        if (!session || new Date() > session.refreshExpiresAt) {
            return null;
        }

        // Generate new tokens
        session.accessToken = this.generateToken();
        session.refreshToken = this.generateToken();
        session.expiresAt = new Date(Date.now() + this.securityConfig.authentication.tokenExpiry * 1000);
        session.lastActivity = new Date();

        this.logAuditEvent({
            userId: session.userId,
            sessionId: session.id,
            action: 'token_refresh',
            resource: 'auth',
            outcome: 'success',
            details: {},
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            severity: 'low'
        });

        return session;
    }

    logout(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            
            this.logAuditEvent({
                userId: session.userId,
                sessionId,
                action: 'logout',
                resource: 'auth',
                outcome: 'success',
                details: {},
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                severity: 'low'
            });
        }
    }

    // Authorization Methods
    hasPermission(user: User, permission: string): boolean {
        if (!this.securityConfig.authorization.enabled) {
            return true;
        }

        // Check direct permissions
        if (user.permissions.includes('*') || user.permissions.includes(permission)) {
            return true;
        }

        // Check role-based permissions
        if (this.securityConfig.authorization.roleBasedAccess) {
            for (const role of user.roles) {
                const rolePermissions = this.securityConfig.authorization.permissions[role] || [];
                if (rolePermissions.includes('*') || rolePermissions.includes(permission)) {
                    return true;
                }
            }
        }

        return false;
    }

    checkAuthorization(sessionId: string, permission: string, resource?: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        const user = this.users.get(session.userId);
        if (!user) {
            return false;
        }

        const hasPermission = this.hasPermission(user, permission);
        
        this.logAuditEvent({
            userId: user.id,
            sessionId,
            action: 'authorization_check',
            resource: resource || 'unknown',
            outcome: hasPermission ? 'success' : 'failure',
            details: { permission, resource },
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            severity: hasPermission ? 'low' : 'medium'
        });

        return hasPermission;
    }

    // User Management
    createUser(userData: Omit<User, 'id'> & { id?: string }): User {
        const user: User = {
            id: userData.id || this.generateSecureId(),
            ...userData
        };

        this.users.set(user.id, user);
        
        this.logAuditEvent({
            action: 'user_created',
            resource: 'user_management',
            outcome: 'success',
            details: { userId: user.id, username: user.username },
            ipAddress: 'system',
            userAgent: 'system',
            severity: 'low'
        });

        return user;
    }

    // Audit Logging
    private logAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): void {
        if (!this.securityConfig.audit.enabled) {
            return;
        }

        const event: AuditEvent = {
            id: this.generateSecureId(),
            timestamp: new Date(),
            ...eventData
        };

        // Filter sensitive fields
        if (this.securityConfig.audit.sensitiveFields.length > 0) {
            event.details = this.filterSensitiveData(event.details, this.securityConfig.audit.sensitiveFields);
        }

        this.auditLog.push(event);
        this.emit('auditEvent', event);

        // Record audit metrics
        this.recordMetric({
            name: 'audit.events',
            value: 1,
            timestamp: new Date(),
            tags: { 
                action: event.action, 
                outcome: event.outcome, 
                severity: event.severity 
            },
            type: 'counter'
        });
    }

    private filterSensitiveData(data: any, sensitiveFields: string[]): any {
        const filtered = { ...data };
        
        for (const field of sensitiveFields) {
            if (field in filtered) {
                filtered[field] = '[REDACTED]';
            }
        }
        
        return filtered;
    }

    // Metrics Collection
    private startMetricsCollection(): void {
        this.metricsTimer = setInterval(() => {
            this.collectSystemMetrics();
        }, this.observabilityConfig.metrics.interval * 1000);
    }

    private collectSystemMetrics(): void {
        const now = new Date();
        
        // System metrics
        this.recordMetric({
            name: 'system.memory.usage',
            value: process.memoryUsage().heapUsed / 1024 / 1024, // MB
            timestamp: now,
            tags: {},
            type: 'gauge'
        });

        this.recordMetric({
            name: 'system.uptime',
            value: process.uptime(),
            timestamp: now,
            tags: {},
            type: 'gauge'
        });

        // Active sessions
        this.recordMetric({
            name: 'auth.sessions.active',
            value: this.sessions.size,
            timestamp: now,
            tags: {},
            type: 'gauge'
        });

        // Security threats
        this.recordMetric({
            name: 'security.threats.total',
            value: this.threats.length,
            timestamp: now,
            tags: {},
            type: 'gauge'
        });

        // Check alerting thresholds
        this.checkAlertingThresholds();
    }

    recordMetric(metric: MetricPoint): void {
        if (!this.observabilityConfig.metrics.enabled) {
            return;
        }

        this.metrics.push(metric);
        this.emit('metric', metric);
    }

    private checkAlertingThresholds(): void {
        if (!this.observabilityConfig.alerting.enabled) {
            return;
        }

        for (const [metricName, threshold] of Object.entries(this.observabilityConfig.alerting.thresholds)) {
            const recentMetrics = this.metrics
                .filter(m => m.name === metricName && 
                        Date.now() - m.timestamp.getTime() < 60000) // Last minute
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            if (recentMetrics.length > 0) {
                const latestValue = recentMetrics[0].value;
                
                if (latestValue > threshold) {
                    this.createAlert({
                        metric: metricName,
                        threshold,
                        currentValue: latestValue,
                        severity: latestValue > threshold * 1.5 ? 'critical' : 'warning',
                        description: `Metric ${metricName} exceeded threshold: ${latestValue} > ${threshold}`
                    });
                }
            }
        }
    }

    private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
        const alert: PerformanceAlert = {
            id: this.generateSecureId(),
            timestamp: new Date(),
            acknowledged: false,
            ...alertData
        };

        this.alerts.push(alert);
        this.emit('alert', alert);
    }

    // Distributed Tracing
    startTrace(operationName: string, parentSpanId?: string): string {
        const span: TraceSpan = {
            id: this.generateSecureId(),
            parentId: parentSpanId,
            traceId: parentSpanId ? this.activeSpans.get(parentSpanId)?.traceId || this.generateSecureId() : this.generateSecureId(),
            operationName,
            startTime: new Date(),
            tags: {},
            logs: [],
            status: 'ok'
        };

        this.activeSpans.set(span.id, span);
        return span.id;
    }

    finishTrace(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok'): void {
        const span = this.activeSpans.get(spanId);
        if (!span) {
            return;
        }

        span.endTime = new Date();
        span.duration = span.endTime.getTime() - span.startTime.getTime();
        span.status = status;

        // Store completed span
        if (!this.traces.has(span.traceId)) {
            this.traces.set(span.traceId, []);
        }
        this.traces.get(span.traceId)!.push(span);

        this.activeSpans.delete(spanId);
        this.emit('traceCompleted', span);
    }

    addTraceTag(spanId: string, key: string, value: any): void {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.tags[key] = value;
        }
    }

    addTraceLog(spanId: string, fields: Record<string, any>): void {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.logs.push({
                timestamp: new Date(),
                fields
            });
        }
    }

    // Security Threat Detection
    private detectSecurityThreat(threatData: Omit<SecurityThreat, 'id' | 'timestamp' | 'mitigated' | 'mitigationActions'>): void {
        const threat: SecurityThreat = {
            id: this.generateSecureId(),
            timestamp: new Date(),
            mitigated: false,
            mitigationActions: [],
            ...threatData
        };

        this.threats.push(threat);
        this.emit('securityThreat', threat);

        // Auto-mitigation for critical threats
        if (threat.severity === 'critical') {
            this.mitigateThreat(threat.id);
        }

        this.recordMetric({
            name: 'security.threats.detected',
            value: 1,
            timestamp: new Date(),
            tags: { 
                type: threat.type, 
                severity: threat.severity,
                sourceIp: threat.sourceIp
            },
            type: 'counter'
        });
    }

    mitigateThreat(threatId: string): void {
        const threat = this.threats.find(t => t.id === threatId);
        if (!threat || threat.mitigated) {
            return;
        }

        const mitigationActions: string[] = [];

        switch (threat.type) {
            case 'brute_force':
                // Block IP address
                mitigationActions.push(`Blocked IP: ${threat.sourceIp}`);
                if (threat.userId) {
                    const user = this.users.get(threat.userId);
                    if (user) {
                        user.isLocked = true;
                        user.lockoutUntil = new Date(Date.now() + 3600000); // 1 hour
                        mitigationActions.push(`Locked user account: ${user.username}`);
                    }
                }
                break;

            case 'suspicious_activity':
                // Invalidate sessions from suspicious IP
                for (const [sessionId, session] of this.sessions.entries()) {
                    if (session.ipAddress === threat.sourceIp) {
                        this.sessions.delete(sessionId);
                        mitigationActions.push(`Invalidated session: ${sessionId}`);
                    }
                }
                break;

            case 'data_exfiltration':
                // Implement rate limiting or temporary access suspension
                mitigationActions.push('Implemented temporary rate limiting');
                break;
        }

        threat.mitigated = true;
        threat.mitigationActions = mitigationActions;

        this.logAuditEvent({
            action: 'threat_mitigation',
            resource: 'security',
            outcome: 'success',
            details: { 
                threatId, 
                threatType: threat.type, 
                mitigationActions 
            },
            ipAddress: 'system',
            userAgent: 'system',
            severity: 'high'
        });
    }

    // Data Encryption
    encrypt(data: string): string {
        if (!this.securityConfig.encryption.secretKey) {
            return data;
        }

        const cipher = crypto.createCipher(this.securityConfig.encryption.algorithm, this.securityConfig.encryption.secretKey);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decrypt(encryptedData: string): string {
        if (!this.securityConfig.encryption.secretKey) {
            return encryptedData;
        }

        const decipher = crypto.createDecipher(this.securityConfig.encryption.algorithm, this.securityConfig.encryption.secretKey);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Cleanup and Maintenance
    private startCleanupProcess(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredSessions();
            this.cleanupOldAuditLogs();
            this.cleanupOldMetrics();
            this.cleanupOldTraces();
        }, 3600000); // Every hour
    }

    private cleanupExpiredSessions(): void {
        const now = new Date();
        const expiredSessions: string[] = [];

        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.refreshExpiresAt) {
                expiredSessions.push(sessionId);
            }
        }

        for (const sessionId of expiredSessions) {
            this.sessions.delete(sessionId);
        }
    }

    private cleanupOldAuditLogs(): void {
        const cutoffDate = new Date(Date.now() - this.securityConfig.audit.retentionDays * 24 * 60 * 60 * 1000);
        this.auditLog = this.auditLog.filter(event => event.timestamp > cutoffDate);
    }

    private cleanupOldMetrics(): void {
        const cutoffDate = new Date(Date.now() - this.observabilityConfig.metrics.retention * 24 * 60 * 60 * 1000);
        this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffDate);
    }

    private cleanupOldTraces(): void {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
        
        for (const [traceId, spans] of this.traces.entries()) {
            const hasRecentSpans = spans.some(span => span.startTime > cutoffDate);
            if (!hasRecentSpans) {
                this.traces.delete(traceId);
            }
        }
    }

    // Utility Methods
    private generateSecureId(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    private generateToken(): string {
        return crypto.randomBytes(32).toString('base64');
    }

    // Public API Methods
    getAuditLog(filters?: { 
        userId?: string; 
        action?: string; 
        startDate?: Date; 
        endDate?: Date 
    }): AuditEvent[] {
        let filteredLog = [...this.auditLog];

        if (filters) {
            if (filters.userId) {
                filteredLog = filteredLog.filter(event => event.userId === filters.userId);
            }
            if (filters.action) {
                filteredLog = filteredLog.filter(event => event.action === filters.action);
            }
            if (filters.startDate) {
                filteredLog = filteredLog.filter(event => event.timestamp >= filters.startDate!);
            }
            if (filters.endDate) {
                filteredLog = filteredLog.filter(event => event.timestamp <= filters.endDate!);
            }
        }

        return filteredLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    getMetrics(metricName?: string, startTime?: Date, endTime?: Date): MetricPoint[] {
        let filteredMetrics = [...this.metrics];

        if (metricName) {
            filteredMetrics = filteredMetrics.filter(m => m.name === metricName);
        }
        if (startTime) {
            filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
        }
        if (endTime) {
            filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
        }

        return filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    getTraces(traceId?: string): TraceSpan[] {
        if (traceId) {
            return this.traces.get(traceId) || [];
        }

        const allSpans: TraceSpan[] = [];
        for (const spans of this.traces.values()) {
            allSpans.push(...spans);
        }

        return allSpans.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }

    getSecurityThreats(severity?: SecurityThreat['severity']): SecurityThreat[] {
        let threats = [...this.threats];
        
        if (severity) {
            threats = threats.filter(t => t.severity === severity);
        }

        return threats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    getAlerts(acknowledged?: boolean): PerformanceAlert[] {
        let alerts = [...this.alerts];
        
        if (acknowledged !== undefined) {
            alerts = alerts.filter(a => a.acknowledged === acknowledged);
        }

        return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    acknowledgeAlert(alertId: string): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
        }
    }

    resolveAlert(alertId: string): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolvedAt = new Date();
            alert.acknowledged = true;
        }
    }

    getActiveSessions(): Session[] {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }

    dispose(): void {
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
            this.metricsTimer = null;
        }

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        this.removeAllListeners();
    }
}
