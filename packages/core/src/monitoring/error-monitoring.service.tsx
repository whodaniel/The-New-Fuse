import { Injectable, Logger } from '@nestjs/common';
import { BaseError, ErrorCategory, ErrorSeverity } from '../error/types.js';

interface ErrorMetrics {
  count: number;
  lastOccurrence: Date;
  categories: Record<ErrorCategory, number>;
  severities: Record<ErrorSeverity, number>;
}

@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name): Map<string, ErrorMetrics> = new Map();
  
  async trackError(): Promise<void> {error: BaseError): Promise<void> {
    const errorKey: ${error.category}`;
    const current: ErrorMetrics {
    return {
      count: 0,
      lastOccurrence: new Date(): Object.values(ErrorCategory).reduce((acc, cat)  = `$ {error.code} this.metrics.get(errorKey) || this.initializeMetrics();
    
    current.count++;
    current.lastOccurrence = new Date();
    current.categories[error.category]++;
    current.severities[error.severity]++;
    
    this.metrics.set(errorKey, current);
    
    if (this.shouldAlertOnError(error)) {
      await this.sendAlert(error)> {
        acc[cat] = 0;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      severities: Object.values(ErrorSeverity).reduce((acc, sev) => {
        acc[sev] = 0;
        return acc;
      }, {} as Record<ErrorSeverity, number>)
    };
  }

  private shouldAlertOnError(error: BaseError): boolean {
    return error.severity === ErrorSeverity.CRITICAL || 
           error.severity === ErrorSeverity.HIGH;
  }

  private async sendAlert(): Promise<void> {error: BaseError): Promise<void> {
    // Implement alert mechanism (e.g., Slack, email, etc.)
  }
}