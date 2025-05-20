import { Injectable, Logger } from '@nestjs/common';
import { BaseError, ErrorSeverity } from './types.js';
import { Db } from 'mongodb';
import { NotificationService } from './notification.service.js';

interface ErrorReport {
  timestamp: Date;
  error: BaseError;
  context: string;
  environment: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class ErrorReportingService {
  private readonly logger = new Logger(ErrorReportingService.name);
  private readonly db: Db;
  private readonly notificationService: NotificationService;

  constructor(db: Db, notificationService: NotificationService) {
    this.db = db;
    this.notificationService = notificationService;
  }

  async reportError(error: BaseError, context?: string): Promise<void> {
    const report = this.createErrorReport(error, context);
    await this.logError(report);
    await this.saveErrorToDatabase(report);

    if (error.severity >= ErrorSeverity.CRITICAL) {
      await this.notifyCriticalError(report);
    }
  }

  private createErrorReport(error: BaseError, context?: string): ErrorReport {
    return {
      timestamp: new Date(),
      error,
      context: context || 'unknown',
      environment: (process as any).env.NODE_ENV || 'development',
      metadata: {
        stack: error.stack,
        cause: error.cause,
        ...error.metadata
      }
    };
  }

  private async logError(report: ErrorReport): Promise<void> {
    this.logger.error({
      message: report.error.message,
      errorId: report.error.code,
      category: report.error.category,
      severity: report.error.severity,
      context: report.context,
      metadata: report.metadata,
      timestamp: report.timestamp,
      environment: report.environment
    });
  }

  private async saveErrorToDatabase(report: ErrorReport): Promise<void> {
    await this.db.collection('errors').insertOne({
      ...report,
      stackTrace: report.error.stack,
      createdAt: new Date()
    });
  }

  private async notifyCriticalError(report: ErrorReport): Promise<void> {
    await this.notificationService.send({
      type: 'error_alert',
      title: `Critical Error in ${report.environment}`,
      message: report.error.message,
      metadata: {
        errorCode: report.error.code,
        context: report.context,
        timestamp: report.timestamp
      },
      priority: 'high'
    });
  }
}
