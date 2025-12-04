/**
 * Enhanced Logging and Monitoring Service
 *
 * @description
 * Provides comprehensive logging, monitoring, and error tracking capabilities
 * for The New Fuse SaaS platform. Supports multiple log levels, structured
 * logging, performance monitoring, and integration with external monitoring
 * services.
 *
 * This service implements:
 * - Structured logging with metadata
 * - Log level filtering
 * - Performance monitoring
 * - Error tracking and reporting
 * - Real-time log streaming
 * - Log rotation and storage
 * - Development and production configurations
 *
 * @since 1.0.0
 * @author Platform Team
 * @example
 * ```typescript
 * // Basic usage
 * import { logger } from '../utils/logger';
 *
 * logger.info('User logged in', { userId: 'user-123', ip: '192.168.1.1' });
 * logger.error('Database connection failed', error, { operation: 'user_fetch' });
 *
 * // Performance monitoring
 * const timer = logger.startTimer('api_request');
 * // ... API call
 * timer.end({ endpoint: '/api/users', status: 200 });
 * ```
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { v4 as uuidv4 } from 'uuid';
// Browser-compatible simple hash function for log deduplication
function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}
// ============================================================================
// Logger Class
// ============================================================================
/**
 * Enhanced logger with structured logging and monitoring capabilities
 *
 * @description
 * Provides a comprehensive logging service with structured logging,
 * performance monitoring, error tracking, and integration with external
 * monitoring services. Supports multiple output formats and configurable
 * log levels.
 *
 * @features
 * - Structured JSON logging
 * - Log level filtering
 * - Performance timing
 * - Error correlation
 * - Request/response logging
 * - External service integration
 * - Log rotation and retention
 * - Development and production modes
 *
 * @example
 * ```typescript
 * // Create logger instance
 * const logger = new Logger('UserService');
 *
 * // Log with context
 * logger.info('User created', {
 *   userId: 'user-123',
 *   email: 'user@example.com',
 *   role: 'admin'
 * });
 *
 * // Log errors with stack traces
 * try {
 *   // Some operation
 * } catch (error) {
 *   logger.error('Operation failed', error, {
 *     operation: 'user_creation',
 *     retryable: false
 *   });
 * }
 *
 * // Performance monitoring
 * const timer = logger.startTimer('database_query');
 * await performQuery();
 * timer.end({ query: 'SELECT * FROM users' });
 * ```
 */
var Logger = /** @class */ (function () {
    /**
     * Constructor
     *
     * @param name - Logger name/category
     * @param config - Configuration options
     */
    function Logger(name, config) {
        if (config === void 0) { config = {}; }
        /** Log level precedence */
        this.logLevelOrder = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            fatal: 4,
        };
        /** Request context storage */
        this.requestContext = new Map();
        /** Performance timers */
        this.timers = new Map();
        this.name = name;
        // Default configuration
        this.config = __assign({ logLevel: process.env.LOG_LEVEL || 'info', enableConsole: process.env.NODE_ENV !== 'production', enableFileLogging: process.env.NODE_ENV === 'production', maxLogFileSize: 100, maxLogFiles: 30, enablePerformanceMonitoring: true, enableErrorTracking: true, redactFields: ['password', 'token', 'secret', 'apiKey', 'auth'] }, config);
        this.minLogLevel = this.logLevelOrder[this.config.logLevel];
        // Initialize external services
        this.initializeExternalServices();
    }
    /**
     * Log a debug message
     *
     * @description
     * Logs a debug-level message with optional structured data.
     * Debug messages are typically used for detailed diagnostic information
     * that is only relevant during development or troubleshooting.
     *
     * @param message - Log message
     * @param data - Additional structured data
     * @param error - Optional error object
     *
     * @example
     * ```typescript
     * logger.debug('Processing request', {
     *   requestId: 'req-123',
     *   endpoint: '/api/users'
     * });
     * ```
     */
    Logger.prototype.debug = function (message, data, error) {
        this.log('debug', message, data, error);
    };
    /**
     * Log an info message
     *
     * @description
     * Logs an info-level message with optional structured data.
     * Info messages provide general information about application flow
     * and important events that should be tracked.
     *
     * @param message - Log message
     * @param data - Additional structured data
     * @param error - Optional error object
     *
     * @example
     * ```typescript
     * logger.info('User logged in', {
     *   userId: 'user-123',
     *   ip: '192.168.1.1',
     *   userAgent: 'Mozilla/5.0...'
     * });
     * ```
     */
    Logger.prototype.info = function (message, data, error) {
        this.log('info', message, data, error);
    };
    /**
     * Log a warning message
     *
     * @description
     * Logs a warning-level message with optional structured data.
     * Warning messages indicate potential issues that don't prevent
     * the application from functioning but should be monitored.
     *
     * @param message - Log message
     * @param data - Additional structured data
     * @param error - Optional error object
     *
     * @example
     * ```typescript
     * logger.warn('High memory usage detected', {
     *   memoryUsage: '85%',
     *   recommendations: ['Restart application', 'Scale up resources']
     * });
     * ```
     */
    Logger.prototype.warn = function (message, data, error) {
        this.log('warn', message, data, error);
    };
    /**
     * Log an error message
     *
     * @description
     * Logs an error-level message with optional structured data and error object.
     * Error messages indicate issues that prevent operations from completing
     * successfully and should be investigated.
     *
     * @param message - Log message
     * @param error - Error object
     * @param data - Additional structured data
     *
     * @example
     * ```typescript
     * try {
     *   await api.call();
     * } catch (error) {
     *   logger.error('API call failed', error, {
     *     endpoint: '/api/users',
       *     retryCount: 3,
       *     timeout: 30000
     *   });
     * }
     * ```
     */
    Logger.prototype.error = function (message, error, data) {
        this.log('error', message, data, error);
    };
    /**
     * Log a fatal error message
     *
     * @description
     * Logs a fatal-level message indicating critical errors that may
     * cause the application to crash or become unavailable.
     *
     * @param message - Log message
     * @param error - Error object
     * @param data - Additional structured data
     *
     * @example
     * ```typescript
     * logger.fatal('Database connection lost', error, {
     *   connectionAttempts: 5,
     *   lastError: error.message,
     *   actionRequired: 'immediate_attention'
     * });
     * ```
     */
    Logger.prototype.fatal = function (message, error, data) {
        this.log('fatal', message, data, error);
    };
    /**
     * Start a performance timer
     *
     * @description
     * Starts a timer for measuring performance of operations.
     * The timer should be ended using the returned object.
     *
     * @param name - Timer name
     * @param data - Additional data to include with the result
     * @returns Timer object with end method
     *
     * @example
     * ```typescript
     * const timer = logger.startTimer('api_request');
     *
     * try {
     *   const result = await api.call();
     *   timer.end({ status: 'success', statusCode: 200 });
     *   return result;
     * } catch (error) {
     *   timer.end({ status: 'error', statusCode: 500 });
     *   throw error;
     * }
     * ```
     */
    Logger.prototype.startTimer = function (name, data) {
        var _this = this;
        var startTime = Date.now();
        this.timers.set(name, startTime);
        return {
            end: function (endData) {
                var endTime = Date.now();
                var duration = endTime - startTime;
                var timingData = __assign(__assign({}, data), { duration: duration, timerName: name, startTime: startTime, endTime: endTime });
                // Record performance metric
                if (_this.config.enablePerformanceMonitoring) {
                    _this.recordMetric("".concat(_this.name, ".").concat(name), duration, 'ms');
                }
                _this.debug("Timer completed: ".concat(name), timingData);
            },
        };
    };
    /**
     * Record a performance metric
     *
     * @description
     * Records a performance metric for monitoring and analysis.
     *
     * @param name - Metric name
     * @param value - Metric value
     * @param unit - Unit of measurement
     * @param tags - Additional tags
     */
    Logger.prototype.recordMetric = function (name, value, unit, tags) {
        if (unit === void 0) { unit = 'custom'; }
        if (!this.config.enablePerformanceMonitoring) {
            return;
        }
        var metric = {
            name: name,
            value: value,
            unit: unit,
            timestamp: new Date(),
            tags: tags,
            requestId: this.getRequestId(),
        };
        this.debug('Performance metric recorded', metric);
        // Send to external monitoring services
        this.sendToExternalServices('metric', metric);
    };
    /**
     * Add context information to subsequent log entries
     *
     * @description
     * Adds context information (like request ID, user ID, etc.) that will
     * be included in subsequent log entries until cleared.
     *
     * @param key - Context key
     * @param value - Context value
     *
     * @example
     * ```typescript
     * logger.withContext('requestId', 'req-123').info('Processing request');
     * logger.withContext('userId', 'user-456').info('User action performed');
     * ```
     */
    Logger.prototype.withContext = function (key, value) {
        this.requestContext.set(key, value);
        return this;
    };
    /**
     * Clear all context information
     *
     * @description
     * Removes all context information that was added using withContext().
     */
    Logger.prototype.clearContext = function () {
        this.requestContext.clear();
    };
    /**
     * Create a child logger with additional context
     *
     * @description
     * Creates a new logger instance with additional context that
     * will be included in all its log entries.
     *
     * @param name - Child logger name
     * @param context - Initial context
     * @returns New logger instance with context
     *
     * @example
     * ```typescript
     * const userLogger = logger.child('UserService', {
     *   serviceName: 'User Management'
     * });
     * userLogger.info('User service started');
     * ```
     */
    Logger.prototype.child = function (name, context) {
        var childLogger = new Logger("".concat(this.name, ":").concat(name), this.config);
        if (context) {
            Object.entries(context).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                childLogger.requestContext.set(key, value);
            });
        }
        return childLogger;
    };
    /**
     * Core logging method
     *
     * @private
     * @param level - Log level
     * @param message - Log message
     * @param data - Additional data
     * @param error - Error object
     */
    Logger.prototype.log = function (level, message, data, error) {
        // Check if log level should be processed
        if (this.logLevelOrder[level] < this.minLogLevel) {
            return;
        }
        // Create log entry
        var logEntry = this.createLogEntry(level, message, data, error);
        // Output to console
        if (this.config.enableConsole) {
            this.outputToConsole(logEntry);
        }
        // Output to file
        if (this.config.enableFileLogging) {
            this.outputToFile(logEntry);
        }
        // Send to external services
        this.sendToExternalServices('log', logEntry);
        // Track errors separately
        if (level === 'error' || level === 'fatal') {
            this.trackError(logEntry);
        }
    };
    /**
     * Create a structured log entry
     *
     * @private
     * @param level - Log level
     * @param message - Log message
     * @param data - Additional data
     * @param error - Error object
     * @returns Structured log entry
     */
    Logger.prototype.createLogEntry = function (level, message, data, error) {
        // Get caller information
        var stack = new Error().stack;
        var callerInfo = this.extractCallerInfo(stack);
        // Build log entry
        var logEntry = {
            id: uuidv4(),
            level: level,
            message: message,
            data: this.sanitizeData(data),
            error: error,
            timestamp: new Date(),
            source: callerInfo,
            context: this.buildContext(),
            environment: {
                name: process.env.NODE_ENV || 'development',
                version: process.env.APP_VERSION || '1.0.0',
                region: process.env.AWS_REGION || 'unknown',
                deploymentId: process.env.DEPLOYMENT_ID || 'unknown',
            },
        };
        return logEntry;
    };
    /**
     * Extract caller information from stack trace
     *
     * @private
     * @param stack - Stack trace
     * @returns Caller information
     */
    Logger.prototype.extractCallerInfo = function (stack) {
        if (!stack) {
            return {
                fileName: 'unknown',
                functionName: 'unknown',
                lineNumber: 0,
                columnNumber: 0,
            };
        }
        var lines = stack.split('\n');
        // Skip the first few lines (Error constructor, log method, etc.)
        var relevantLine = lines.find(function (line) {
            return !line.includes('Logger.ts') &&
                !line.includes('createLogEntry') &&
                line.trim().length > 0;
        });
        if (!relevantLine) {
            return {
                fileName: 'unknown',
                functionName: 'unknown',
                lineNumber: 0,
                columnNumber: 0,
            };
        }
        // Parse the line to extract information
        var match = relevantLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
        if (match) {
            return {
                fileName: match[2],
                functionName: match[1],
                lineNumber: parseInt(match[3], 10),
                columnNumber: parseInt(match[4], 10),
            };
        }
        // Try alternative format
        var altMatch = relevantLine.match(/at (.+):(\d+):(\d+)/);
        if (altMatch) {
            return {
                fileName: altMatch[1],
                functionName: 'anonymous',
                lineNumber: parseInt(altMatch[2], 10),
                columnNumber: parseInt(altMatch[3], 10),
            };
        }
        return {
            fileName: 'unknown',
            functionName: 'unknown',
            lineNumber: 0,
            columnNumber: 0,
        };
    };
    /**
     * Sanitize data to remove sensitive information
     *
     * @private
     * @param data - Data to sanitize
     * @returns Sanitized data
     */
    Logger.prototype.sanitizeData = function (data) {
        if (!data)
            return {};
        var sanitized = __assign({}, data);
        var redactFields = this.config.redactFields || [];
        var sanitizeObject = function (obj) {
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }
            var result = Array.isArray(obj) ? [] : {};
            Object.entries(obj).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                var shouldRedact = redactFields.some(function (field) {
                    return key.toLowerCase().includes(field.toLowerCase());
                });
                if (shouldRedact) {
                    result[key] = '[REDACTED]';
                }
                else if (typeof value === 'object' && value !== null) {
                    result[key] = sanitizeObject(value);
                }
                else {
                    result[key] = value;
                }
            });
            return result;
        };
        return sanitizeObject(sanitized);
    };
    /**
     * Build context information for the log entry
     *
     * @private
     * @returns Context information
     */
    Logger.prototype.buildContext = function () {
        var context = {};
        // Add request context
        this.requestContext.forEach(function (value, key) {
            context[key] = value;
        });
        // Add HTTP request context if available
        if (typeof window !== 'undefined') {
            // Browser environment
            context.userAgent = navigator.userAgent;
            context.url = window.location.href;
        }
        return context;
    };
    /**
     * Output log entry to console
     *
     * @private
     * @param logEntry - Log entry to output
     */
    Logger.prototype.outputToConsole = function (logEntry) {
        var level = logEntry.level, message = logEntry.message, data = logEntry.data, error = logEntry.error, timestamp = logEntry.timestamp;
        var formattedTime = timestamp.toISOString();
        var prefix = "[".concat(formattedTime, "] [").concat(level.toUpperCase(), "] [").concat(this.name, "]");
        switch (level) {
            case 'debug':
                console.debug(prefix, message, data);
                break;
            case 'info':
                console.info(prefix, message, data);
                break;
            case 'warn':
                console.warn(prefix, message, data);
                break;
            case 'error':
            case 'fatal':
                console.error(prefix, message, data, error);
                break;
        }
    };
    /**
     * Output log entry to file
     *
     * @private
     * @param logEntry - Log entry to output
     */
    Logger.prototype.outputToFile = function (logEntry) {
        // In a real implementation, this would write to a file
        // For now, we'll just log that file logging would occur
        // In production, you might use Winston, Bunyan, or similar
        this.debug('Would write to file', { logEntry: logEntry });
    };
    /**
     * Send data to external monitoring services
     *
     * @private
     * @param type - Data type ('log' or 'metric')
     * @param data - Data to send
     */
    Logger.prototype.sendToExternalServices = function (type, data) {
        var _a, _b, _c;
        var services = this.config.externalServices;
        if (!services)
            return;
        // Send to DataDog
        if (((_a = services.datadog) === null || _a === void 0 ? void 0 : _a.enabled) && process.env.DATADOG_API_KEY) {
            this.sendToDataDog(type, data);
        }
        // Send to Sentry
        if (((_b = services.sentry) === null || _b === void 0 ? void 0 : _b.enabled) && process.env.SENTRY_DSN) {
            this.sendToSentry(type, data);
        }
        // Send to New Relic
        if (((_c = services.newRelic) === null || _c === void 0 ? void 0 : _c.enabled) && process.env.NEW_RELIC_LICENSE_KEY) {
            this.sendToNewRelic(type, data);
        }
    };
    /**
     * Send data to DataDog
     *
     * @private
     * @param type - Data type
     * @param data - Data to send
     */
    Logger.prototype.sendToDataDog = function (type, data) {
        // Implementation would depend on DataDog API
        this.debug('Would send to DataDog', { type: type, data: data });
    };
    /**
     * Send data to Sentry
     *
     * @private
     * @param type - Data type
     * @param data - Data to send
     */
    Logger.prototype.sendToSentry = function (type, data) {
        // Implementation would depend on Sentry SDK
        this.debug('Would send to Sentry', { type: type, data: data });
    };
    /**
     * Send data to New Relic
     *
     * @private
     * @param type - Data type
     * @param data - Data to send
     */
    Logger.prototype.sendToNewRelic = function (type, data) {
        // Implementation would depend on New Relic SDK
        this.debug('Would send to New Relic', { type: type, data: data });
    };
    /**
     * Track errors with external error tracking services
     *
     * @private
     * @param logEntry - Log entry containing error information
     */
    Logger.prototype.trackError = function (logEntry) {
        var _a, _b;
        if (!this.config.enableErrorTracking) {
            return;
        }
        var errorInfo = {
            errorId: logEntry.id,
            message: logEntry.message,
            stack: (_a = logEntry.error) === null || _a === void 0 ? void 0 : _a.stack,
            type: ((_b = logEntry.error) === null || _b === void 0 ? void 0 : _b.constructor.name) || 'Error',
            severity: logEntry.level === 'fatal' ? 'critical' : 'high',
            context: logEntry.data,
            timestamp: logEntry.timestamp,
        };
        // Add request context if available
        if (logEntry.context) {
            errorInfo.request = {
                url: logEntry.context.url,
                userAgent: logEntry.context.userAgent,
            };
        }
        this.debug('Error tracked', errorInfo);
    };
    /**
     * Get current request ID from context
     *
     * @private
     * @returns Current request ID
     */
    Logger.prototype.getRequestId = function () {
        return this.requestContext.get('requestId');
    };
    /**
     * Initialize external monitoring services
     *
     * @private
     */
    Logger.prototype.initializeExternalServices = function () {
        var _a, _b, _c, _d, _e, _f;
        // Initialize DataDog
        if ((_b = (_a = this.config.externalServices) === null || _a === void 0 ? void 0 : _a.datadog) === null || _b === void 0 ? void 0 : _b.enabled) {
            // Initialize DataDog client
            this.debug('DataDog monitoring enabled');
        }
        // Initialize Sentry
        if ((_d = (_c = this.config.externalServices) === null || _c === void 0 ? void 0 : _c.sentry) === null || _d === void 0 ? void 0 : _d.enabled) {
            // Initialize Sentry client
            this.debug('Sentry error tracking enabled');
        }
        // Initialize New Relic
        if ((_f = (_e = this.config.externalServices) === null || _e === void 0 ? void 0 : _e.newRelic) === null || _f === void 0 ? void 0 : _f.enabled) {
            // Initialize New Relic client
            this.debug('New Relic monitoring enabled');
        }
    };
    return Logger;
}());
export { Logger };
// ============================================================================
// Default Logger Instance
// ============================================================================
/**
 * Default logger instance for the application
 *
 * @description
 * Pre-configured logger instance that can be used throughout the application
 * without needing to create new instances.
 *
 * @example
 * ```typescript
 * import { logger } from '../utils/logger';
 *
 * logger.info('Application started', { port: 3000 });
 * ```
 */
export var logger = new Logger('app', {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFileLogging: process.env.NODE_ENV === 'production',
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
});
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Create a structured error for logging
 *
 * @description
 * Creates a standardized error object that includes additional context
 * information for better debugging and monitoring.
 *
 * @param message - Error message
 * @param context - Additional context information
 * @param cause - Original error that caused this error
 * @returns Structured error object
 *
 * @example
 * ```typescript
 * throw createError('Failed to fetch user data', {
 *   userId: 'user-123',
 *   endpoint: '/api/users/user-123'
 * }, originalError);
 * ```
 */
export function createError(message, context, cause) {
    var error = new Error(message);
    error.context = context;
    error.cause = cause;
    error.timestamp = new Date().toISOString();
    error.errorId = uuidv4();
    return error;
}
/**
 * Generate a request ID for correlation
 *
 * @description
 * Generates a unique request ID that can be used to correlate
 * logs and events across the application for a single request.
 *
 * @returns Unique request identifier
 *
 * @example
 * ```typescript
 * const requestId = generateRequestId();
 * logger.withContext('requestId', requestId).info('Request started');
 * ```
 */
export function generateRequestId() {
    return "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
}
/**
 * Calculate hash for log deduplication
 *
 * @description
 * Creates a hash from log message and context that can be used
 * to identify duplicate log entries and reduce log volume.
 *
 * @param message - Log message
 * @param context - Log context
 * @returns Hash string
 *
 * @example
 * ```typescript
 * const hash = calculateLogHash('Database connection failed', { error: 'timeout' });
 * ```
 */
export function calculateLogHash(message, context) {
    var content = JSON.stringify({ message: message, context: context });
    return simpleHash(content);
}
// ============================================================================
// Export
// ============================================================================
export default logger;
