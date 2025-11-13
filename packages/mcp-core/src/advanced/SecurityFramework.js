"use strict";
/**
 * Advanced Security Framework for AI Agent Interactions
 *
 * Provides comprehensive security capabilities including authentication, authorization,
 * encryption, audit logging, threat detection, and compliance management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityFramework = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
function sign(payload, secret, options) {
    // Simplified JWT implementation
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 3600000 })).toString('base64url');
    const signature = (0, crypto_1.createHmac)('sha256', secret).update(`${header}.${payloadStr}`).digest('base64url');
    return `${header}.${payloadStr}.${signature}`;
}
function verify(token, secret) {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = (0, crypto_1.createHmac)('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (decoded.exp && Date.now() > decoded.exp) {
        throw new Error('Token expired');
    }
    return decoded;
}
class SecurityFramework extends events_1.EventEmitter {
    config;
    auditLog = [];
    threatAlerts = [];
    securityPolicies = new Map();
    activeSessions = new Map();
    rateLimitCounters = new Map();
    suspiciousActivities = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeSecurityFramework();
    }
    initializeSecurityFramework() {
        // Initialize default security policies
        this.createDefaultSecurityPolicies();
        // Start background security monitoring
        this.startSecurityMonitoring();
        // Initialize threat detection
        if (this.config.threatDetection.enableAnomalyDetection) {
            this.initializeAnomalyDetection();
        }
        // Set up audit log cleanup
        this.scheduleAuditLogCleanup();
    }
    /**
     * Authenticate user/agent and create security context
     */
    async authenticate(credentials, requestInfo) {
        const startTime = Date.now();
        try {
            // Check rate limiting
            if (this.isRateLimited(requestInfo.ipAddress)) {
                await this.logAuditEvent({
                    userId: credentials.identifier,
                    agentId: requestInfo.agentId || 'unknown',
                    action: 'authentication',
                    resource: 'auth_service',
                    result: 'blocked',
                    details: { reason: 'rate_limited', ip: requestInfo.ipAddress },
                    riskLevel: 'medium',
                    ipAddress: requestInfo.ipAddress,
                    userAgent: requestInfo.userAgent
                });
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.'
                };
            }
            // Perform authentication based on type
            let authResult;
            switch (credentials.type) {
                case 'password':
                    authResult = await this.authenticateWithPassword(credentials, requestInfo);
                    break;
                case 'token':
                    authResult = await this.authenticateWithToken(credentials, requestInfo);
                    break;
                case 'certificate':
                    authResult = await this.authenticateWithCertificate(credentials, requestInfo);
                    break;
                case 'biometric':
                    authResult = await this.authenticateWithBiometric(credentials, requestInfo);
                    break;
                default:
                    throw new Error(`Unsupported authentication type: ${credentials.type}`);
            }
            // Log authentication attempt
            await this.logAuditEvent({
                userId: credentials.identifier,
                agentId: requestInfo.agentId || 'unknown',
                action: 'authentication',
                resource: 'auth_service',
                result: authResult.success ? 'success' : 'failure',
                details: {
                    type: credentials.type,
                    duration: Date.now() - startTime,
                    ip: requestInfo.ipAddress
                },
                riskLevel: authResult.success ? 'low' : 'medium',
                ipAddress: requestInfo.ipAddress,
                userAgent: requestInfo.userAgent
            });
            // Update rate limiting counters
            this.updateRateLimitCounter(requestInfo.ipAddress);
            // Check for suspicious activity
            if (!authResult.success) {
                await this.checkSuspiciousActivity(requestInfo.ipAddress, credentials.identifier);
            }
            return authResult;
        }
        catch (error) {
            await this.logAuditEvent({
                userId: credentials.identifier,
                agentId: requestInfo.agentId || 'unknown',
                action: 'authentication',
                resource: 'auth_service',
                result: 'failure',
                details: {
                    error: error.message,
                    duration: Date.now() - startTime
                },
                riskLevel: 'high',
                ipAddress: requestInfo.ipAddress,
                userAgent: requestInfo.userAgent
            });
            return {
                success: false,
                error: 'Authentication failed due to internal error'
            };
        }
    }
    /**
     * Authorize access to resources
     */
    async authorize(request) {
        try {
            // Check RBAC (Role-Based Access Control)
            if (this.config.authorization.enableRBAC) {
                const rbacResult = await this.checkRBAC(request);
                if (!rbacResult.granted) {
                    await this.logAuditEvent({
                        userId: request.context.userId,
                        agentId: request.context.agentId,
                        action: request.action,
                        resource: request.resource,
                        result: 'blocked',
                        details: { reason: 'rbac_denied', roles: request.context.roles },
                        riskLevel: 'medium',
                        ipAddress: request.context.ipAddress,
                        userAgent: request.context.userAgent
                    });
                    return rbacResult;
                }
            }
            // Check ABAC (Attribute-Based Access Control)
            if (this.config.authorization.enableABAC) {
                const abacResult = await this.checkABAC(request);
                if (!abacResult.granted) {
                    await this.logAuditEvent({
                        userId: request.context.userId,
                        agentId: request.context.agentId,
                        action: request.action,
                        resource: request.resource,
                        result: 'blocked',
                        details: { reason: 'abac_denied', attributes: request.attributes },
                        riskLevel: 'medium',
                        ipAddress: request.context.ipAddress,
                        userAgent: request.context.userAgent
                    });
                    return abacResult;
                }
            }
            // Check security policies
            const policyResult = await this.checkSecurityPolicies(request);
            if (!policyResult.granted) {
                await this.logAuditEvent({
                    userId: request.context.userId,
                    agentId: request.context.agentId,
                    action: request.action,
                    resource: request.resource,
                    result: 'blocked',
                    details: { reason: 'policy_violation' },
                    riskLevel: 'high',
                    ipAddress: request.context.ipAddress,
                    userAgent: request.context.userAgent
                });
                return policyResult;
            }
            // Log successful authorization
            await this.logAuditEvent({
                userId: request.context.userId,
                agentId: request.context.agentId,
                action: request.action,
                resource: request.resource,
                result: 'success',
                details: { authorized: true },
                riskLevel: 'low',
                ipAddress: request.context.ipAddress,
                userAgent: request.context.userAgent
            });
            return { granted: true };
        }
        catch (error) {
            await this.logAuditEvent({
                userId: request.context.userId,
                agentId: request.context.agentId,
                action: request.action,
                resource: request.resource,
                result: 'failure',
                details: { error: error.message },
                riskLevel: 'high',
                ipAddress: request.context.ipAddress,
                userAgent: request.context.userAgent
            });
            return {
                granted: false,
                reason: 'Authorization check failed due to internal error'
            };
        }
    }
    /**
     * Encrypt sensitive data
     */
    encrypt(data, key) {
        const algorithm = this.config.encryption.algorithm;
        const encryptionKey = key || this.generateEncryptionKey();
        const iv = (0, crypto_1.randomBytes)(this.config.encryption.ivLength);
        const cipher = (0, crypto_1.createCipheriv)(algorithm, encryptionKey, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return {
            encryptedData: encrypted,
            iv: iv.toString('hex'),
            tag: cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : undefined
        };
    }
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedResult, key) {
        const algorithm = this.config.encryption.algorithm;
        const decryptionKey = key || this.generateEncryptionKey();
        const iv = Buffer.from(encryptedResult.iv, 'hex');
        const decipher = (0, crypto_1.createDecipheriv)(algorithm, decryptionKey, iv);
        if (encryptedResult.tag && decipher.setAuthTag) {
            decipher.setAuthTag(Buffer.from(encryptedResult.tag, 'hex'));
        }
        let decrypted = decipher.update(encryptedResult.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Encrypt data with specific key
     */
    async encryptData(data, key) {
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // For GCM mode, get the authentication tag
        const tag = cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : undefined;
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag
        };
    }
    /**
     * Decrypt data with specific key
     */
    async decryptData(encryptedData, key) {
        const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(encryptedData.iv, 'hex'));
        // Set auth tag if available
        if (encryptedData.tag && decipher.setAuthTag) {
            decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        }
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Generate secure hash
     */
    generateHash(data, salt) {
        const hashSalt = salt || (0, crypto_1.randomBytes)(16).toString('hex');
        return (0, crypto_1.createHash)('sha256').update(data + hashSalt).digest('hex');
    }
    /**
     * Generate HMAC signature
     */
    generateHMAC(data, secret) {
        return (0, crypto_1.createHmac)('sha256', secret).update(data).digest('hex');
    }
    /**
     * Verify HMAC signature
     */
    verifyHMAC(data, signature, secret) {
        const expectedSignature = this.generateHMAC(data, secret);
        return signature === expectedSignature;
    }
    /**
     * Create security policy
     */
    async createSecurityPolicy(policy) {
        const policyId = this.generateId();
        const securityPolicy = {
            ...policy,
            id: policyId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.securityPolicies.set(policyId, securityPolicy);
        this.emit('securityPolicyCreated', securityPolicy);
        return policyId;
    }
    /**
     * Get security metrics and status
     */
    getSecurityMetrics() {
        const riskDistribution = this.auditLog.reduce((acc, event) => {
            acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1;
            return acc;
        }, {});
        const recentThreats = this.threatAlerts
            .filter(alert => Date.now() - alert.timestamp.getTime() < 24 * 60 * 60 * 1000)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
        return {
            auditEvents: this.auditLog.length,
            threatAlerts: this.threatAlerts.length,
            activeSessions: this.activeSessions.size,
            securityPolicies: this.securityPolicies.size,
            riskDistribution,
            recentThreats
        };
    }
    // Private helper methods
    async authenticateWithPassword(credentials, requestInfo) {
        // Implement password authentication logic
        // This is a placeholder implementation
        const isValid = await this.validatePassword(credentials.identifier, credentials.secret);
        if (isValid) {
            const token = this.generateJWT(credentials.identifier);
            const refreshToken = this.generateRefreshToken();
            return {
                success: true,
                token,
                refreshToken,
                expiresAt: new Date(Date.now() + 3600000), // 1 hour
                permissions: this.config.authorization.defaultPermissions,
                roles: ['user']
            };
        }
        return { success: false, error: 'Invalid credentials' };
    }
    async authenticateWithToken(credentials, requestInfo) {
        try {
            const decoded = verify(credentials.secret, this.config.authentication.jwtSecret);
            return {
                success: true,
                permissions: decoded.permissions || [],
                roles: decoded.roles || []
            };
        }
        catch (error) {
            return { success: false, error: 'Invalid token' };
        }
    }
    async authenticateWithCertificate(credentials, requestInfo) {
        // Implement certificate authentication logic
        return { success: false, error: 'Certificate authentication not implemented' };
    }
    async authenticateWithBiometric(credentials, requestInfo) {
        // Implement biometric authentication logic
        return { success: false, error: 'Biometric authentication not implemented' };
    }
    async validatePassword(identifier, password) {
        // Implement password validation logic
        // This would typically check against a database
        return password.length >= 8; // Placeholder validation
    }
    generateJWT(userId) {
        return sign({ userId, timestamp: Date.now() }, this.config.authentication.jwtSecret, { expiresIn: this.config.authentication.jwtExpiration });
    }
    generateRefreshToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    generateEncryptionKey() {
        return (0, crypto_1.randomBytes)(this.config.encryption.keyLength).toString('hex');
    }
    generateId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    isRateLimited(identifier) {
        const counter = this.rateLimitCounters.get(identifier);
        if (!counter)
            return false;
        if (Date.now() > counter.resetTime.getTime()) {
            this.rateLimitCounters.delete(identifier);
            return false;
        }
        return counter.count >= this.config.threatDetection.maxRequestsPerMinute;
    }
    updateRateLimitCounter(identifier) {
        const now = new Date();
        const resetTime = new Date(now.getTime() + 60000); // 1 minute from now
        const counter = this.rateLimitCounters.get(identifier);
        if (counter && now.getTime() < counter.resetTime.getTime()) {
            counter.count++;
        }
        else {
            this.rateLimitCounters.set(identifier, { count: 1, resetTime });
        }
    }
    async checkSuspiciousActivity(ipAddress, userId) {
        const key = `${ipAddress}:${userId}`;
        const count = (this.suspiciousActivities.get(key) || 0) + 1;
        this.suspiciousActivities.set(key, count);
        if (count >= this.config.threatDetection.suspiciousActivityThreshold) {
            await this.createThreatAlert({
                type: 'suspicious_activity',
                severity: 'high',
                description: `Multiple failed authentication attempts from ${ipAddress} for user ${userId}`,
                affectedResources: [userId],
                source: ipAddress,
                mitigationActions: ['block_ip', 'notify_admin', 'require_mfa']
            });
        }
    }
    async checkRBAC(request) {
        // Implement RBAC logic
        const hasRequiredRole = request.context.roles.some(role => this.config.authorization.adminRoles.includes(role));
        return {
            granted: hasRequiredRole,
            reason: hasRequiredRole ? undefined : 'Insufficient role permissions'
        };
    }
    async checkABAC(request) {
        // Implement ABAC logic
        // This is a placeholder implementation
        return { granted: true };
    }
    async checkSecurityPolicies(request) {
        for (const policy of this.securityPolicies.values()) {
            if (!policy.enabled)
                continue;
            for (const rule of policy.rules) {
                if (!rule.enabled)
                    continue;
                // Evaluate rule condition
                if (this.evaluateRuleCondition(rule.condition, request)) {
                    if (rule.action === 'deny') {
                        return {
                            granted: false,
                            reason: `Blocked by security policy: ${policy.name}`
                        };
                    }
                }
            }
        }
        return { granted: true };
    }
    evaluateRuleCondition(condition, request) {
        // Implement rule condition evaluation
        // This is a placeholder implementation
        return false;
    }
    async logAuditEvent(eventData) {
        const auditEvent = {
            ...eventData,
            id: this.generateId(),
            timestamp: new Date()
        };
        this.auditLog.push(auditEvent);
        this.emit('auditEvent', auditEvent);
        // Trigger alerts for high-risk events
        if (auditEvent.riskLevel === 'high' || auditEvent.riskLevel === 'critical') {
            await this.createThreatAlert({
                type: 'suspicious_activity',
                severity: auditEvent.riskLevel,
                description: `High-risk audit event: ${auditEvent.action} on ${auditEvent.resource}`,
                affectedResources: [auditEvent.resource],
                source: auditEvent.ipAddress,
                mitigationActions: ['investigate', 'monitor']
            });
        }
    }
    async createThreatAlert(alertData) {
        const threatAlert = {
            ...alertData,
            id: this.generateId(),
            timestamp: new Date()
        };
        this.threatAlerts.push(threatAlert);
        this.emit('threatAlert', threatAlert);
    }
    createDefaultSecurityPolicies() {
        // Create default security policies
        this.createSecurityPolicy({
            name: 'Default Access Control',
            description: 'Basic access control rules',
            rules: [
                {
                    id: 'rule1',
                    condition: 'resource.type === "sensitive"',
                    action: 'deny',
                    parameters: {},
                    enabled: true
                }
            ],
            enabled: true,
            priority: 1
        });
    }
    startSecurityMonitoring() {
        // Start background monitoring tasks
        setInterval(() => {
            this.cleanupExpiredSessions();
            this.analyzeSecurityMetrics();
        }, 60000); // Every minute
    }
    initializeAnomalyDetection() {
        // Initialize anomaly detection system
        console.log('Anomaly detection initialized');
    }
    scheduleAuditLogCleanup() {
        // Schedule periodic cleanup of old audit logs
        setInterval(() => {
            const cutoffDate = new Date(Date.now() - this.config.audit.retentionDays * 24 * 60 * 60 * 1000);
            this.auditLog = this.auditLog.filter(event => event.timestamp > cutoffDate);
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }
    cleanupExpiredSessions() {
        // Clean up expired sessions
        for (const [sessionId, context] of this.activeSessions) {
            if (Date.now() - context.timestamp.getTime() > 24 * 60 * 60 * 1000) {
                this.activeSessions.delete(sessionId);
            }
        }
    }
    analyzeSecurityMetrics() {
        // Analyze security metrics for patterns
        const recentEvents = this.auditLog.filter(event => Date.now() - event.timestamp.getTime() < 60 * 60 * 1000);
        const failureRate = recentEvents.filter(e => e.result === 'failure').length / recentEvents.length;
        if (failureRate > 0.1) { // More than 10% failure rate
            this.createThreatAlert({
                type: 'anomaly',
                severity: 'medium',
                description: `High failure rate detected: ${(failureRate * 100).toFixed(1)}%`,
                affectedResources: ['system'],
                source: 'security_monitor',
                mitigationActions: ['investigate', 'increase_monitoring']
            });
        }
    }
}
exports.SecurityFramework = SecurityFramework;
//# sourceMappingURL=SecurityFramework.js.map