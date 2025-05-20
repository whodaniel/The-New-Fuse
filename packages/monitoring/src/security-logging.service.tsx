import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@the-new-fuse/database';

export interface SecurityEvent {
  eventType: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  status: 'success' | 'failure' | 'attempt';
  details?: Record<string, unknown>;
  timestamp?: Date;
  severity?: 'info' | 'warning' | 'critical';
  sessionId?: string;
  requestId?: string;
}

@Injectable()
export class SecurityLoggingService {
  private readonly logger = new Logger(SecurityLoggingService.name);
  private readonly enabled: boolean;
  private readonly logToConsole: boolean;
  private readonly sensitiveFields: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const securityConfig = this.configService.get<Record<string, unknown>>('security.logging') || {};
    this.enabled = securityConfig.enabled !== false;
    this.logToConsole = securityConfig.logToConsole !== false;
    this.sensitiveFields = securityConfig.sensitiveFields || [
      'password', 'token', 'secret', 'apiKey', 'key', 'credential'
    ];
    this.logger.log('Security logging service initialized');
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    if (!this.enabled) return;

    try {
      const normalizedEvent = this.normalizeEvent(event);

      await this.prisma.securityEvent.create({
        data: {
          eventType: normalizedEvent.eventType,
          userId: normalizedEvent.userId,
          ipAddress: normalizedEvent.ipAddress,
          userAgent: normalizedEvent.userAgent,
          resource: normalizedEvent.resource,
          action: normalizedEvent.action,
          status: normalizedEvent.status,
          details: normalizedEvent.details ? JSON.stringify(this.sanitizeDetails(normalizedEvent.details)) : null,
          timestamp: normalizedEvent.timestamp,
          severity: normalizedEvent.severity || 'info',
          sessionId: normalizedEvent.sessionId,
          requestId: normalizedEvent.requestId,
        },
      });

      if (this.logToConsole) {
        const logLevel = this.getLogLevel(normalizedEvent.severity);
        this.logger[logLevel](
          `Security Event: ${normalizedEvent.eventType} - ${normalizedEvent.action} - ${normalizedEvent.status}`,
          {
            ...normalizedEvent,
            details: normalizedEvent.details ? this.sanitizeDetails(normalizedEvent.details) : undefined,
            timestamp: normalizedEvent.timestamp?.toISOString(),
          },
        );
      }
    } catch (error: unknown) {
      const errorObj = error as Error;
      this.logger.error(`Failed to log security event: ${errorObj.message}`, errorObj.stack);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt({
    userId,
    username,
    ipAddress,
    userAgent,
    success,
    failureReason,
    sessionId,
    requestId,
  }: {
    userId?: string;
    username: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
    sessionId?: string;
    requestId?: string;
  }): Promise<void> {
    return this.logSecurityEvent({
      eventType: 'authentication',
      userId,
      ipAddress,
      userAgent,
      action: 'login',
      status: success ? 'success' : 'failure',
      details: {
        username,
        ...(failureReason ? { failureReason } : {}),
      },
      severity: success ? 'info' : 'warning',
      sessionId,
      requestId,
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange({
    userId,
    adminId,
    ipAddress,
    permission,
    resource,
    action,
    requestId,
  }: {
    userId: string;
    adminId: string;
    ipAddress?: string;
    permission: string;
    resource: string;
    action: 'grant' | 'revoke' | 'modify';
    requestId?: string;
  }): Promise<void> {
    return this.logSecurityEvent({
      eventType: 'permission_change',
      userId,
      ipAddress,
      resource,
      action,
      status: 'success',
      details: {
        adminId,
        permission,
      },
      severity: 'warning',
      requestId,
    });
  }

  /**
   * Log access to sensitive resource
   */
  async logResourceAccess({
    userId,
    ipAddress,
    userAgent,
    resource,
    action,
    success,
    requestId,
  }: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource: string;
    action: string;
    success: boolean;
    requestId?: string;
  }): Promise<void> {
    return this.logSecurityEvent({
      eventType: 'resource_access',
      userId,
      ipAddress,
      userAgent,
      resource,
      action,
      status: success ? 'success' : 'failure',
      severity: success ? 'info' : 'warning',
      requestId,
    });
  }

  /**
   * Query security events with filters
   */
  async querySecurityEvents({
    eventType,
    userId,
    ipAddress,
    resource,
    action,
    status,
    severity,
    timeRange,
    page = 1,
    limit = 20,
  }: {
    eventType?: string;
    userId?: string;
    ipAddress?: string;
    resource?: string;
    action?: string;
    status?: 'success' | 'failure' | 'attempt';
    severity?: 'info' | 'warning' | 'critical';
    timeRange?: { start: Date; end: Date };
    page?: number;
    limit?: number;
  }): Promise<{ events: SecurityEvent[]; total: number }> {
    try {
      const where: Record<string, unknown> = {};

      if (eventType) where.eventType = eventType;
      if (userId) where.userId = userId;
      if (ipAddress) where.ipAddress = ipAddress;
      if (resource) where.resource = resource;
      if (action) where.action = action;
      if (status) where.status = status;
      if (severity) where.severity = severity;
      if (timeRange) {
        where.timestamp = {
          gte: timeRange.start,
          lte: timeRange.end,
        };
      }

      const [events, total] = await Promise.all([
        this.prisma.securityEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.securityEvent.count({ where }),
      ]);

      const parsedEvents = events.map(event => ({
        ...event,
        details: event.details ? JSON.parse(event.details) : null,
      })) as SecurityEvent[];

      return { events: parsedEvents, total };
    } catch (error: unknown) {
      const errorObj = error as Error;
      this.logger.error(`Failed to query security events: ${errorObj.message}`, errorObj.stack);
      return { events: [], total: 0 };
    }
  }

  /**
   * Normalize security event
   */
  private normalizeEvent(event: SecurityEvent): SecurityEvent {
    return {
      ...event,
      timestamp: event.timestamp || new Date(),
    };
  }

  /**
   * Sanitize sensitive details from an object
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const key in details) {
      if (Object.prototype.hasOwnProperty.call(details, key)) {
        const value = details[key];
        if (this.sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          sanitized[key] = this.sanitizeDetails(value as Record<string, unknown>);
        } else {
          sanitized[key] = value;
        }
      }
    }
    return sanitized;
  }

  /**
   * Get log level based on severity
   */
  private getLogLevel(severity?: 'info' | 'warning' | 'critical'): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warn';
      case 'info':
      default:
        return 'log';
    }
  }
}