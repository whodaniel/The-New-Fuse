import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { ErrorRecoveryService } from './ErrorRecoveryService.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';

interface ErrorRecord {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  component: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'ignored';
  source: 'system' | 'user' | 'external';
  metadata: Record<string, unknown>;
  recoveryAttemptIds?: string[];
}

export interface ErrorOptions {
  component?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  source?: 'system' | 'user' | 'external';
  metadata?: Record<string, unknown>;
  recover?: boolean;
}

const DEFAULT_ERROR_OPTIONS: ErrorOptions = {
  component: 'system',
  severity: 'error',
  source: 'system',
  metadata: {},
  recover: true
};

@Injectable()
export class ErrorHandlerService extends EventEmitter implements OnModuleInit {
  private readonly logger: Logger;
  private readonly db: DatabaseService;
  private readonly recoveryService: ErrorRecoveryService;
  private readonly config: ConfigService;
  private readonly errorCache = new Map<string, ErrorRecord>();
  private readonly errorRateLimit = new Map<string, number>();
  private readonly ERROR_RETENTION_DAYS = 30;
  private readonly HIGH_ERROR_THRESHOLD = 10;
  private readonly ERROR_RATE_WINDOW_MS = 60000; // 1 minute
  
  constructor(
    logger: Logger,
    db: DatabaseService,
    recoveryService: ErrorRecoveryService,
    config: ConfigService
  ) {
    super();
    this.logger = logger;
    this.db = db;
    this.recoveryService = recoveryService;
    this.config = config;
  }

  async onModuleInit(): Promise<void> {
    // Schedule automatic cleanup
    const interval = this.config.get<number>('ERROR_CLEANUP_INTERVAL_HOURS', 24) * 60 * 60 * 1000;
    setInterval(() => this.cleanupOldErrors(), interval);
    
    // Set up recovery service handlers
    this.recoveryService.on('recoverySucceeded', ({ attempt }) => {
      this.updateErrorStatus(attempt.errorId, 'resolved');
    });
    
    this.recoveryService.on('recoveryFailed', ({ attempt }) => {
      this.updateErrorStatus(attempt.errorId, 'acknowledged');
    });
    
    this.logger.info('Error handler service initialized');
  }

  async handleError(
    error: Error | string,
    options: ErrorOptions = {}
  ): Promise<ErrorRecord> {
    const opts = { ...DEFAULT_ERROR_OPTIONS, ...options };
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    
    // Rate limiting check
    const errorKey = `${opts.component}:${message}`;
    if (this.isRateLimited(errorKey)) {
      return this.errorCache.get(errorKey);
    }
    
    // Create error record
    const errorRecord: ErrorRecord = {
      id: crypto.randomUUID(),
      message,
      stack,
      timestamp: new Date(),
      component: opts.component,
      severity: opts.severity,
      status: 'new',
      source: opts.source,
      metadata: opts.metadata
    };
    
    // Log the error
    this.logError(errorRecord);
    
    // Store in database
    await this.persistError(errorRecord);
    
    // Store in cache
    this.errorCache.set(errorKey, errorRecord);
    
    // Emit event
    this.emit('error', errorRecord);
    
    // Attempt recovery if requested
    if (opts.recover && typeof error !== 'string') {
      this.attemptRecovery(error, errorRecord);
    }
    
    return errorRecord;
  }
  
  private isRateLimited(key: string): boolean {
    const now = Date.now();
    const lastOccurrence = this.errorRateLimit.get(key) || 0;
    
    if (now - lastOccurrence < this.ERROR_RATE_WINDOW_MS) {
      // Update the counter in cache
      const currentRecord = this.errorCache.get(key);
      if (currentRecord) {
        currentRecord.metadata = {
          ...currentRecord.metadata,
          occurrences: ((currentRecord.metadata.occurrences as number) || 1) + 1,
          lastOccurrence: new Date()
        };
      }
      
      return true;
    }
    
    this.errorRateLimit.set(key, now);
    return false;
  }
  
  private logError(error: ErrorRecord): void {
    switch (error.severity) {
      case 'info':
        this.logger.info(error.message, {
          component: error.component,
          metadata: error.metadata
        });
        break;
      case 'warning':
        this.logger.warn(error.message, {
          component: error.component,
          metadata: error.metadata
        });
        break;
      case 'error':
      case 'critical':
        this.logger.error(error.message, {
          component: error.component,
          stack: error.stack,
          metadata: error.metadata
        });
        
        // Alert on critical errors
        if (error.severity === 'critical') {
          this.sendAlert(error);
        }
        break;
    }
  }
  
  private async persistError(error: ErrorRecord): Promise<void> {
    try {
      await this.db.errors.create({
        data: {
          id: error.id,
          message: error.message,
          stack: error.stack,
          timestamp: error.timestamp,
          component: error.component,
          severity: error.severity,
          status: error.status,
          source: error.source,
          metadata: JSON.stringify(error.metadata)
        }
      });
    } catch (dbError) {
      this.logger.error('Failed to persist error:', dbError);
    }
  }
  
  private async attemptRecovery(error: Error, errorRecord: ErrorRecord): Promise<void> {
    try {
      const attempt = await this.recoveryService.attemptRecovery(
        error,
        errorRecord.id,
        {
          component: errorRecord.component,
          severity: errorRecord.severity,
          timestamp: errorRecord.timestamp.toISOString()
        }
      );
      
      // Update error record with recovery attempt
      if (!errorRecord.recoveryAttemptIds) {
        errorRecord.recoveryAttemptIds = [];
      }
      
      errorRecord.recoveryAttemptIds.push(attempt.id);
      
      // Update database
      await this.db.errors.update({
        where: { id: errorRecord.id },
        data: {
          recoveryAttemptIds: JSON.stringify(errorRecord.recoveryAttemptIds),
          status: 'in_progress'
        }
      });
    } catch (recoveryError) {
      this.logger.error('Recovery attempt failed:', recoveryError);
    }
  }
  
  async updateErrorStatus(
    id: string,
    status: ErrorRecord['status'],
    metadata?: Record<string, unknown>
  ): Promise<ErrorRecord> {
    try {
      const error = await this.db.errors.findUnique({ where: { id } });
      
      if (!error) {
        throw new Error(`Error with ID ${id} not found`);
      }
      
      const updatedData: any = { status };
      
      if (metadata) {
        const currentMetadata = JSON.parse(error.metadata as string);
        updatedData.metadata = JSON.stringify({
          ...currentMetadata,
          ...metadata
        });
      }
      
      await this.db.errors.update({
        where: { id },
        data: updatedData
      });
      
      // Update cache if present
      for (const [key, record] of this.errorCache.entries()) {
        if (record.id === id) {
          record.status = status;
          if (metadata) {
            record.metadata = { ...record.metadata, ...metadata };
          }
          break;
        }
      }
      
      return {
        ...error,
        status,
        metadata: metadata ? { ...JSON.parse(error.metadata as string), ...metadata } : JSON.parse(error.metadata as string)
      } as ErrorRecord;
    } catch (updateError) {
      this.logger.error('Failed to update error status:', updateError);
      throw updateError;
    }
  }
  
  async getError(id: string): Promise<ErrorRecord | null> {
    try {
      const error = await this.db.errors.findUnique({ where: { id } });
      
      if (!error) {
        return null;
      }
      
      return {
        ...error,
        metadata: JSON.parse(error.metadata as string),
        recoveryAttemptIds: error.recoveryAttemptIds ? JSON.parse(error.recoveryAttemptIds as string) : undefined
      } as ErrorRecord;
    } catch (getError) {
      this.logger.error('Failed to get error:', getError);
      return null;
    }
  }
  
  async getErrors(
    options: {
      component?: string;
      severity?: string;
      status?: string;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ErrorRecord[]> {
    try {
      const errors = await this.db.errors.findMany({
        where: {
          component: options.component,
          severity: options.severity,
          status: options.status,
          source: options.source,
          timestamp: {
            gte: options.startDate,
            lte: options.endDate
          }
        },
        orderBy: { timestamp: 'desc' },
        take: options.limit || 100,
        skip: options.offset || 0
      });
      
      return errors.map(error => ({
        ...error,
        metadata: JSON.parse(error.metadata as string),
        recoveryAttemptIds: error.recoveryAttemptIds ? JSON.parse(error.recoveryAttemptIds as string) : undefined
      }) as ErrorRecord);
    } catch (listError) {
      this.logger.error('Failed to list errors:', listError);
      return [];
    }
  }
  
  async getErrorStats(): Promise<{
    total: number;
    byComponent: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    trend: {
      date: string;
      count: number;
    }[];
  }> {
    // Implement error statistics gathering
    return {
      total: 0,
      byComponent: {},
      bySeverity: {},
      byStatus: {},
      bySource: {},
      trend: []
    };
  }
  
  private async cleanupOldErrors(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ERROR_RETENTION_DAYS);
    
    try {
      // Clear cache
      for (const [key, error] of this.errorCache.entries()) {
        if (error.timestamp < cutoffDate) {
          this.errorCache.delete(key);
        }
      }
      
      // Clear rate limiting
      for (const [key, timestamp] of this.errorRateLimit.entries()) {
        if (Date.now() - timestamp > this.ERROR_RATE_WINDOW_MS) {
          this.errorRateLimit.delete(key);
        }
      }
      
      // Delete from database
      await this.db.errors.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });
      
      this.logger.info(`Cleaned up errors older than ${this.ERROR_RETENTION_DAYS} days`);
    } catch (cleanupError) {
      this.logger.error('Error cleaning up old errors:', cleanupError);
    }
  }
  
  private sendAlert(error: ErrorRecord): void {
    // Implement alerting mechanism (email, SMS, etc.)
    this.logger.warn(`ALERT: Critical error in ${error.component}: ${error.message}`);
    
    // Emit alert event that other services can listen to
    this.emit('alert', error);
  }
  
  async reportHighErrorRate(component: string): Promise<void> {
    // Count errors for this component in the last window
    const startDate = new Date(Date.now() - this.ERROR_RATE_WINDOW_MS);
    
    const count = await this.db.errors.count({
      where: {
        component,
        timestamp: { gt: startDate }
      }
    });
    
    if (count >= this.HIGH_ERROR_THRESHOLD) {
      const alertError: ErrorRecord = {
        id: crypto.randomUUID(),
        message: `High error rate detected in component: ${component}`,
        timestamp: new Date(),
        component: 'ErrorHandler',
        severity: 'critical',
        status: 'new',
        source: 'system',
        metadata: {
          affectedComponent: component,
          errorCount: count,
          timeWindowMs: this.ERROR_RATE_WINDOW_MS
        }
      };
      
      this.sendAlert(alertError);
      await this.persistError(alertError);
    }
  }
}
