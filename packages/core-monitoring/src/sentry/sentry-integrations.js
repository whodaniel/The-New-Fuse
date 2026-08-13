'use strict';
/**
 * Sentry Integrations for Backend Services
 * Provides NestJS and Express specific integrations
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.sentryService = exports.SentryService = void 0;
const events_1 = require('events');
/**
 * Sentry Service for capturing errors and events
 */
class SentryService extends events_1.EventEmitter {
  initialized = false;
  sentry;
  constructor() {
    super();
  }
  /**
   * Initialize Sentry with configuration
   */
  async initialize(config) {
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
  captureException(error, context) {
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
  captureMessage(message, level = 'info', context) {
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
  addBreadcrumb(breadcrumb) {
    if (!this.initialized || !this.sentry) {
      return;
    }
    this.sentry.addBreadcrumb(breadcrumb);
  }
  /**
   * Set user context
   */
  setUser(user) {
    if (!this.initialized || !this.sentry) {
      return;
    }
    this.sentry.setUser(user);
  }
  /**
   * Set tag
   */
  setTag(key, value) {
    if (!this.initialized || !this.sentry) {
      return;
    }
    this.sentry.setTag(key, value);
  }
  /**
   * Set context
   */
  setContext(name, context) {
    if (!this.initialized || !this.sentry) {
      return;
    }
    this.sentry.setContext(name, context);
  }
  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name, op) {
    if (!this.initialized || !this.sentry) {
      return null;
    }
    return this.sentry.startTransaction({ name, op });
  }
  /**
   * Flush events
   */
  async flush(timeout = 2000) {
    if (!this.initialized || !this.sentry) {
      return true;
    }
    return this.sentry.flush(timeout);
  }
  /**
   * Close Sentry connection
   */
  async close(timeout = 2000) {
    if (!this.initialized || !this.sentry) {
      return true;
    }
    return this.sentry.close(timeout);
  }
}
exports.SentryService = SentryService;
/**
 * Global Sentry instance
 */
exports.sentryService = new SentryService();
//# sourceMappingURL=sentry-integrations.js.map
