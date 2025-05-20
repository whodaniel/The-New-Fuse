import { ErrorService } from '../core/services/ErrorService.js';
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import { ErrorPriority, ErrorCategory } from '../shared/types/errors.js';
import { Logger } from '../utils/logger.js';

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

      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION,
        integrations: [
          new BrowserTracing({
            tracingOrigins: ['localhost', 'your-production-domain.com'],
          }),
        ],
        tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
        beforeSend: (event) => this.beforeSendCallback(event),
      });

      this.isInitialized = true;
      this.logger.info('Sentry initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Sentry:', error);
    }
  }

  private beforeSendCallback(event: Sentry.Event): Sentry.Event | null {
    // Filter out unnecessary errors
    if (this.shouldIgnoreError(event)) {
      return null;
    }

    // Sanitize sensitive data
    return this.sanitizeEventData(event);
  }

  private shouldIgnoreError(event: Sentry.Event): boolean {
    const ignoredMessages = [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Load failed',
    ];

    return ignoredMessages.some(msg => 
      event.message?.includes(msg) || 
      event.exception?.values?.[0]?.value?.includes(msg)
    );
  }

  private sanitizeEventData(event: Sentry.Event): Sentry.Event {
    // Deep clone the event to avoid mutations
    const sanitizedEvent = JSON.parse(JSON.stringify(event));

    // Remove sensitive data
    if (sanitizedEvent.request?.cookies) {
      delete sanitizedEvent.request.cookies;
    }

    // Mask sensitive fields
    if (sanitizedEvent.request?.headers) {
      sanitizedEvent.request.headers = this.maskSensitiveHeaders(
        sanitizedEvent.request.headers
      );
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
      Sentry.withScope((scope) => {
        if (context) {
          if (context.category) {
            scope.setTag('category', context.category);
          }
          if (context.priority) {
            scope.setTag('priority', context.priority);
          }
          if (context.tags) {
            context.tags.forEach(tag => scope.setTag(tag, true));
          }
          if (context.metadata) {
            scope.setExtras(context.metadata);
          }
        }

        Sentry.captureException(error);
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
    if (!this.isInitialized) return;

    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (e) {
      this.logger.error('Failed to set user:', e);
    }
  }

  public clearUser(): void {
    if (!this.isInitialized) return;
    
    try {
      Sentry.setUser(null);
    } catch (e) {
      this.logger.error('Failed to clear user:', e);
    }
  }

  public addBreadcrumb(
    message: string,
    category?: string,
    level?: Sentry.SeverityLevel
  ): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
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
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (e) {
      this.logger.error('Failed to set tag:', e);
    }
  }
}

export const errorTracker = ErrorTrackingService.getInstance();
