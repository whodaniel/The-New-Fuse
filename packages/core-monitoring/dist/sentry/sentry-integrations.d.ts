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
export declare class SentryService extends EventEmitter {
    private initialized;
    private sentry;
    constructor();
    /**
     * Initialize Sentry with configuration
     */
    initialize(config: any): Promise<void>;
    /**
     * Capture an exception
     */
    captureException(error: Error, context?: ErrorContext): string | undefined;
    /**
     * Capture a message
     */
    captureMessage(message: string, level?: ErrorContext['level'], context?: ErrorContext): string | undefined;
    /**
     * Add breadcrumb
     */
    addBreadcrumb(breadcrumb: {
        message?: string;
        category?: string;
        level?: ErrorContext['level'];
        data?: Record<string, any>;
    }): void;
    /**
     * Set user context
     */
    setUser(user: ErrorContext['user'] | null): void;
    /**
     * Set tag
     */
    setTag(key: string, value: string): void;
    /**
     * Set context
     */
    setContext(name: string, context: Record<string, any>): void;
    /**
     * Start a transaction for performance monitoring
     */
    startTransaction(name: string, op: string): any;
    /**
     * Flush events
     */
    flush(timeout?: number): Promise<boolean>;
    /**
     * Close Sentry connection
     */
    close(timeout?: number): Promise<boolean>;
}
/**
 * Global Sentry instance
 */
export declare const sentryService: SentryService;
//# sourceMappingURL=sentry-integrations.d.ts.map