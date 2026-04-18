/**
 * Audit Logger
 *
 * Comprehensive audit logging for all cloud sandbox operations.
 * Tracks who did what, when, and with what result for security and compliance.
 */

import type { AuthenticatedUser } from './CloudSandboxAuthGuard.js';

export interface AuditLog {
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'tool_execution' | 'access_denied';
  userId: string;
  userType: 'agent' | 'human';
  userRole: string;
  tenantId: string;
  action: string;
  resource?: string;
  params?: Record<string, unknown>;
  result: 'success' | 'failure' | 'denied';
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogStorage {
  save(log: AuditLog): Promise<void>;
  query(filters: Partial<AuditLog>, limit?: number): Promise<AuditLog[]>;
}

/**
 * Audit Logger for Cloud Sandbox
 */
export class AuditLogger {
  private readonly storage?: AuditLogStorage;
  private readonly localBuffer: AuditLog[] = [];
  private readonly bufferSize = 1000;

  constructor(storage?: AuditLogStorage) {
    this.storage = storage;
  }

  /**
   * Log authentication attempt
   */
  async logAuthentication(
    userId: string,
    userType: 'agent' | 'human',
    result: 'success' | 'failure',
    error?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      eventType: 'authentication',
      userId,
      userType,
      userRole: 'unknown',
      tenantId: 'unknown',
      action: 'authenticate',
      result,
      error,
      metadata,
    };

    await this.saveLog(log);
  }

  /**
   * Log authorization check
   */
  async logAuthorization(
    user: AuthenticatedUser,
    action: string,
    resource: string,
    result: 'success' | 'denied',
    reason?: string
  ): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      eventType: 'authorization',
      userId: user.id,
      userType: user.type,
      userRole: user.role,
      tenantId: user.tenantId,
      action,
      resource,
      result,
      error: reason,
    };

    await this.saveLog(log);
  }

  /**
   * Log tool execution
   */
  async logToolExecution(
    user: AuthenticatedUser,
    toolName: string,
    params: Record<string, unknown>,
    result: 'success' | 'failure',
    error?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Sanitize sensitive parameters before logging
    const sanitizedParams = this.sanitizeParams(toolName, params);

    const log: AuditLog = {
      timestamp: new Date(),
      eventType: 'tool_execution',
      userId: user.id,
      userType: user.type,
      userRole: user.role,
      tenantId: user.tenantId,
      action: toolName,
      resource: this.extractResourceFromParams(toolName, params),
      params: sanitizedParams,
      result,
      error,
      metadata,
    };

    await this.saveLog(log);
  }

  /**
   * Log access denied
   */
  async logAccessDenied(
    user: AuthenticatedUser,
    action: string,
    resource: string,
    reason: string
  ): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      eventType: 'access_denied',
      userId: user.id,
      userType: user.type,
      userRole: user.role,
      tenantId: user.tenantId,
      action,
      resource,
      result: 'denied',
      error: reason,
    };

    await this.saveLog(log);

    // Log warning for security monitoring
    console.warn(
      `ACCESS DENIED: ${user.type}:${user.id} (${user.role}) attempted ${action} on ${resource} - ${reason}`
    );
  }

  /**
   * Save audit log
   */
  private async saveLog(log: AuditLog): Promise<void> {
    // Add to local buffer
    this.localBuffer.push(log);
    if (this.localBuffer.length > this.bufferSize) {
      this.localBuffer.shift(); // Remove oldest entry
    }

    // Save to persistent storage if available
    if (this.storage) {
      try {
        await this.storage.save(log);
      } catch (error) {
        console.error('Failed to save audit log to storage:', error);
      }
    }

    // Log to console for real-time monitoring
    console.log(
      `[${log.eventType}] ${log.userType}:${log.userId} (${log.userRole}) - ${log.action} - ${log.result}`
    );
  }

  /**
   * Sanitize sensitive parameters before logging
   */
  private sanitizeParams(
    toolName: string,
    params: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...params };

    // Redact sensitive values
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'credentials'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    // Truncate large content
    if (toolName === 'write_file' && sanitized.content) {
      const content = sanitized.content as string;
      if (content.length > 200) {
        sanitized.content = `${content.substring(0, 200)}... [${content.length} bytes]`;
      }
    }

    return sanitized;
  }

  /**
   * Extract resource identifier from tool parameters
   */
  private extractResourceFromParams(toolName: string, params: Record<string, unknown>): string {
    if (params.path) return params.path as string;
    if (params.url) return params.url as string;
    if (params.command) {
      const command = params.command as string;
      return command.length > 50 ? `${command.substring(0, 50)}...` : command;
    }
    return toolName;
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: Partial<AuditLog>, limit = 100): Promise<AuditLog[]> {
    if (this.storage) {
      try {
        return await this.storage.query(filters, limit);
      } catch (error) {
        console.error('Failed to query audit logs from storage:', error);
      }
    }

    // Fallback to local buffer
    let results = [...this.localBuffer];

    // Apply filters
    if (filters.userId) {
      results = results.filter((log) => log.userId === filters.userId);
    }
    if (filters.tenantId) {
      results = results.filter((log) => log.tenantId === filters.tenantId);
    }
    if (filters.eventType) {
      results = results.filter((log) => log.eventType === filters.eventType);
    }
    if (filters.action) {
      results = results.filter((log) => log.action === filters.action);
    }
    if (filters.result) {
      results = results.filter((log) => log.result === filters.result);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return results.slice(0, limit);
  }

  /**
   * Get security alerts (failed authentications, access denials)
   */
  async getSecurityAlerts(limit = 50): Promise<AuditLog[]> {
    const alerts = await this.queryLogs(
      {
        result: 'denied',
      },
      limit
    );

    return alerts;
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, tenantId: string, limit = 100): Promise<AuditLog[]> {
    return await this.queryLogs({ userId, tenantId }, limit);
  }

  /**
   * Get tenant activity summary
   */
  async getTenantActivity(tenantId: string, limit = 100): Promise<AuditLog[]> {
    return await this.queryLogs({ tenantId }, limit);
  }

  /**
   * Export logs to JSON
   */
  exportLogs(logs: AuditLog[]): string {
    return JSON.stringify(logs, null, 2);
  }
}
