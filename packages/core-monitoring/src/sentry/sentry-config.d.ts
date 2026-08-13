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
export declare const defaultSentryConfig: Partial<SentryConfig>;
/**
 * Get Sentry configuration from environment variables
 */
export declare function getSentryConfigFromEnv(serviceName: string): SentryConfig;
/**
 * Common tags for all Sentry events
 */
export declare function getCommonTags(): {
    nodeVersion: string;
    platform: NodeJS.Platform;
    arch: NodeJS.Architecture;
};
/**
 * Filter sensitive data from Sentry events
 */
export declare function beforeSendFilter(event: any, hint: any): any | null;
//# sourceMappingURL=sentry-config.d.ts.map