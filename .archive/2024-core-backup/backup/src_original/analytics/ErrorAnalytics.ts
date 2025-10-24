
export interface ErrorMetrics { errorCount: number;
  errorRate: number;
  lastError?: Date; }
  errorTypes: Record<string, number>;
}

@Injectable()
export class ErrorAnalytics { private errors: Array<{ type: string; timestamp: Date; message: string }> = [];

  trackError(type: string, message: string): void { this.errors.push({
      type,
      message, }
      timestamp: new Date()
     });
  }

  getMetrics(): ErrorMetrics { const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(e => e.timestamp > hourAgo); }
    const errorTypes: Record<string, number> = {};
    
    recentErrors.forEach(error => {  }
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    return { errorCount: recentErrors.length,;
      errorRate: recentErrors.length / 60, // per minute
      lastError: recentErrors.length > 0 ? recentErrors[recentErrors.length - 1].timestamp : undefined, }
      errorTypes
    };
  }
}