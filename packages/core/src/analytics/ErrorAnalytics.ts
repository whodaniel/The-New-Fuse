import { Injectable } from '@nestjs/common';
export interface ErrorMetrics {
  // Implementation needed
}
  errorCount: number;
  errorRate: number;
  lastError?: Date;
  errorTypes: Record<string, number>;
  averageErrorsPerHour: number;
  criticalErrors: number;
}

export interface ErrorEvent {
  // Implementation needed
}
  type: string;
  timestamp: Date;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stack?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ErrorAnalytics {
  // Implementation needed
}
  private errors: ErrorEvent[] = [];
  private readonly maxStoredErrors = 10000;
  trackError(
    type: string, 
    message: string, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    stack?: string,
    metadata?: Record<string, any>
  ): void {
  // Implementation needed
}
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
    if (this.errors.length > this.maxStoredErrors) {
  // Implementation needed
}
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }
  }

  getMetrics(timeWindowMinutes: number = 60): ErrorMetrics {
  // Implementation needed
}
    const now = new Date();
    const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > windowStart);
    const errorTypes: Record<string, number> = {};
    let criticalErrors = 0;
    recentErrors.forEach(error => {
  // Implementation needed
}
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      if (error.severity === 'critical') {
  // Implementation needed
}
        criticalErrors++;
      }
    });
    return {
  // Implementation needed
}
      errorCount: recentErrors.length,
      errorRate: recentErrors.length / timeWindowMinutes, // per minute
      lastError: recentErrors.length > 0 ? recentErrors[recentErrors.length - 1].timestamp : undefined,
      errorTypes,
      averageErrorsPerHour(recentErrors.length / timeWindowMinutes) * 60,
      criticalErrors
    };
  }

  getErrorHistory(hours: number = 24): ErrorEvent[] {
  // Implementation needed
}
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(e => e.timestamp > cutoff);
  }

  getErrorsByType(type: string, hours: number = 24): ErrorEvent[] {
  // Implementation needed
}
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(e => e.type === type && e.timestamp > cutoff);
  }

  getCriticalErrors(hours: number = 24): ErrorEvent[] {
  // Implementation needed
}
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(e => e.severity === 'critical' && e.timestamp > cutoff);
  }

  clearOldErrors(olderThanHours: number = 168): void { // Default to 1 week
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.errors = this.errors.filter(e => e.timestamp > cutoff);
  }

  getTotalErrorCount(): number {
  // Implementation needed
}
    return this.errors.length;
  }
}