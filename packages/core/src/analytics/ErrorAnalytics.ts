import { Injectable } from '@nestjs/common';
export interface ErrorMetrics {
  errorCount: number;
  errorRate: number;
  lastError?: Date;
  errorTypes: Record<string, number>;
  averageErrorsPerHour: number;
  criticalErrors: number;
}

export interface ErrorEvent {
  type: string;
  timestamp: Date;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stack?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ErrorAnalytics {
  private errors: ErrorEvent[] = [];
  private readonly maxStoredErrors = 10000;
  trackError(): unknown {
    const errorEvent: ErrorEvent = {
  // Implementation needed
}
      type,
      message,
      severity,
      timestamp: new Date(),
      stack,
      metadata
    };
    this.errors.push(errorEvent);
    // Keep only the most recent errors to prevent memory issues
    if(): unknown {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }
  }

  getMetrics(): unknown {
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > windowStart);
    const errorTypes: Record<string, number> = {};
    let criticalErrors = 0;
    recentErrors.forEach(error => {
  // Implementation needed
}
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      if(): unknown {
        criticalErrors++;
      }
    });
    return {
errorCount: recentErrors.length,
  }      errorRate: recentErrors.length / timeWindowMinutes, // per minute
      lastError: recentErrors.length > 0 ? recentErrors[recentErrors.length - 1].timestamp : undefined,
      errorTypes,
      averageErrorsPerHour(): unknown {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(e => e.timestamp > cutoff);
  }

  getErrorsByType(): unknown {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(e => e.type === type && e.timestamp > cutoff);
  }

  getCriticalErrors(): unknown {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(e => e.severity === 'critical' && e.timestamp > cutoff);
  }

  clearOldErrors(olderThanHours: number = 168): void { // Default to 1 week
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
  }

  getTotalErrorCount(): unknown {
    return this.errors.length;
  }
}