import { Injectable, Logger } from '@nestjs/common';
import { MonitoringService } from '../monitoring/monitoring.service.js';
import {
  ApplicationError,
  BaseError,
  ErrorCategory,
  ErrorSeverity,
  ErrorMetadata
} from './types.js';

@Injectable()
export class ErrorHandler {
  private readonly logger = new Logger(ErrorHandler.name);
  constructor(private readonly monitoring: MonitoringService) {}

  async handleError(error: Error | BaseError, context?: string): Promise<void> {
    const errorId = this.generateErrorId();
    const timestamp = new Date();

    const normalizedError = this.normalizeError(error);
    const metadata = this.extractMetadata(normalizedError, context);

    // Log error details
    this.logger.error({
      errorId,
      message: normalizedError.message,
      stack: normalizedError.stack,
      category: normalizedError.category,
      severity: normalizedError.severity,
      code: normalizedError.code,
      context,
      metadata,
      timestamp: timestamp.toISOString()
    });

    // Record error metrics
    await this.monitoring.recordError({
      errorId,
      type: normalizedError.name,
      category: normalizedError.category,
      severity: normalizedError.severity,
      context,
      timestamp
    });

    // Implement recovery strategy based on error category
    await this.executeRecoveryStrategy(normalizedError);
  }

  private normalizeError(error: Error | BaseError): BaseError {
    if (this.isBaseError(error)) {
      return error;
    }

    return new ApplicationError(
      error.message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.MEDIUM,
      'UNKNOWN_ERROR',
      {
        timestamp: new Date()
      },
      error
    );
  }

  private isBaseError(error: Error | BaseError): error is BaseError {
    return 'category' in error && 'severity' in error && 'code' in error;
  }

  private extractMetadata(error: BaseError, context?: string): ErrorMetadata {
    return {
      timestamp: new Date(),
      correlationId: this.getCorrelationId(),
      context,
      ...error.metadata
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random()}`;
  }

  private getCorrelationId(): string {
    // Implement correlation ID extraction from current context
    return `corr_${Date.now()}`;
  }

  private async executeRecoveryStrategy(error: BaseError): Promise<void> {
    switch (error.category) {
      case ErrorCategory.DATABASE:
        await this.handleDatabaseError(error);
        break;
      case ErrorCategory.NETWORK:
        await this.handleNetworkError(error);
        break;
      // Add other category handlers
    }
  }

  private async handleDatabaseError(error: BaseError): Promise<void> {
    // Implement database error recovery strategy
  }

  private async handleNetworkError(error: BaseError): Promise<void> {
    // Implement network error recovery strategy
  }
}
