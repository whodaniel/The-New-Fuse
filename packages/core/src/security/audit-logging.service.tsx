import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { CorrelationIdManager } from '../utils/correlation-id.js';
import { Request } from 'express';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp?: Date;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  details?: Record<string, any>;
  correlationId?: string;
}

export interface AuditLogConfig {
  enabled: boolean;
  sensitiveFields: string[];
  logToConsole: boolean;
  logToDatabase: boolean;
  retention: {
    days: number;
    enabled: boolean;
  };
}

@Injectable()
export class AuditLoggingService implements OnModuleInit {
  private readonly logger = new Logger(AuditLoggingService.name);
  private config: AuditLogConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('security.auditLogging.enabled', true),
      sensitiveFields: this.configService.get<string[]>('security.auditLogging.sensitiveFields', [
        'password', 'token', 'secret', 'key', 'credential', 'ssn', 'creditCard'
      ]),
      logToConsole: this.configService.get<boolean>('security.auditLogging.logToConsole', true),
      logToDatabase: this.configService.get<boolean>('security.auditLogging.logToDatabase', true),
      retention: {
        days: this.configService.get<number>('security.auditLogging.retention.days', 90),
        enabled: this.configService.get<boolean>('security.auditLogging.retention.enabled', true)
      }
    };

    // Set up cleanup interval if retention is enabled
    if (this.config.retention.enabled) {
      this.cleanupInterval = setInterval(
        () => this.cleanupOldLogs(),
        24 * 60 * 60 * 1000 // Daily
      );
      
      // Run initial cleanup
      await this.cleanupOldLogs();
    }
    
    this.logger.info('Audit logging service initialized');
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.config.enabled) return;
    
    // Ensure timestamp
    const timestamp = entry.timestamp || new Date();
    
    // Ensure correlation ID
    const correlationId = entry.correlationId || CorrelationIdManager.getCurrentId();
    
    // Sanitize sensitive data
    const sanitizedDetails = this.sanitizeDetails(entry.details || {});
    
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp,
      correlationId,
      details: sanitizedDetails,
      success: entry.success !== undefined ? entry.success : true
    };
    
    // Log to console if enabled
    if (this.config.logToConsole) {
      const logLevel = fullEntry.success ? 'info' : 'warn';
      this.logger[logLevel](`AUDIT: ${fullEntry.action} ${fullEntry.resource}${fullEntry.resourceId ? `/${fullEntry.resourceId}` : ''}`, {
        userId: fullEntry.userId || 'anonymous',
        ip: fullEntry.ip || 'unknown',
        success: fullEntry.success,
        correlationId
      });
    }
    
    // Store in database if enabled
    if (this.config.logToDatabase) {
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: fullEntry.userId,
            action: fullEntry.action,
            resource: fullEntry.resource,
            resourceId: fullEntry.resourceId,
            timestamp: fullEntry.timestamp,
            ip: fullEntry.ip,
            userAgent: fullEntry.userAgent,
            success: fullEntry.success,
            details: sanitizedDetails as any,
            correlationId: fullEntry.correlationId
          }
        });
      } catch (error) {
        this.logger.error('Failed to store audit log entry', error);
      }
    }
    
    // Emit event
    this.eventEmitter.emit('security.audit', fullEntry);
  }

  /**
   * Log an audit event from an HTTP request
   */
  async logFromRequest(
    request: Request,
    action: string,
    resource: string,
    options?: {
      resourceId?: string;
      success?: boolean;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const { resourceId, success, details } = options || {};
    
    // Extract user ID from request if available
    const userId = (request as any).user?.id || (request as any).userId;
    
    await this.log({
      userId,
      action,
      resource,
      resourceId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      success,
      details,
      correlationId: (request as any).correlationId || request.headers['x-correlation-id'] as string
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
      resources?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditLogEntry[]> {
    const { startDate, endDate, actions, resources, limit = 100, offset = 0 } = options || {};
    
    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }
    
    if (actions && actions.length > 0) {
      whereClause.action = { in: actions };
    }
    
    if (resources && resources.length > 0) {
      whereClause.resource = { in: resources };
    }
    
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      });
      
      return logs.map(log => ({
        userId: log.userId || undefined,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId || undefined,
        timestamp: log.timestamp,
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined,
        success: log.success,
        details: log.details as Record<string, any> || {},
        correlationId: log.correlationId || undefined
      }));
    } catch (error) {
      this.logger.error('Failed to retrieve user audit logs', error);
      return [];
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId?: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      actions?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditLogEntry[]> {
    const { startDate, endDate, actions, limit = 100, offset = 0 } = options || {};
    
    const whereClause: any = { resource };
    
    if (resourceId) {
      whereClause.resourceId = resourceId;
    }
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }
    
    if (actions && actions.length > 0) {
      whereClause.action = { in: actions };
    }
    
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      });
      
      return logs.map(log => ({
        userId: log.userId || undefined,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId || undefined,
        timestamp: log.timestamp,
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined,
        success: log.success,
        details: log.details as Record<string, any> || {},
        correlationId: log.correlationId || undefined
      }));
    } catch (error) {
      this.logger.error('Failed to retrieve resource audit logs', error);
      return [];
    }
  }

  /**
   * Private methods
   */

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    const sanitizeObject = (obj: Record<string, any>, path: string = ''): Record<string, any> => {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        
        // Check if this field should be redacted
        const shouldRedact = this.config.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        );
        
        if (shouldRedact) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          // Recursively sanitize nested objects
          result[key] = sanitizeObject(value, fullPath);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };
    
    return sanitizeObject(sanitized);
  }

  private async cleanupOldLogs(): Promise<void> {
    if (!this.config.retention.enabled) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retention.days);
    
    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });
      
      if (result.count > 0) {
        this.logger.info(`Cleaned up ${result.count} audit log entries older than ${this.config.retention.days} days`);
      }
    } catch (error) {
      this.logger.error('Failed to clean up old audit logs', error);
    }
  }
}
