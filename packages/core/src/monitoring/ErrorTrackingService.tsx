import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { MetricsService } from '../metrics/metrics.service.js';
import { CorrelationIdManager } from '../utils/correlation-id.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error category types
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  EXTERNAL_SERVICE = 'external_service',
  INTERNAL = 'internal',
  UNKNOWN = 'unknown'
}

/**
 * Configuration for error thresholds and alerting
 */
export interface ErrorAlertConfig {
  enabled: boolean;
  thresholds: {
    [key in ErrorCategory]?: {
      count: number;
      timeWindowMs: number;
      minSeverity: ErrorSeverity;
    };
  };
}

/**
 * Enhanced error tracking service with correlation IDs, categorization, and alerting
 */
@Injectable()
export class ErrorTrackingService {
  private errorCounts: Map<string, { count: number; timestamp: number }> = new Map();
  private alertConfig: ErrorAlertConfig;

  constructor(
    private readonly metrics: MetricsService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true })
      ],
      beforeSend: (event) => {
        if(process.env.NODE_ENV === 'production') {
          return event;
        }
        return null;
      },
    });

    // Initialize alert configuration
    this.alertConfig = {
      enabled: process.env.ERROR_ALERTS_ENABLED === 'true',
      thresholds: {
        [ErrorCategory.AUTHENTICATION]: {
          count: 10,
          timeWindowMs: 60000, // 1 minute
          minSeverity: ErrorSeverity.MEDIUM
        },
        [ErrorCategory.DATABASE]: {
          count: 5,
          timeWindowMs: 60000, // 1 minute
          minSeverity: ErrorSeverity.HIGH
        },
        [ErrorCategory.NETWORK]: {
          count: 20,
          timeWindowMs: 300000, // 5 minutes
          minSeverity: ErrorSeverity.MEDIUM
        },
        [ErrorCategory.EXTERNAL_SERVICE]: {
          count: 10,
          timeWindowMs: 300000, // 5 minutes
          minSeverity: ErrorSeverity.MEDIUM
        },
        [ErrorCategory.INTERNAL]: {
          count: 3,
          timeWindowMs: 60000, // 1 minute
          minSeverity: ErrorSeverity.HIGH
        }
      }
    };
  }

  /**
   * Track an error with enhanced context and correlation
   * @param error The error object
   * @param options Additional tracking options
   */
  trackError(
    error: Error,
    options?: {
      context?: Record<string, any>;
      correlationId?: string;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      userId?: string;
      serviceId?: string;
    }
  ) {
    const {
      context = {},
      correlationId = CorrelationIdManager.getCurrentId(),
      category = ErrorCategory.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      userId,
      serviceId
    } = options || {};

    // Record error metrics with enhanced tags
    this.metrics.incrementErrorCount(error.name, {
      category,
      severity,
      service: serviceId
    });

    // Send to Sentry with enhanced context
    Sentry.withScope((scope) => {
      // Add correlation ID
      scope.setTag('correlationId', correlationId);

      // Add error categorization
      scope.setTag('category', category);
      scope.setTag('severity', severity);

      // Add user context if available
      if (userId) {
        scope.setUser({ id: userId });
      }

      // Add service context if available
      if (serviceId) {
        scope.setTag('service', serviceId);
      }

      // Add additional context
      if (Object.keys(context).length > 0) {
        scope.setExtras(context);
      }

      Sentry.captureException(error);
    });

    // Check if we should trigger an alert
    this.checkErrorThresholds(category, severity);
  }

  /**
   * Track an error that occurred in a distributed system component
   * @param error The error object
   * @param correlationId The correlation ID to link related errors
   * @param options Additional tracking options
   */
  trackDistributedError(
    error: Error,
    correlationId: string,
    options?: {
      context?: Record<string, any>;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      userId?: string;
      serviceId?: string;
      parentErrorId?: string;
    }
  ) {
    const { parentErrorId, ...restOptions } = options || {};
    const context = options?.context || {};

    // Add parent error ID to context if available
    if (parentErrorId) {
      context.parentErrorId = parentErrorId;
    }

    // Track the error with the correlation ID
    this.trackError(error, {
      ...restOptions,
      correlationId,
      context
    });
  }

  /**
   * Check if error thresholds have been exceeded and trigger alerts if necessary
   * @param category The error category
   * @param severity The error severity
   */
  private checkErrorThresholds(category: ErrorCategory, severity: ErrorSeverity) {
    if (!this.alertConfig.enabled) return;

    const threshold = this.alertConfig.thresholds[category];
    if (!threshold) return;

    // Only check thresholds for errors at or above the minimum severity
    const severityLevels = Object.values(ErrorSeverity);
    const currentSeverityIndex = severityLevels.indexOf(severity);
    const minSeverityIndex = severityLevels.indexOf(threshold.minSeverity);

    if (currentSeverityIndex < minSeverityIndex) return;

    const now = Date.now();
    const key = `${category}:${severity}`;
    const current = this.errorCounts.get(key) || { count: 0, timestamp: now };

    // Reset counter if outside the time window
    if (now - current.timestamp > threshold.timeWindowMs) {
      current.count = 1;
      current.timestamp = now;
    } else {
      current.count++;
    }

    this.errorCounts.set(key, current);

    // Check if threshold is exceeded
    if (current.count >= threshold.count) {
      this.triggerErrorAlert(category, severity, current.count);
      // Reset counter after alert
      this.errorCounts.set(key, { count: 0, timestamp: now });
    }
  }

  /**
   * Trigger an error alert
   * @param category The error category
   * @param severity The error severity
   * @param count The number of errors that triggered the alert
   */
  private triggerErrorAlert(category: ErrorCategory, severity: ErrorSeverity, count: number) {
    const alert = {
      timestamp: new Date().toISOString(),
      category,
      severity,
      count,
      message: `Error threshold exceeded: ${count} ${severity} ${category} errors`
    };

    // Emit alert event
    this.eventEmitter.emit('error.alert', alert);

    // Log to Sentry as an event
    Sentry.captureMessage(`Error threshold exceeded: ${count} ${severity} ${category} errors`,
      severity === ErrorSeverity.CRITICAL ? Sentry.Severity.Fatal :
      severity === ErrorSeverity.HIGH ? Sentry.Severity.Error :
      severity === ErrorSeverity.MEDIUM ? Sentry.Severity.Warning :
      Sentry.Severity.Info
    );
  }
}