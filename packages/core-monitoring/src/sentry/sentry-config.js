'use strict';
/**
 * Sentry Configuration for Error Tracking
 * Provides centralized error tracking and performance monitoring
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.defaultSentryConfig = void 0;
exports.getSentryConfigFromEnv = getSentryConfigFromEnv;
exports.getCommonTags = getCommonTags;
exports.beforeSendFilter = beforeSendFilter;
exports.defaultSentryConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of profiling
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  sendDefaultPii: false,
  ignoreErrors: [
    // Browser errors we can't control
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    'Network request failed',
  ],
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
};
/**
 * Get Sentry configuration from environment variables
 */
function getSentryConfigFromEnv(serviceName) {
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    serviceName,
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
    ...exports.defaultSentryConfig,
  };
}
/**
 * Common tags for all Sentry events
 */
function getCommonTags() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}
/**
 * Filter sensitive data from Sentry events
 */
function beforeSendFilter(event, hint) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.cookie;
    delete event.request.headers['x-api-key'];
  }
  // Remove sensitive query params
  if (event.request?.query_string) {
    const sensitiveParams = ['token', 'apiKey', 'password', 'secret'];
    sensitiveParams.forEach((param) => {
      if (event.request.query_string.includes(param)) {
        event.request.query_string = event.request.query_string.replace(
          new RegExp(`${param}=[^&]*`, 'gi'),
          `${param}=[REDACTED]`
        );
      }
    });
  }
  // Remove sensitive data from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data?.password) {
        breadcrumb.data.password = '[REDACTED]';
      }
      if (breadcrumb.data?.token) {
        breadcrumb.data.token = '[REDACTED]';
      }
      return breadcrumb;
    });
  }
  return event;
}
//# sourceMappingURL=sentry-config.js.map
