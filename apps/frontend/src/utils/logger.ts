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

import { v4 as uuidv4 } from 'uuid';

// Browser-compatible simple hash function for log deduplication
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// Types and Interfaces
// ============================================================================

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
export class Logger {
  /** Logger name/category */
  private readonly name: string;

  /** Configuration */
  private readonly config: MonitoringConfig;

  /** Current log level */
  private readonly minLogLevel: number;

  /** Log level precedence */
  private readonly logLevelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  /** Request context storage */
  private requestContext: Map<string, any> = new Map();

  /** Performance timers */
  private timers: Map<string, number> = new Map();

  /**
   * Constructor
   *
   * @param name - Logger name/category
   * @param config - Configuration options
   */
  constructor(name: string, config: Partial<MonitoringConfig> = {}) {
    this.name = name;

    // Default configuration
    this.config = {
      logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFileLogging: process.env.NODE_ENV === 'production',
      maxLogFileSize: 100,
      maxLogFiles: 30,
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      redactFields: ['password', 'token', 'secret', 'apiKey', 'auth'],
      ...config,
    };

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
  debug(message: string, data?: Record<string, any>, error?: Error): void {
    this.log('debug', message, data, error);
  }

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
  info(message: string, data?: Record<string, any>, error?: Error): void {
    this.log('info', message, data, error);
  }

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
  warn(message: string, data?: Record<string, any>, error?: Error): void {
    this.log('warn', message, data, error);
  }

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
  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('error', message, data, error);
  }

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
  fatal(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('fatal', message, data, error);
  }

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
  startTimer(
    name: string,
    data?: Record<string, any>
  ): {
    end: (endData?: Record<string, any>) => void;
  } {
    const startTime = Date.now();
    this.timers.set(name, startTime);

    return {
      end: (endData?: Record<string, any>) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const timingData = {
          ...data,
          duration,
          timerName: name,
          startTime,
          endTime,
        };

        // Record performance metric
        if (this.config.enablePerformanceMonitoring) {
          this.recordMetric(`${this.name}.${name}`, duration, 'ms');
        }

        this.debug(`Timer completed: ${name}`, timingData);
      },
    };
  }

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
  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'custom',
    tags?: Record<string, string | number>
  ): void {
    if (!this.config.enablePerformanceMonitoring) {
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
      requestId: this.getRequestId(),
    };

    this.debug('Performance metric recorded', metric);

    // Send to external monitoring services
    this.sendToExternalServices('metric', metric);
  }

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
  withContext(key: string, value: any): Logger {
    this.requestContext.set(key, value);
    return this;
  }

  /**
   * Clear all context information
   *
   * @description
   * Removes all context information that was added using withContext().
   */
  clearContext(): void {
    this.requestContext.clear();
  }

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
  child(name: string, context?: Record<string, any>): Logger {
    const childLogger = new Logger(`${this.name}:${name}`, this.config);

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        childLogger.requestContext.set(key, value);
      });
    }

    return childLogger;
  }

  /**
   * Core logging method
   *
   * @private
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data
   * @param error - Error object
   */
  private log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error): void {
    // Check if log level should be processed
    if (this.logLevelOrder[level] < this.minLogLevel) {
      return;
    }

    // Create log entry
    const logEntry = this.createLogEntry(level, message, data, error);

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
  }

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
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): LogEntry {
    // Get caller information
    const stack = new Error().stack;
    const callerInfo = this.extractCallerInfo(stack);

    // Build log entry
    const logEntry: LogEntry = {
      id: uuidv4(),
      level,
      message,
      data: this.sanitizeData(data),
      error,
      timestamp: new Date(),
      source: callerInfo,
      context: this.buildContext(),
      environment: {
        name: (process.env.NODE_ENV as any) || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        region: process.env.AWS_REGION || 'unknown',
        deploymentId: process.env.DEPLOYMENT_ID || 'unknown',
      },
    };

    return logEntry;
  }

  /**
   * Extract caller information from stack trace
   *
   * @private
   * @param stack - Stack trace
   * @returns Caller information
   */
  private extractCallerInfo(stack?: string): LogEntry['source'] {
    if (!stack) {
      return {
        fileName: 'unknown',
        functionName: 'unknown',
        lineNumber: 0,
        columnNumber: 0,
      };
    }

    const lines = stack.split('\n');
    // Skip the first few lines (Error constructor, log method, etc.)
    const relevantLine = lines.find(
      (line) =>
        !line.includes('Logger.ts') && !line.includes('createLogEntry') && line.trim().length > 0
    );

    if (!relevantLine) {
      return {
        fileName: 'unknown',
        functionName: 'unknown',
        lineNumber: 0,
        columnNumber: 0,
      };
    }

    // Parse the line to extract information
    const match = relevantLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      return {
        fileName: match[2],
        functionName: match[1],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
      };
    }

    // Try alternative format
    const altMatch = relevantLine.match(/at (.+):(\d+):(\d+)/);
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
  }

  /**
   * Sanitize data to remove sensitive information
   *
   * @private
   * @param data - Data to sanitize
   * @returns Sanitized data
   */
  private sanitizeData(data?: Record<string, any>): Record<string, any> {
    if (!data) return {};

    const sanitized = { ...data };
    const redactFields = this.config.redactFields || [];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result = Array.isArray(obj) ? [] : {};

      Object.entries(obj).forEach(([key, value]) => {
        const shouldRedact = redactFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase())
        );

        if (shouldRedact) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      });

      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Build context information for the log entry
   *
   * @private
   * @returns Context information
   */
  private buildContext(): LogEntry['context'] {
    const context: LogEntry['context'] = {};

    // Add request context
    this.requestContext.forEach((value, key) => {
      context[key] = value;
    });

    // Add HTTP request context if available
    if (typeof window !== 'undefined') {
      // Browser environment
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
    }

    return context;
  }

  /**
   * Output log entry to console
   *
   * @private
   * @param logEntry - Log entry to output
   */
  private outputToConsole(logEntry: LogEntry): void {
    const { level, message, data, error, timestamp } = logEntry;
    const formattedTime = timestamp.toISOString();
    const prefix = `[${formattedTime}] [${level.toUpperCase()}] [${this.name}]`;

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
  }

  /**
   * Output log entry to file
   *
   * @private
   * @param logEntry - Log entry to output
   */
  private outputToFile(logEntry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just log that file logging would occur
    // In production, you might use Winston, Bunyan, or similar
    this.debug('Would write to file', { logEntry });
  }

  /**
   * Send data to external monitoring services
   *
   * @private
   * @param type - Data type ('log' or 'metric')
   * @param data - Data to send
   */
  private sendToExternalServices(type: 'log' | 'metric', data: any): void {
    const services = this.config.externalServices;
    if (!services) return;

    // Send to DataDog
    if (services.datadog?.enabled && process.env.DATADOG_API_KEY) {
      this.sendToDataDog(type, data);
    }

    // Send to Sentry
    if (services.sentry?.enabled && process.env.SENTRY_DSN) {
      this.sendToSentry(type, data);
    }

    // Send to New Relic
    if (services.newRelic?.enabled && process.env.NEW_RELIC_LICENSE_KEY) {
      this.sendToNewRelic(type, data);
    }
  }

  /**
   * Send data to DataDog
   *
   * @private
   * @param type - Data type
   * @param data - Data to send
   */
  private sendToDataDog(type: 'log' | 'metric', data: any): void {
    // Implementation would depend on DataDog API
    this.debug('Would send to DataDog', { type, data });
  }

  /**
   * Send data to Sentry
   *
   * @private
   * @param type - Data type
   * @param data - Data to send
   */
  private sendToSentry(type: 'log' | 'metric', data: any): void {
    // Implementation would depend on Sentry SDK
    this.debug('Would send to Sentry', { type, data });
  }

  /**
   * Send data to New Relic
   *
   * @private
   * @param type - Data type
   * @param data - Data to send
   */
  private sendToNewRelic(type: 'log' | 'metric', data: any): void {
    // Implementation would depend on New Relic SDK
    this.debug('Would send to New Relic', { type, data });
  }

  /**
   * Track errors with external error tracking services
   *
   * @private
   * @param logEntry - Log entry containing error information
   */
  private trackError(logEntry: LogEntry): void {
    if (!this.config.enableErrorTracking) {
      return;
    }

    const errorInfo: ErrorInfo = {
      errorId: logEntry.id,
      message: logEntry.message,
      stack: logEntry.error?.stack,
      type: logEntry.error?.constructor.name || 'Error',
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
  }

  /**
   * Get current request ID from context
   *
   * @private
   * @returns Current request ID
   */
  private getRequestId(): string | undefined {
    return this.requestContext.get('requestId');
  }

  /**
   * Initialize external monitoring services
   *
   * @private
   */
  private initializeExternalServices(): void {
    // Initialize DataDog
    if (this.config.externalServices?.datadog?.enabled) {
      // Initialize DataDog client
      this.debug('DataDog monitoring enabled');
    }

    // Initialize Sentry
    if (this.config.externalServices?.sentry?.enabled) {
      // Initialize Sentry client
      this.debug('Sentry error tracking enabled');
    }

    // Initialize New Relic
    if (this.config.externalServices?.newRelic?.enabled) {
      // Initialize New Relic client
      this.debug('New Relic monitoring enabled');
    }
  }
}

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
export const logger = new Logger('app', {
  logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
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
export function createError(message: string, context?: Record<string, any>, cause?: Error): Error {
  const error = new Error(message);
  (error as any).context = context;
  (error as any).cause = cause;
  (error as any).timestamp = new Date().toISOString();
  (error as any).errorId = uuidv4();
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
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
export function calculateLogHash(message: string, context?: Record<string, any>): string {
  const content = JSON.stringify({ message, context });
  return simpleHash(content);
}

// ============================================================================
// Export
// ============================================================================

export default logger;
export type { ErrorInfo, LogEntry, MonitoringConfig, PerformanceMetric };
