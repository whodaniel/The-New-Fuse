/**
 * Audit Logger for MCP security events
 *
 * Provides comprehensive audit logging for security events, access attempts,
 * and system activities with configurable storage backends and retention policies.
 */

import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { AuthAuditEvent } from './AuthenticationManager.js';
import { MCPOperation } from './PermissionValidator.js';

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Audit event categories
 */
export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RESOURCE_ACCESS = 'resource_access',
  TOOL_EXECUTION = 'tool_execution',
  SYSTEM_ADMIN = 'system_admin',
  SECURITY_VIOLATION = 'security_violation',
  CONFIGURATION = 'configuration',
  DATA_ACCESS = 'data_access',
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
export class FileAuditStorage implements AuditStorageBackend {
  private logDirectory: string;
  private events: EnhancedAuditEvent[] = [];

  constructor(logDirectory: string = './logs/audit') {
    this.logDirectory = logDirectory;
    // Don't await here since constructor can't be async
    this.ensureLogDirectory().catch(console.error);
  }

  async store(event: EnhancedAuditEvent): Promise<void> {
    this.events.push(event);

    try {
      await this.ensureLogDirectory();
      const logFile = join(this.logDirectory, `audit-${this.getDateString()}.jsonl`);
      const logLine = JSON.stringify(event) + '\n';

      await appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to store audit event to file:', error);
      // Event is still stored in memory for querying
    }
  }

  async query(filter: AuditQueryFilter): Promise<EnhancedAuditEvent[]> {
    let filteredEvents = [...this.events];

    if (filter.startDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp <= filter.endDate!);
    }

    if (filter.userId) {
      filteredEvents = filteredEvents.filter((e) => e.userId === filter.userId);
    }

    if (filter.type) {
      filteredEvents = filteredEvents.filter((e) => e.type === filter.type);
    }

    if (filter.category) {
      filteredEvents = filteredEvents.filter((e) => e.category === filter.category);
    }

    if (filter.severity) {
      filteredEvents = filteredEvents.filter((e) => e.severity === filter.severity);
    }

    if (filter.success !== undefined) {
      filteredEvents = filteredEvents.filter((e) => e.success === filter.success);
    }

    if (filter.resource) {
      filteredEvents = filteredEvents.filter(
        (e) => e.resource && e.resource.includes(filter.resource!)
      );
    }

    if (filter.operation) {
      filteredEvents = filteredEvents.filter((e) => e.operation === filter.operation);
    }

    if (filter.source) {
      filteredEvents = filteredEvents.filter((e) => e.source === filter.source);
    }

    if (filter.minRiskScore) {
      filteredEvents = filteredEvents.filter(
        (e) => e.riskScore && e.riskScore >= filter.minRiskScore!
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredEvents = filteredEvents.filter(
        (e) => e.tags && filter.tags!.some((tag) => e.tags!.includes(tag))
      );
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || filteredEvents.length;

    return filteredEvents.slice(offset, offset + limit);
  }

  async cleanup(retentionDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;

    this.events = this.events.filter((e) => e.timestamp >= cutoffDate);

    return initialCount - this.events.length;
  }

  async getStats(): Promise<AuditStorageStats> {
    const eventsByCategory: Record<AuditCategory, number> = {
      [AuditCategory.AUTHENTICATION]: 0,
      [AuditCategory.AUTHORIZATION]: 0,
      [AuditCategory.RESOURCE_ACCESS]: 0,
      [AuditCategory.TOOL_EXECUTION]: 0,
      [AuditCategory.SYSTEM_ADMIN]: 0,
      [AuditCategory.SECURITY_VIOLATION]: 0,
      [AuditCategory.CONFIGURATION]: 0,
      [AuditCategory.DATA_ACCESS]: 0,
    };

    const eventsBySeverity: Record<AuditSeverity, number> = {
      [AuditSeverity.LOW]: 0,
      [AuditSeverity.MEDIUM]: 0,
      [AuditSeverity.HIGH]: 0,
      [AuditSeverity.CRITICAL]: 0,
    };

    let oldestEvent: Date | undefined;
    let newestEvent: Date | undefined;

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
      newestEvent,
    };
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      if (!existsSync(this.logDirectory)) {
        await mkdir(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Audit Logger class
 */
export class AuditLogger extends EventEmitter {
  private config: AuditLoggerConfig;
  private eventBuffer: EnhancedAuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private eventIdCounter = 0;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      storageBackend: new FileAuditStorage(),
      retentionDays: 90,
      enableAlerting: true,
      alertThresholds: {
        failedLoginAttempts: 5,
        highRiskEvents: 10,
        suspiciousActivity: 3,
      },
      enableEnrichment: true,
      batchSize: 100,
      flushInterval: 5000, // 5 seconds
      ...config,
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    success: boolean,
    method: string,
    clientIp?: string,
    userAgent?: string,
    error?: string
  ): Promise<void> {
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
      metadata: { method },
    });

    await this.logEvent(event);
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    userId: string,
    resource: string,
    operation: string,
    success: boolean,
    reason?: string,
    mcpOperation?: MCPOperation
  ): Promise<void> {
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
      mcpOperation,
    });

    await this.logEvent(event);
  }

  /**
   * Log resource access event
   */
  async logResourceAccess(
    userId: string,
    resource: string,
    operation: string,
    success: boolean,
    duration?: number,
    requestSize?: number,
    responseSize?: number
  ): Promise<void> {
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
      responseSize,
    });

    await this.logEvent(event);
  }

  /**
   * Log tool execution event
   */
  async logToolExecution(
    userId: string,
    toolName: string,
    success: boolean,
    duration?: number,
    parameters?: Record<string, any>,
    result?: any,
    error?: string
  ): Promise<void> {
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
        resultType: result ? typeof result : undefined,
      },
    });

    await this.logEvent(event);
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(
    userId: string,
    violationType: string,
    description: string,
    severity: AuditSeverity = AuditSeverity.HIGH,
    resource?: string,
    clientIp?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
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
        ...metadata,
      },
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
  async logSystemAdmin(
    userId: string,
    operation: string,
    target: string,
    success: boolean,
    changes?: Record<string, any>,
    error?: string
  ): Promise<void> {
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
      metadata: { changes },
    });

    await this.logEvent(event);
  }

  /**
   * Query audit events
   */
  async queryEvents(filter: AuditQueryFilter): Promise<EnhancedAuditEvent[]> {
    return this.config.storageBackend.query(filter);
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(): Promise<AuditStorageStats> {
    return this.config.storageBackend.getStats();
  }

  /**
   * Clean up old audit events
   */
  async cleanup(): Promise<number> {
    return this.config.storageBackend.cleanup(this.config.retentionDays);
  }

  /**
   * Flush buffered events to storage
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    for (const event of eventsToFlush) {
      try {
        await this.config.storageBackend.store(event);
      } catch (error) {
        console.error('Failed to store audit event:', error);
        // Re-add to buffer for retry
        this.eventBuffer.push(event);
      }
    }
  }

  /**
   * Create audit event with common fields
   */
  private createAuditEvent(eventData: Partial<EnhancedAuditEvent>): EnhancedAuditEvent {
    const event: EnhancedAuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      severity: AuditSeverity.LOW,
      category: AuditCategory.AUTHENTICATION,
      source: 'mcp-system',
      ...eventData,
    } as EnhancedAuditEvent;

    if (this.config.enableEnrichment) {
      this.enrichEvent(event);
    }

    return event;
  }

  /**
   * Log audit event
   */
  private async logEvent(event: EnhancedAuditEvent): Promise<void> {
    if (!this.config.enabled) return;

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
  private enrichEvent(event: EnhancedAuditEvent): void {
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
  private calculateRiskScore(severity: AuditSeverity, eventType: string): number {
    const baseScores: Record<AuditSeverity, number> = {
      [AuditSeverity.LOW]: 10,
      [AuditSeverity.MEDIUM]: 40,
      [AuditSeverity.HIGH]: 70,
      [AuditSeverity.CRITICAL]: 90,
    };

    let score = baseScores[severity];

    // Adjust score based on event type
    const typeModifiers: Record<string, number> = {
      access_denied: 20,
      security_violation: 30,
      login_failure: 15,
      privilege_escalation: 40,
      data_breach: 50,
    };

    const modifier = typeModifiers[eventType] || 0;
    score = Math.min(100, score + modifier);

    return score;
  }

  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): any {
    // Simple user agent parsing (in production, use a proper library)
    const device: any = {};

    if (userAgent.includes('Mobile')) {
      device.type = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      device.type = 'tablet';
    } else {
      device.type = 'desktop';
    }

    if (userAgent.includes('Windows')) {
      device.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      device.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      device.os = 'Linux';
    }

    if (userAgent.includes('Chrome')) {
      device.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      device.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      device.browser = 'Safari';
    }

    return device;
  }

  /**
   * Check alert conditions
   */
  private checkAlertConditions(event: EnhancedAuditEvent): void {
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
  private generateEventId(): string {
    return `audit_${Date.now()}_${++this.eventIdCounter}`;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.stopFlushTimer();
    await this.flush();
  }
}
