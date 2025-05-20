import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '@the-new-fuse/monitoring';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  timestamp: number;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  handled: boolean;
  resolution?: string;
}

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);
  private readonly errorPatterns = new Map<RegExp, (error: Error) => string>();

  constructor(private readonly metricsService: MetricsService) {
    this.initializeErrorPatterns();
  }

  async handleError(error: Error, context: Partial<ErrorContext> = {}): Promise<ErrorReport> {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      ...context
    };

    const report: ErrorReport = {
      error,
      context: fullContext,
      handled: false,
    };

    try {
      // Log error
      this.logger.error({
        message: error.message,
        stack: error.stack,
        context: fullContext,
      });

      // Track error metric
      await this.metricsService.trackMetric('error_count', 1, {
        type: error.name,
        path: fullContext.path,
      });

      // Find matching error pattern and resolution
      for(const [pattern, resolver] of this.errorPatterns.entries()) {
        if (pattern.test(error.message)) {
          report.resolution = resolver(error);
          report.handled = true;
          break;
        }
      }

      return report;
    } catch (handlingError) {
      this.logger.error(`Error while handling error: ${handlingError instanceof Error ? handlingError.message : String(handlingError)}`);
      return {
        ...report,
        error: handlingError instanceof Error ? handlingError : new Error(String(handlingError)),
        handled: false,
      };
    }
  }

  private initializeErrorPatterns() {
    this.errorPatterns.set(
      /connection refused/i,
      (error: Error) => `Connection error detected: ${error.message}. Please check network connectivity.`
    );

    this.errorPatterns.set(
      /timeout/i,
      (error: Error) => `Timeout error detected: ${error.message}. The operation took too long to complete.`
    );
  }

  async getErrorMetrics(timeRange: { start: Date; end: Date }) {
    return this.metricsService.getMetrics('error_count', timeRange);
  }
}