/**
 * NestJS Monitoring Interceptor
 * Intercepts HTTP requests for logging and metrics
 */

export interface RequestMetadata {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Monitoring interceptor implementation
 * This is a template that can be used in NestJS services
 */
export class MonitoringInterceptorTemplate {
  /**
   * Intercept method that can be used in NestJS CallHandler
   */
  static async intercept(
    context: any,
    next: any,
    services: {
      logger?: any;
      metrics?: any;
      sentry?: any;
    }
  ): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Add request ID if not present
    if (!request.id) {
      request.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add breadcrumb to Sentry
    if (services.sentry) {
      services.sentry.addBreadcrumb({
        message: `HTTP ${request.method} ${request.url}`,
        category: 'http',
        level: 'info',
        data: {
          method: request.method,
          url: request.url,
          requestId: request.id,
        },
      });
    }

    try {
      const result = await next.handle().toPromise();
      const duration = Date.now() - startTime;

      // Log request
      if (services.logger) {
        services.logger.logRequest(request, response, duration);
      }

      // Record metrics
      if (services.metrics) {
        services.metrics.recordHttpRequest(
          request.method,
          request.route?.path || request.url,
          response.statusCode,
          duration
        );
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Log error
      if (services.logger) {
        services.logger.error(`HTTP ${request.method} ${request.url} failed`, error, {
          method: request.method,
          url: request.url,
          statusCode: response.statusCode,
          duration,
          requestId: request.id,
        });
      }

      // Record error metrics
      if (services.metrics) {
        services.metrics.recordHttpRequest(
          request.method,
          request.route?.path || request.url,
          response.statusCode || 500,
          duration
        );
      }

      // Capture exception in Sentry
      if (services.sentry) {
        services.sentry.captureException(error, {
          tags: {
            method: request.method,
            route: request.route?.path || request.url,
            statusCode: response.statusCode?.toString() || '500',
          },
          extra: {
            requestId: request.id,
            userId: request.user?.id,
            duration,
          },
        });
      }

      throw error;
    }
  }
}

/**
 * Error filter template for NestJS
 */
export class ErrorFilterTemplate {
  static catch(exception: any, host: any, services: { logger?: any; sentry?: any }) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.status || 500;
    const message = exception.message || 'Internal server error';

    // Log error
    if (services.logger) {
      services.logger.error(`Unhandled exception: ${message}`, exception, {
        method: request.method,
        url: request.url,
        statusCode: status,
        requestId: request.id,
      });
    }

    // Capture in Sentry
    if (services.sentry && status >= 500) {
      services.sentry.captureException(exception, {
        tags: {
          method: request.method,
          route: request.url,
          statusCode: status.toString(),
        },
        extra: {
          requestId: request.id,
          userId: request.user?.id,
        },
        level: status >= 500 ? 'error' : 'warning',
      });
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    });
  }
}
