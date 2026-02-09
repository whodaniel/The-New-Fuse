import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceMetricsService } from '../monitoring/performance-metrics.service';

/**
 * Performance Monitoring Interceptor
 * Tracks request duration and logs slow requests
 * Collects metrics for monitoring dashboards
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PerformanceMonitor');
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second

  constructor(
    @Optional() private readonly metricsService?: PerformanceMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Increment in-flight requests
    this.metricsService?.incrementRequestsInFlight();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logPerformance(request, response, startTime);
          this.metricsService?.decrementRequestsInFlight();
        },
        error: (error) => {
          this.logPerformance(request, response, startTime, error);
          this.metricsService?.decrementRequestsInFlight();
        },
      }),
    );
  }

  private logPerformance(
    request: Request,
    response: Response,
    startTime: number,
    error?: any,
  ): void {
    const duration = Date.now() - startTime;
    const { method, url, route } = request;
    const statusCode = response.statusCode;
    const isError = !!error || statusCode >= 400;

    // Record metrics
    if (this.metricsService) {
      const routePath = route?.path || url;
      this.metricsService.recordHttpRequest(
        method,
        routePath,
        statusCode,
        duration,
      );

      if (isError) {
        const errorType = error?.name || `HTTP_${statusCode}`;
        this.metricsService.recordHttpError(method, routePath, errorType);
      }
    }

    // Log slow requests
    if (duration > this.SLOW_REQUEST_THRESHOLD) {
      this.logger.warn(
        `Slow request detected: ${method} ${url} took ${duration}ms (status: ${statusCode})`,
      );
    }

    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(
        `${method} ${url} - ${duration}ms - ${statusCode} ${isError ? `(ERROR: ${error?.message})` : ''}`,
      );
    }
  }
}
