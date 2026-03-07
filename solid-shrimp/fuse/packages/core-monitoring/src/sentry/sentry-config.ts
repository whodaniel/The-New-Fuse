/**
 * Sentry Configuration for Error Tracking
 * Provides centralized error tracking and performance monitoring
 */

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  serviceName: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  enabled?: boolean;
  debug?: boolean;
  integrations?: any[];
  beforeSend?: (event: any, hint: any) => any | null;
  beforeBreadcrumb?: (breadcrumb: any, hint: any) => any | null;
  ignoreErrors?: Array<string | RegExp>;
  denyUrls?: Array<string | RegExp>;
  allowUrls?: Array<string | RegExp>;
  maxBreadcrumbs?: number;
  attachStacktrace?: boolean;
  sendDefaultPii?: boolean;
  serverName?: string;
  initialScope?: any;
}

export const defaultSentryConfig: Partial<SentryConfig> = {
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
export function getSentryConfigFromEnv(serviceName: string): SentryConfig {
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: (process.env.NODE_ENV as any) || 'development',
    serviceName,
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
    ...defaultSentryConfig,
  };
}

/**
 * Common tags for all Sentry events
 */
export function getCommonTags() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

/**
 * Filter sensitive data from Sentry events
 */
export function beforeSendFilter(event: any, hint: any): any | null {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.cookie;
    delete event.request.headers['x-api-key'];
  }

  // Remove sensitive query params
  if (event.request?.query_string) {
    const sensitiveParams = ['token', 'apiKey', 'password', 'secret'];
    sensitiveParams.forEach(param => {
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
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb: any) => {
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
