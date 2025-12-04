import { ErrorService } from '../core/services/ErrorService';
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import { ErrorCategory } from '../shared/types/errors';
import { Logger } from '../utils/logger';
var ErrorTrackingService = /** @class */ (function () {
    function ErrorTrackingService() {
        this.isInitialized = false;
        this.errorService = ErrorService.getInstance();
        this.logger = new Logger('ErrorTrackingService');
        this.initializeSentry();
        this.setupErrorSubscriptions();
        this.setupGlobalHandlers();
    }
    ErrorTrackingService.getInstance = function () {
        if (!ErrorTrackingService.instance) {
            ErrorTrackingService.instance = new ErrorTrackingService();
        }
        return ErrorTrackingService.instance;
    };
    ErrorTrackingService.prototype.initializeSentry = function () {
        var _this = this;
        try {
            var dsn = import.meta.env.VITE_SENTRY_DSN;
            if (!dsn) {
                this.logger.warn('Sentry DSN not configured');
                return;
            }
            Sentry.init({
                dsn: dsn,
                environment: import.meta.env.MODE,
                release: import.meta.env.VITE_APP_VERSION,
                integrations: [
                    new BrowserTracing({
                        tracingOrigins: ['localhost', 'your-production-domain.com'],
                    }),
                ],
                tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
                beforeSend: function (event) { return _this.beforeSendCallback(event); },
            });
            this.isInitialized = true;
            this.logger.info('Sentry initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Sentry:', error);
        }
    };
    ErrorTrackingService.prototype.beforeSendCallback = function (event) {
        // Filter out unnecessary errors
        if (this.shouldIgnoreError(event)) {
            return null;
        }
        // Sanitize sensitive data
        return this.sanitizeEventData(event);
    };
    ErrorTrackingService.prototype.shouldIgnoreError = function (event) {
        var ignoredMessages = [
            'ResizeObserver loop limit exceeded',
            'Network request failed',
            'Load failed',
        ];
        return ignoredMessages.some(function (msg) {
            var _a, _b, _c, _d, _e;
            return ((_a = event.message) === null || _a === void 0 ? void 0 : _a.includes(msg)) ||
                ((_e = (_d = (_c = (_b = event.exception) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e.includes(msg));
        });
    };
    ErrorTrackingService.prototype.sanitizeEventData = function (event) {
        var _a, _b;
        // Deep clone the event to avoid mutations
        var sanitizedEvent = JSON.parse(JSON.stringify(event));
        // Remove sensitive data
        if ((_a = sanitizedEvent.request) === null || _a === void 0 ? void 0 : _a.cookies) {
            delete sanitizedEvent.request.cookies;
        }
        // Mask sensitive fields
        if ((_b = sanitizedEvent.request) === null || _b === void 0 ? void 0 : _b.headers) {
            sanitizedEvent.request.headers = this.maskSensitiveHeaders(sanitizedEvent.request.headers);
        }
        return sanitizedEvent;
    };
    ErrorTrackingService.prototype.maskSensitiveHeaders = function (headers) {
        var sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token'];
        return Object.fromEntries(Object.entries(headers).map(function (_a) {
            var key = _a[0], value = _a[1];
            return [
                key,
                sensitiveHeaders.includes(key.toLowerCase()) ? '[REDACTED]' : value,
            ];
        }));
    };
    ErrorTrackingService.prototype.setupErrorSubscriptions = function () {
        var _this = this;
        this.errorService.subscribeToErrors(function (error, context) {
            _this.trackError(error, context);
        });
    };
    ErrorTrackingService.prototype.setupGlobalHandlers = function () {
        var _this = this;
        window.onerror = function (message, source, lineno, colno, error) {
            _this.trackError(error || new Error(String(message)), {
                category: ErrorCategory.RUNTIME,
                metadata: { source: source, lineno: lineno, colno: colno },
            });
        };
        window.onunhandledrejection = function (event) {
            _this.trackError(event.reason, {
                category: ErrorCategory.PROMISE_REJECTION,
            });
        };
    };
    ErrorTrackingService.prototype.trackError = function (error, context) {
        if (!this.isInitialized) {
            this.logger.warn('Sentry not initialized, logging error locally:', error);
            return;
        }
        try {
            Sentry.withScope(function (scope) {
                if (context) {
                    if (context.category) {
                        scope.setTag('category', context.category);
                    }
                    if (context.priority) {
                        scope.setTag('priority', context.priority);
                    }
                    if (context.tags) {
                        context.tags.forEach(function (tag) { return scope.setTag(tag, true); });
                    }
                    if (context.metadata) {
                        scope.setExtras(context.metadata);
                    }
                }
                Sentry.captureException(error);
            });
            // Log to local logger as well
            this.logger.error(error.message, {
                error: error,
                context: context,
                stack: error.stack,
            });
        }
        catch (e) {
            this.logger.error('Failed to track error:', e);
        }
    };
    ErrorTrackingService.prototype.setUser = function (user) {
        if (!this.isInitialized)
            return;
        try {
            Sentry.setUser({
                id: user.id,
                email: user.email,
                role: user.role,
            });
        }
        catch (e) {
            this.logger.error('Failed to set user:', e);
        }
    };
    ErrorTrackingService.prototype.clearUser = function () {
        if (!this.isInitialized)
            return;
        try {
            Sentry.setUser(null);
        }
        catch (e) {
            this.logger.error('Failed to clear user:', e);
        }
    };
    ErrorTrackingService.prototype.addBreadcrumb = function (message, category, level) {
        if (!this.isInitialized)
            return;
        try {
            Sentry.addBreadcrumb({
                message: message,
                category: category,
                level: level,
                timestamp: Date.now() / 1000,
            });
        }
        catch (e) {
            this.logger.error('Failed to add breadcrumb:', e);
        }
    };
    ErrorTrackingService.prototype.setTag = function (key, value) {
        if (!this.isInitialized)
            return;
        try {
            Sentry.setTag(key, value);
        }
        catch (e) {
            this.logger.error('Failed to set tag:', e);
        }
    };
    return ErrorTrackingService;
}());
export { ErrorTrackingService };
export var errorTracker = ErrorTrackingService.getInstance();
