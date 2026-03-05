// @ts-nocheck
import { ErrorService } from '../core/services/ErrorService';
import { ErrorCategory, ErrorPriority } from '../shared/types/errors';
import { Logger } from '../utils/logger';

interface ErrorContext {
  category?: ErrorCategory;
  priority?: ErrorPriority;
  userId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private readonly errorService: ErrorService;
  private readonly logger: Logger;
  private isInitialized = false;
  private sentry: any = null;

  private constructor() {
    this.errorService = ErrorService.getInstance();
    this.logger = new Logger('ErrorTrackingService');
    this.initializeSentry();
    this.setupErrorSubscriptions();
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  private initializeSentry(): void {
    try {
      const dsn = import.meta.env.VITE_SENTRY_DSN;
      if (!dsn) {
        this.logger.warn('Sentry DSN not configured');
        return;
      }
      this.logger.warn('Sentry SDK package is not installed; error telemetry will be local-only');
    } catch (error) {
      this.logger.error('Failed to initialize Sentry:', error);
    }
  }

  private beforeSendCallback(event: any): any | null {
    // Filter out unnecessary errors
    if (this.shouldIgnoreError(event)) {
      return null;
    }

    // Sanitize sensitive data
    return this.sanitizeEventData(event);
  }

  private shouldIgnoreError(event: any): boolean {
    const ignoredMessages = [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Load failed',
    ];

    return ignoredMessages.some(
      (msg) => event.message?.includes(msg) || event.exception?.values?.[0]?.value?.includes(msg)
    );
  }

  private sanitizeEventData(event: any): any {
    // Deep clone the event to avoid mutations
    const sanitizedEvent = JSON.parse(JSON.stringify(event));

    // Remove sensitive data
    if (sanitizedEvent.request?.cookies) {
      delete sanitizedEvent.request.cookies;
    }

    // Mask sensitive fields
    if (sanitizedEvent.request?.headers) {
      sanitizedEvent.request.headers = this.maskSensitiveHeaders(sanitizedEvent.request.headers);
    }

    return sanitizedEvent;
  }

  private maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token'];
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        sensitiveHeaders.includes(key.toLowerCase()) ? '[REDACTED]' : value,
      ])
    );
  }

  private setupErrorSubscriptions(): void {
    this.errorService.subscribeToErrors((error: Error, context?: ErrorContext) => {
      this.trackError(error, context);
    });
  }

  private setupGlobalHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackError(error || new Error(String(message)), {
        category: ErrorCategory.RUNTIME,
        metadata: { source, lineno, colno },
      });
    };

    window.onunhandledrejection = (event) => {
      this.trackError(event.reason, {
        category: ErrorCategory.PROMISE_REJECTION,
      });
    };
  }

  public trackError(error: Error, context?: ErrorContext): void {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized, logging error locally:', error);
      return;
    }

    try {
      this.sentry?.withScope((scope: any) => {
        if (context) {
          if (context.category) {
            scope.setTag('category', context.category);
          }
          if (context.priority) {
            scope.setTag('priority', context.priority);
          }
          if (context.tags) {
            context.tags.forEach((tag) => scope.setTag(tag, true));
          }
          if (context.metadata) {
            scope.setExtras(context.metadata);
          }
        }

        this.sentry?.captureException(error);
      });

      // Log to local logger as well
      this.logger.error(error.message, {
        error,
        context,
        stack: error.stack,
      });
    } catch (e) {
      this.logger.error('Failed to track error:', e);
    }
  }

  public setUser(user: { id: string; email?: string; role?: string }): void {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (e) {
      this.logger.error('Failed to set user:', e);
    }
  }

  public clearUser(): void {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.setUser(null);
    } catch (e) {
      this.logger.error('Failed to clear user:', e);
    }
  }

  public addBreadcrumb(message: string, category?: string, level?: string): void {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
      });
    } catch (e) {
      this.logger.error('Failed to add breadcrumb:', e);
    }
  }

  public setTag(key: string, value: string): void {
    if (!this.isInitialized || !this.sentry) return;

    try {
      this.sentry.setTag(key, value);
    } catch (e) {
      this.logger.error('Failed to set tag:', e);
    }
  }
}

export const errorTracker = ErrorTrackingService.getInstance();

export async function reportError(
  error: Error,
  context?: {
    category?: ErrorCategory;
    priority?: ErrorPriority;
    userId?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    [key: string]: any;
  }
): Promise<void> {
  const metadata = context
    ? {
        ...context.metadata,
        ...context,
      }
    : undefined;

  errorTracker.trackError(error, {
    category: context?.category,
    priority: context?.priority,
    userId: context?.userId,
    metadata,
    tags: context?.tags,
  });
}
