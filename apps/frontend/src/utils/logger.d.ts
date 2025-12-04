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
/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
/**
 * Log entry structure
 */
export interface LogEntry {
    /** Unique identifier for the log entry */
    id: string;
    /** Log level */
    level: LogLevel;
    /** Log message */
    message: string;
    /** Additional structured data */
    data?: Record<string, any>;
    /** Error object if applicable */
    error?: Error;
    /** Timestamp */
    timestamp: Date;
    /** Source information */
    source: {
        /** File name */
        fileName: string;
        /** Function name */
        functionName: string;
        /** Line number */
        lineNumber: number;
        /** Column number */
        columnNumber: number;
    };
    /** Request context */
    context?: {
        /** Request ID for correlation */
        requestId?: string;
        /** User ID if authenticated */
        userId?: string;
        /** Session ID */
        sessionId?: string;
        /** API endpoint */
        endpoint?: string;
        /** HTTP method */
        method?: string;
        /** Response status code */
        statusCode?: number;
        /** Request duration in milliseconds */
        duration?: number;
    };
    /** Environment information */
    environment: {
        /** Environment name */
        name: 'development' | 'staging' | 'production';
        /** Application version */
        version: string;
        /** Server region */
        region?: string;
        /** Deployment ID */
        deploymentId?: string;
    };
}
/**
 * Performance metrics structure
 */
export interface PerformanceMetric {
    /** Metric name */
    name: string;
    /** Metric value */
    value: number;
    /** Unit of measurement */
    unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'custom';
    /** Timestamp */
    timestamp: Date;
    /** Additional tags */
    tags?: Record<string, string | number>;
    /** Associated request ID */
    requestId?: string;
}
/**
 * Error tracking information
 */
export interface ErrorInfo {
    /** Error identifier */
    errorId: string;
    /** Error message */
    message: string;
    /** Error stack trace */
    stack?: string;
    /** Error type */
    type: string;
    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Additional context */
    context?: Record<string, any>;
    /** User information */
    user?: {
        id?: string;
        email?: string;
        role?: string;
    };
    /** Request information */
    request?: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: any;
        userAgent?: string;
        ip?: string;
    };
    /** Browser information (if applicable) */
    browser?: {
        name?: string;
        version?: string;
        os?: string;
    };
    /** Timestamp */
    timestamp: Date;
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    /** Minimum log level to record */
    logLevel: LogLevel;
    /** Whether to enable console output */
    enableConsole: boolean;
    /** Whether to enable file logging */
    enableFileLogging: boolean;
    /** Maximum log file size in MB */
    maxLogFileSize: number;
    /** Maximum number of log files to keep */
    maxLogFiles: number;
    /** Whether to enable performance monitoring */
    enablePerformanceMonitoring: boolean;
    /** Whether to enable error tracking */
    enableErrorTracking: boolean;
    /** External monitoring service configuration */
    externalServices?: {
        /** DataDog configuration */
        datadog?: {
            apiKey: string;
            serviceName: string;
            enabled: boolean;
        };
        /** Sentry configuration */
        sentry?: {
            dsn: string;
            environment: string;
            enabled: boolean;
        };
        /** New Relic configuration */
        newRelic?: {
            licenseKey: string;
            appName: string;
            enabled: boolean;
        };
    };
    /** Custom log format */
    customFormat?: string;
    /** Redact sensitive fields */
    redactFields?: string[];
}
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
export declare class Logger {
    /** Logger name/category */
    private readonly name;
    /** Configuration */
    private readonly config;
    /** Current log level */
    private readonly minLogLevel;
    /** Log level precedence */
    private readonly logLevelOrder;
    /** Request context storage */
    private requestContext;
    /** Performance timers */
    private timers;
    /**
     * Constructor
     *
     * @param name - Logger name/category
     * @param config - Configuration options
     */
    constructor(name: string, config?: Partial<MonitoringConfig>);
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
    debug(message: string, data?: Record<string, any>, error?: Error): void;
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
    info(message: string, data?: Record<string, any>, error?: Error): void;
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
    warn(message: string, data?: Record<string, any>, error?: Error): void;
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
    error(message: string, error?: Error, data?: Record<string, any>): void;
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
    fatal(message: string, error?: Error, data?: Record<string, any>): void;
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
    startTimer(name: string, data?: Record<string, any>): {
        end: (endData?: Record<string, any>) => void;
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
    recordMetric(name: string, value: number, unit?: PerformanceMetric['unit'], tags?: Record<string, string | number>): void;
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
    withContext(key: string, value: any): Logger;
    /**
     * Clear all context information
     *
     * @description
     * Removes all context information that was added using withContext().
     */
    clearContext(): void;
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
    child(name: string, context?: Record<string, any>): Logger;
    /**
     * Core logging method
     *
     * @private
     * @param level - Log level
     * @param message - Log message
     * @param data - Additional data
     * @param error - Error object
     */
    private log;
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
    private createLogEntry;
    /**
     * Extract caller information from stack trace
     *
     * @private
     * @param stack - Stack trace
     * @returns Caller information
     */
    private extractCallerInfo;
    /**
     * Sanitize data to remove sensitive information
     *
     * @private
     * @param data - Data to sanitize
     * @returns Sanitized data
     */
    private sanitizeData;
    /**
     * Build context information for the log entry
     *
     * @private
     * @returns Context information
     */
    private buildContext;
    /**
     * Output log entry to console
     *
     * @private
     * @param logEntry - Log entry to output
     */
    private outputToConsole;
    /**
     * Output log entry to file
     *
     * @private
     * @param logEntry - Log entry to output
     */
    private outputToFile;
    /**
     * Send data to external monitoring services
     *
     * @private
     * @param type - Data type ('log' or 'metric')
     * @param data - Data to send
     */
    private sendToExternalServices;
    /**
     * Send data to DataDog
     *
     * @private
     * @param type - Data type
     * @param data - Data to send
     */
    private sendToDataDog;
    /**
     * Send data to Sentry
     *
     * @private
     * @param type - Data type
     * @param data - Data to send
     */
    private sendToSentry;
    /**
     * Send data to New Relic
     *
     * @private
     * @param type - Data type
     * @param data - Data to send
     */
    private sendToNewRelic;
    /**
     * Track errors with external error tracking services
     *
     * @private
     * @param logEntry - Log entry containing error information
     */
    private trackError;
    /**
     * Get current request ID from context
     *
     * @private
     * @returns Current request ID
     */
    private getRequestId;
    /**
     * Initialize external monitoring services
     *
     * @private
     */
    private initializeExternalServices;
}
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
export declare const logger: Logger;
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
export declare function createError(message: string, context?: Record<string, any>, cause?: Error): Error;
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
export declare function generateRequestId(): string;
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
export declare function calculateLogHash(message: string, context?: Record<string, any>): string;
export default logger;
export type { LogEntry, PerformanceMetric, ErrorInfo, MonitoringConfig, };
