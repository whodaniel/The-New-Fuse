/**
 * Sentry Integrations for Backend Services
 * Provides NestJS and Express specific integrations
 */

import { EventEmitter } from 'events';

export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  fingerprint?: string[];
}

/**
 * Sentry Service for capturing errors and events
 */
export class SentryService extends EventEmitter {
  private initialized = false;
  private sentry: any;

  constructor() {
    super();
  }

  /**
   * Initialize Sentry with configuration
   */
  async initialize(config: any): Promise<void> {
    try {
      // Dynamically import Sentry to avoid issues when not installed
      const Sentry = await import('@sentry/node');
      this.sentry = Sentry;

      if (!config.dsn) {
        console.warn('Sentry DSN not provided, error tracking disabled');
        return;
      }

      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        tracesSampleRate: config.tracesSampleRate,
        profilesSampleRate: config.profilesSampleRate,
        debug: config.debug,
        // In Sentry v8+, default integrations are enabled automatically.
        // If custom integrations are provided via config, pass them through.
        // Otherwise, rely on defaults to avoid API differences.
        ...(config.integrations ? { integrations: config.integrations } : {}),
        beforeSend: config.beforeSend,
        beforeBreadcrumb: config.beforeBreadcrumb,
        ignoreErrors: config.ignoreErrors,
        denyUrls: config.denyUrls,
        allowUrls: config.allowUrls,
        maxBreadcrumbs: config.maxBreadcrumbs,
        attachStacktrace: config.attachStacktrace,
        sendDefaultPii: config.sendDefaultPii,
        serverName: config.serverName,
      });

      // Set common tags
      Sentry.setTag('service', config.serviceName);
      Sentry.setTag('nodeVersion', process.version);
      Sentry.setTag('platform', process.platform);

      this.initialized = true;
      this.emit('initialized');
      console.log(`Sentry initialized for ${config.serviceName}`);
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
      throw error;
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext): string | undefined {
    if (!this.initialized || !this.sentry) {
      console.error('Sentry not initialized, logging error:', error);
      return undefined;
    }

    return this.sentry.captureException(error, {
      user: context?.user,
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level,
      fingerprint: context?.fingerprint,
    });
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: ErrorContext['level'] = 'info',
    context?: ErrorContext
  ): string | undefined {
    if (!this.initialized || !this.sentry) {
      console.log(`Sentry not initialized, logging message [${level}]:`, message);
      return undefined;
    }

    return this.sentry.captureMessage(message, {
      level,
      user: context?.user,
      tags: context?.tags,
      extra: context?.extra,
      fingerprint: context?.fingerprint,
    });
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message?: string;
    category?: string;
    level?: ErrorContext['level'];
    data?: Record<string, any>;
  }): void {
    if (!this.initialized || !this.sentry) {
      return;
    }

    this.sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Set user context
   */
  setUser(user: ErrorContext['user'] | null): void {
    if (!this.initialized || !this.sentry) {
      return;
    }

    this.sentry.setUser(user);
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    if (!this.initialized || !this.sentry) {
      return;
    }

    this.sentry.setTag(key, value);
  }

  /**
   * Set context
   */
  setContext(name: string, context: Record<string, any>): void {
    if (!this.initialized || !this.sentry) {
      return;
    }

    this.sentry.setContext(name, context);
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): any {
    if (!this.initialized || !this.sentry) {
      return null;
    }

    return this.sentry.startTransaction({ name, op });
  }

  /**
   * Flush events
   */
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized || !this.sentry) {
      return true;
    }

    return this.sentry.flush(timeout);
  }

  /**
   * Close Sentry connection
   */
  async close(timeout = 2000): Promise<boolean> {
    if (!this.initialized || !this.sentry) {
      return true;
    }

    return this.sentry.close(timeout);
  }
}

/**
 * Global Sentry instance
 */
export const sentryService = new SentryService();
