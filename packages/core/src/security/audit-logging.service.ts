import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AuditEntry {
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  success: boolean;
  details?: any;
  correlationId?: string;
}

interface AuditConfig {
  enabled: boolean;
  logToConsole: boolean;
  sensitiveFields: string[];
}

@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);
  private config: AuditConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      enabled: this.configService.get<boolean>('security.auditLogging.enabled', true),
      logToConsole: this.configService.get<boolean>('security.auditLogging.logToConsole', true),
      sensitiveFields: ['password', 'token', 'secret', 'key']
    };
  }

  async logEvent(entry: AuditEntry): Promise<void> {
    if (!this.config.enabled) return;

    const fullEntry = {
      ...entry,
      timestamp: new Date(),
      correlationId: entry.correlationId || this.generateCorrelationId()
    };

    // Clean sensitive data
    const cleanedEntry = this.cleanSensitiveData(fullEntry);

    if (this.config.logToConsole) {
      const logLevel = fullEntry.success ? 'log' : 'error';
      this.logger[logLevel]('Audit Log', {
        action: cleanedEntry.action,
        resource: cleanedEntry.resource,
        userId: cleanedEntry.userId || 'anonymous',
        success: cleanedEntry.success,
        correlationId: cleanedEntry.correlationId
      });
    }

    // Store in database (implement as needed)
    // await this.storeInDatabase(cleanedEntry);
  }

  async getAuditLogs(filters: {
    userId?: string;
    actions?: string[];
    resources?: string[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditEntry[]> {
    try {
      // Implement database query logic here
      const whereClause: any = {};

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      
      if (filters.startDate) {
        whereClause.timestamp = { gte: filters.startDate };
      }
      
      if (filters.endDate) {
        whereClause.timestamp = { ...whereClause.timestamp, lte: filters.endDate };
      }

      if (filters.actions && filters.actions.length > 0) {
        whereClause.action = { in: filters.actions };
      }

      if (filters.resources && filters.resources.length > 0) {
        whereClause.resource = { in: filters.resources };
      }

      // Return mock data for now
      return [];
    } catch (error) {
      this.logger.error('Failed to retrieve audit logs', error);
      throw error;
    }
  }

  async cleanupOldLogs(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Implement cleanup logic
      this.logger.log(`Cleaned up audit logs older than ${olderThanDays} days`);
    } catch (error) {
      this.logger.error('Failed to clean up old audit logs', error);
      throw error;
    }
  }

  private cleanSensitiveData(entry: AuditEntry): AuditEntry {
    const cleaned = { ...entry };
    
    if (cleaned.details && typeof cleaned.details === 'object') {
      cleaned.details = this.recursiveClean(cleaned.details);
    }

    return cleaned;
  }

  private recursiveClean(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.config.sensitiveFields.includes(key.toLowerCase())) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        cleaned[key] = this.recursiveClean(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  private generateCorrelationId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}