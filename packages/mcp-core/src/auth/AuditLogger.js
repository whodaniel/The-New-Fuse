/**
 * Audit Logger for MCP security events
 *
 * Provides comprehensive audit logging for security events, access attempts,
 * and system activities with configurable storage backends and retention policies.
 */
import { EventEmitter } from 'events';
import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
/**
 * Audit event severity levels
 */
export var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "low";
    AuditSeverity["MEDIUM"] = "medium";
    AuditSeverity["HIGH"] = "high";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity || (AuditSeverity = {}));
/**
 * Audit event categories
 */
export var AuditCategory;
(function (AuditCategory) {
    AuditCategory["AUTHENTICATION"] = "authentication";
    AuditCategory["AUTHORIZATION"] = "authorization";
    AuditCategory["RESOURCE_ACCESS"] = "resource_access";
    AuditCategory["TOOL_EXECUTION"] = "tool_execution";
    AuditCategory["SYSTEM_ADMIN"] = "system_admin";
    AuditCategory["SECURITY_VIOLATION"] = "security_violation";
    AuditCategory["CONFIGURATION"] = "configuration";
    AuditCategory["DATA_ACCESS"] = "data_access";
})(AuditCategory || (AuditCategory = {}));
/**
 * File-based audit storage backend
 */
export class FileAuditStorage {
    logDirectory;
    events = [];
    constructor(logDirectory = './logs/audit') {
        this.logDirectory = logDirectory;
        // Don't await here since constructor can't be async
        this.ensureLogDirectory().catch(console.error);
    }
    async store(event) {
        this.events.push(event);
        try {
            await this.ensureLogDirectory();
            const logFile = join(this.logDirectory, `audit-${this.getDateString()}.jsonl`);
            const logLine = JSON.stringify(event) + '\n';
            await appendFile(logFile, logLine, 'utf8');
        }
        catch (error) {
            console.error('Failed to store audit event to file:', error);
            // Event is still stored in memory for querying
        }
    }
    async query(filter) {
        let filteredEvents = [...this.events];
        if (filter.startDate) {
            filteredEvents = filteredEvents.filter(e => e.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            filteredEvents = filteredEvents.filter(e => e.timestamp <= filter.endDate);
        }
        if (filter.userId) {
            filteredEvents = filteredEvents.filter(e => e.userId === filter.userId);
        }
        if (filter.type) {
            filteredEvents = filteredEvents.filter(e => e.type === filter.type);
        }
        if (filter.category) {
            filteredEvents = filteredEvents.filter(e => e.category === filter.category);
        }
        if (filter.severity) {
            filteredEvents = filteredEvents.filter(e => e.severity === filter.severity);
        }
        if (filter.success !== undefined) {
            filteredEvents = filteredEvents.filter(e => e.success === filter.success);
        }
        if (filter.resource) {
            filteredEvents = filteredEvents.filter(e => e.resource && e.resource.includes(filter.resource));
        }
        if (filter.operation) {
            filteredEvents = filteredEvents.filter(e => e.operation === filter.operation);
        }
        if (filter.source) {
            filteredEvents = filteredEvents.filter(e => e.source === filter.source);
        }
        if (filter.minRiskScore) {
            filteredEvents = filteredEvents.filter(e => e.riskScore && e.riskScore >= filter.minRiskScore);
        }
        if (filter.tags && filter.tags.length > 0) {
            filteredEvents = filteredEvents.filter(e => e.tags && filter.tags.some(tag => e.tags.includes(tag)));
        }
        // Sort by timestamp (newest first)
        filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // Apply pagination
        const offset = filter.offset || 0;
        const limit = filter.limit || filteredEvents.length;
        return filteredEvents.slice(offset, offset + limit);
    }
    async cleanup(retentionDays) {
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const initialCount = this.events.length;
        this.events = this.events.filter(e => e.timestamp >= cutoffDate);
        return initialCount - this.events.length;
    }
    async getStats() {
        const eventsByCategory = {
            [AuditCategory.AUTHENTICATION]: 0,
            [AuditCategory.AUTHORIZATION]: 0,
            [AuditCategory.RESOURCE_ACCESS]: 0,
            [AuditCategory.TOOL_EXECUTION]: 0,
            [AuditCategory.SYSTEM_ADMIN]: 0,
            [AuditCategory.SECURITY_VIOLATION]: 0,
            [AuditCategory.CONFIGURATION]: 0,
            [AuditCategory.DATA_ACCESS]: 0
        };
        const eventsBySeverity = {
            [AuditSeverity.LOW]: 0,
            [AuditSeverity.MEDIUM]: 0,
            [AuditSeverity.HIGH]: 0,
            [AuditSeverity.CRITICAL]: 0
        };
        let oldestEvent;
        let newestEvent;
        for (const event of this.events) {
            eventsByCategory[event.category]++;
            eventsBySeverity[event.severity]++;
            if (!oldestEvent || event.timestamp < oldestEvent) {
                oldestEvent = event.timestamp;
            }
            if (!newestEvent || event.timestamp > newestEvent) {
                newestEvent = event.timestamp;
            }
        }
        return {
            totalEvents: this.events.length,
            eventsByCategory,
            eventsBySeverity,
            storageSize: JSON.stringify(this.events).length,
            oldestEvent,
            newestEvent
        };
    }
    async ensureLogDirectory() {
        try {
            if (!existsSync(this.logDirectory)) {
                await mkdir(this.logDirectory, { recursive: true });
            }
        }
        catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
}
/**
 * Audit Logger class
 */
export class AuditLogger extends EventEmitter {
    config;
    eventBuffer = [];
    flushTimer;
    eventIdCounter = 0;
    constructor(config = {}) {
        super();
        this.config = {
            enabled: true,
            storageBackend: new FileAuditStorage(),
            retentionDays: 90,
            enableAlerting: true,
            alertThresholds: {
                failedLoginAttempts: 5,
                highRiskEvents: 10,
                suspiciousActivity: 3
            },
            enableEnrichment: true,
            batchSize: 100,
            flushInterval: 5000, // 5 seconds
            ...config
        };
        if (this.config.enabled) {
            this.startFlushTimer();
        }
    }
    /**
     * Log authentication event
     */
    async logAuthentication(userId, success, method, clientIp, userAgent, error) {
        const event = this.createAuditEvent({
            type: success ? 'login' : 'access_denied',
            userId,
            success,
            error,
            clientIp,
            userAgent,
            category: AuditCategory.AUTHENTICATION,
            severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
            source: 'mcp-auth',
            metadata: { method }
        });
        await this.logEvent(event);
    }
    /**
     * Log authorization event
     */
    async logAuthorization(userId, resource, operation, success, reason, mcpOperation) {
        const event = this.createAuditEvent({
            type: success ? 'access_granted' : 'access_denied',
            userId,
            resource,
            operation,
            success,
            error: success ? undefined : reason,
            category: AuditCategory.AUTHORIZATION,
            severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
            source: 'mcp-rbac',
            mcpOperation
        });
        await this.logEvent(event);
    }
    /**
     * Log resource access event
     */
    async logResourceAccess(userId, resource, operation, success, duration, requestSize, responseSize) {
        const event = this.createAuditEvent({
            type: 'resource_access',
            userId,
            resource,
            operation,
            success,
            category: AuditCategory.RESOURCE_ACCESS,
            severity: AuditSeverity.LOW,
            source: 'mcp-server',
            duration,
            requestSize,
            responseSize
        });
        await this.logEvent(event);
    }
    /**
     * Log tool execution event
     */
    async logToolExecution(userId, toolName, success, duration, parameters, result, error) {
        const event = this.createAuditEvent({
            type: 'tool_execution',
            userId,
            resource: `tool:${toolName}`,
            operation: 'execute',
            success,
            error,
            category: AuditCategory.TOOL_EXECUTION,
            severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
            source: 'mcp-tool-engine',
            duration,
            metadata: {
                toolName,
                parameters: parameters ? Object.keys(parameters) : undefined,
                resultType: result ? typeof result : undefined
            }
        });
        await this.logEvent(event);
    }
    /**
     * Log security violation
     */
    async logSecurityViolation(userId, violationType, description, severity = AuditSeverity.HIGH, resource, clientIp, metadata) {
        const event = this.createAuditEvent({
            type: 'security_violation',
            userId,
            resource,
            success: false,
            error: description,
            clientIp,
            category: AuditCategory.SECURITY_VIOLATION,
            severity,
            source: 'mcp-security',
            riskScore: this.calculateRiskScore(severity, violationType),
            tags: ['security', 'violation', violationType],
            metadata: {
                violationType,
                ...metadata
            }
        });
        await this.logEvent(event);
        // Trigger immediate alert for security violations
        if (this.config.enableAlerting) {
            this.emit('securityAlert', event);
        }
    }
    /**
     * Log system administration event
     */
    async logSystemAdmin(userId, operation, target, success, changes, error) {
        const event = this.createAuditEvent({
            type: 'system_admin',
            userId,
            operation,
            target,
            success,
            error,
            category: AuditCategory.SYSTEM_ADMIN,
            severity: AuditSeverity.MEDIUM,
            source: 'mcp-admin',
            metadata: { changes }
        });
        await this.logEvent(event);
    }
    /**
     * Query audit events
     */
    async queryEvents(filter) {
        return this.config.storageBackend.query(filter);
    }
    /**
     * Get audit statistics
     */
    async getAuditStats() {
        return this.config.storageBackend.getStats();
    }
    /**
     * Clean up old audit events
     */
    async cleanup() {
        return this.config.storageBackend.cleanup(this.config.retentionDays);
    }
    /**
     * Flush buffered events to storage
     */
    async flush() {
        if (this.eventBuffer.length === 0)
            return;
        const eventsToFlush = [...this.eventBuffer];
        this.eventBuffer = [];
        for (const event of eventsToFlush) {
            try {
                await this.config.storageBackend.store(event);
            }
            catch (error) {
                console.error('Failed to store audit event:', error);
                // Re-add to buffer for retry
                this.eventBuffer.push(event);
            }
        }
    }
    /**
     * Create audit event with common fields
     */
    createAuditEvent(eventData) {
        const event = {
            id: this.generateEventId(),
            timestamp: new Date(),
            severity: AuditSeverity.LOW,
            category: AuditCategory.AUTHENTICATION,
            source: 'mcp-system',
            ...eventData
        };
        if (this.config.enableEnrichment) {
            this.enrichEvent(event);
        }
        return event;
    }
    /**
     * Log audit event
     */
    async logEvent(event) {
        if (!this.config.enabled)
            return;
        this.eventBuffer.push(event);
        this.emit('auditEvent', event);
        // Check for immediate flush conditions
        if (this.eventBuffer.length >= this.config.batchSize) {
            await this.flush();
        }
        // Check for alerting conditions
        if (this.config.enableAlerting) {
            this.checkAlertConditions(event);
        }
    }
    /**
     * Enrich event with additional context
     */
    enrichEvent(event) {
        // Add risk score if not already set
        if (event.riskScore === undefined) {
            event.riskScore = this.calculateRiskScore(event.severity, event.type);
        }
        // Add session ID if available (would come from request context)
        // event.sessionId = getCurrentSessionId();
        // Add request ID if available (would come from request context)
        // event.requestId = getCurrentRequestId();
        // Parse user agent for device information
        if (event.userAgent && !event.device) {
            event.device = this.parseUserAgent(event.userAgent);
        }
        // Add geographic location based on IP (would integrate with GeoIP service)
        if (event.clientIp && !event.location) {
            // event.location = await this.getLocationFromIP(event.clientIp);
        }
    }
    /**
     * Calculate risk score for event
     */
    calculateRiskScore(severity, eventType) {
        const baseScores = {
            [AuditSeverity.LOW]: 10,
            [AuditSeverity.MEDIUM]: 40,
            [AuditSeverity.HIGH]: 70,
            [AuditSeverity.CRITICAL]: 90
        };
        let score = baseScores[severity];
        // Adjust score based on event type
        const typeModifiers = {
            'access_denied': 20,
            'security_violation': 30,
            'login_failure': 15,
            'privilege_escalation': 40,
            'data_breach': 50
        };
        const modifier = typeModifiers[eventType] || 0;
        score = Math.min(100, score + modifier);
        return score;
    }
    /**
     * Parse user agent string
     */
    parseUserAgent(userAgent) {
        // Simple user agent parsing (in production, use a proper library)
        const device = {};
        if (userAgent.includes('Mobile')) {
            device.type = 'mobile';
        }
        else if (userAgent.includes('Tablet')) {
            device.type = 'tablet';
        }
        else {
            device.type = 'desktop';
        }
        if (userAgent.includes('Windows')) {
            device.os = 'Windows';
        }
        else if (userAgent.includes('Mac')) {
            device.os = 'macOS';
        }
        else if (userAgent.includes('Linux')) {
            device.os = 'Linux';
        }
        if (userAgent.includes('Chrome')) {
            device.browser = 'Chrome';
        }
        else if (userAgent.includes('Firefox')) {
            device.browser = 'Firefox';
        }
        else if (userAgent.includes('Safari')) {
            device.browser = 'Safari';
        }
        return device;
    }
    /**
     * Check alert conditions
     */
    checkAlertConditions(event) {
        // Check for high-risk events
        if (event.riskScore && event.riskScore >= 70) {
            this.emit('highRiskEvent', event);
        }
        // Check for failed login attempts
        if (event.type === 'access_denied' && event.category === AuditCategory.AUTHENTICATION) {
            this.emit('failedLogin', event);
        }
        // Check for security violations
        if (event.category === AuditCategory.SECURITY_VIOLATION) {
            this.emit('securityViolation', event);
        }
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `audit_${Date.now()}_${++this.eventIdCounter}`;
    }
    /**
     * Start flush timer
     */
    startFlushTimer() {
        this.flushTimer = setInterval(async () => {
            await this.flush();
        }, this.config.flushInterval);
    }
    /**
     * Stop flush timer
     */
    stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
    }
    /**
     * Cleanup resources
     */
    async destroy() {
        this.stopFlushTimer();
        await this.flush();
    }
}
//# sourceMappingURL=AuditLogger.js.map