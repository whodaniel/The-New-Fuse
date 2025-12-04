import * as Sentry from '@sentry/browser';
import { ErrorPriority, ErrorCategory } from '../shared/types/errors';
interface ErrorContext {
    category?: ErrorCategory;
    priority?: ErrorPriority;
    userId?: string;
    metadata?: Record<string, any>;
    tags?: string[];
}
export declare class ErrorTrackingService {
    private static instance;
    private readonly errorService;
    private readonly logger;
    private isInitialized;
    private constructor();
    static getInstance(): ErrorTrackingService;
    private initializeSentry;
    private beforeSendCallback;
    private shouldIgnoreError;
    private sanitizeEventData;
    private maskSensitiveHeaders;
    private setupErrorSubscriptions;
    private setupGlobalHandlers;
    trackError(error: Error, context?: ErrorContext): void;
    setUser(user: {
        id: string;
        email?: string;
        role?: string;
    }): void;
    clearUser(): void;
    addBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel): void;
    setTag(key: string, value: string): void;
}
export declare const errorTracker: ErrorTrackingService;
export {};
