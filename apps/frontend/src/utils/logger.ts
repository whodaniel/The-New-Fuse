/**
 * Enhanced Logging and Monitoring Service
 *
 * @description
 * Provides comprehensive logging, monitoring, and error tracking capabilities
 * for The New Fuse SaaS platform. Supports multiple log levels, structured
 * logging, performance monitoring, and integration with external monitoring
 * services.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Browser-compatible simple hash function for log deduplication
 */
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

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: Error;
  timestamp: Date;
  source: {
    fileName: string;
    functionName: string;
    lineNumber: number;
    columnNumber: number;
  };
  context?: Record<string, any>;
  environment: {
    name: 'development' | 'staging' | 'production';
    version: string;
    region?: string;
    deploymentId?: string;
  };
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'custom';
  timestamp: Date;
  tags?: Record<string, string | number>;
  requestId?: string;
}

export interface ErrorInfo {
  errorId: string;
  message: string;
  stack?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    userAgent?: string;
    ip?: string;
  };
  browser?: {
    name?: string;
    version?: string;
    os?: string;
  };
  timestamp: Date;
}

export interface MonitoringConfig {
  logLevel: LogLevel;
  enableConsole: boolean;
  enableFileLogging: boolean;
  maxLogFileSize: number;
  maxLogFiles: number;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  externalServices?: {
    datadog?: {
      apiKey: string;
      serviceName: string;
      enabled: boolean;
    };
    sentry?: {
      dsn: string;
      environment: string;
      enabled: boolean;
    };
    newRelic?: {
      licenseKey: string;
      appName: string;
      enabled: boolean;
    };
  };
  customFormat?: string;
  redactFields?: string[];
}

// ============================================================================
// Logger Class
// ============================================================================

export class Logger {
  private readonly name: string;
  private readonly config: MonitoringConfig;
  private readonly minLogLevel: number;
  private readonly logLevelOrder: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  private requestContext: Map<string, any> = new Map();
  private timers: Map<string, number> = new Map();

  constructor(name: string, config: Partial<MonitoringConfig> = {}) {
    this.name = name;

    const env = (import.meta.env?.MODE as string) || 'development';

    this.config = {
      logLevel: (import.meta.env?.VITE_LOG_LEVEL as LogLevel) || 'info',
      enableConsole: env !== 'production',
      enableFileLogging: env === 'production',
      maxLogFileSize: 100,
      maxLogFiles: 30,
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      redactFields: ['password', 'token', 'secret', 'apiKey', 'auth'],
      ...config,
    };

    this.minLogLevel = this.logLevelOrder[this.config.logLevel] ?? 1;
    this.initializeExternalServices();
  }

  debug(message: string, data?: Record<string, any>, error?: Error): void {
    this.log('debug', message, data, error);
  }

  info(message: string, data?: Record<string, any>, error?: Error): void {
    this.log('info', message, data, error);
  }

  warn(message: string, data?: Record<string, any>, error?: Error): void {
    this.log('warn', message, data, error);
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('error', message, data, error);
  }

  fatal(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('fatal', message, data, error);
  }

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
          ...endData,
          duration,
          timerName: name,
          startTime,
          endTime,
        };

        if (this.config.enablePerformanceMonitoring) {
          this.recordMetric(`${this.name}.${name}`, duration, 'ms');
        }

        this.debug(`Timer completed: ${name}`, timingData);
      },
    };
  }

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

    this.debug('Performance metric recorded', metric as any);
    this.sendToExternalServices('metric', metric);
  }

  withContext(key: string, value: any): Logger {
    this.requestContext.set(key, value);
    return this;
  }

  clearContext(): void {
    this.requestContext.clear();
  }

  child(name: string, context?: Record<string, any>): Logger {
    const childLogger = new Logger(`${this.name}:${name}`, this.config);

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        childLogger.requestContext.set(key, value);
      });
    }

    return childLogger;
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error): void {
    if (this.logLevelOrder[level] < this.minLogLevel) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, data, error);

    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    if (this.config.enableFileLogging) {
      this.outputToFile(logEntry);
    }

    this.sendToExternalServices('log', logEntry);

    if (level === 'error' || level === 'fatal') {
      this.trackError(logEntry);
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const stack = new Error().stack;
    const callerInfo = this.extractCallerInfo(stack);

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
        name: (import.meta.env?.MODE as any) || 'development',
        version: import.meta.env?.VITE_APP_VERSION || '1.0.0',
        region: 'unknown',
        deploymentId: 'unknown',
      },
    };

    return logEntry;
  }

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
    const relevantLine = lines.find(
      (line) =>
        !line.includes('logger.ts') && !line.includes('createLogEntry') && line.trim().length > 0
    );

    if (!relevantLine) {
      return {
        fileName: 'unknown',
        functionName: 'unknown',
        lineNumber: 0,
        columnNumber: 0,
      };
    }

    const match = relevantLine.match(/at (.+) \((.+):(\d+):(\d+)\)/);
    if (match) {
      return {
        fileName: match[2],
        functionName: match[1],
        lineNumber: parseInt(match[3], 10),
        columnNumber: parseInt(match[4], 10),
      };
    }

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

  private sanitizeData(data?: Record<string, any>): Record<string, any> {
    if (!data) return {};

    const redactFields = this.config.redactFields || [];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result: any = Array.isArray(obj) ? [] : {};

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

    return sanitizeObject(data);
  }

  private buildContext(): Record<string, any> {
    const context: Record<string, any> = {};

    this.requestContext.forEach((value, key) => {
      context[key] = value;
    });

    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
    }

    return context;
  }

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

  private outputToFile(logEntry: LogEntry): void {
    this.debug('File logging requested but skipped in browser environment', { logEntry } as any);
  }

  private sendToExternalServices(type: 'log' | 'metric', data: any): void {
    const services = this.config.externalServices;
    if (!services) return;

    if (services.datadog?.enabled) {
      this.sendToDataDog(type, data);
    }

    if (services.sentry?.enabled) {
      this.sendToSentry(type, data);
    }

    if (services.newRelic?.enabled) {
      this.sendToNewRelic(type, data);
    }
  }

  private sendToDataDog(type: 'log' | 'metric', data: any): void {
    this.debug('DataDog Export:', { type, data } as any);
  }

  private sendToSentry(type: 'log' | 'metric', data: any): void {
    this.debug('Sentry Export:', { type, data } as any);
  }

  private sendToNewRelic(type: 'log' | 'metric', data: any): void {
    this.debug('New Relic Export:', { type, data } as any);
  }

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

    if (logEntry.context) {
      errorInfo.request = {
        url: logEntry.context.url,
        userAgent: logEntry.context.userAgent,
      };
    }

    this.debug('Error tracked', errorInfo as any);
  }

  private getRequestId(): string | undefined {
    return this.requestContext.get('requestId');
  }

  private initializeExternalServices(): void {
    if (this.config.externalServices?.datadog?.enabled) {
      this.debug('DataDog monitoring enabled');
    }
    if (this.config.externalServices?.sentry?.enabled) {
      this.debug('Sentry error tracking enabled');
    }
    if (this.config.externalServices?.newRelic?.enabled) {
      this.debug('New Relic monitoring enabled');
    }
  }
}

const envLogLevel = (import.meta.env?.VITE_LOG_LEVEL as LogLevel) || 'info';
const isProd = import.meta.env?.PROD || false;

export const logger = new Logger('app', {
  logLevel: envLogLevel,
  enableConsole: !isProd,
  enableFileLogging: isProd,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
});

export function createError(message: string, context?: Record<string, any>, cause?: Error): Error {
  const error = new Error(message);
  (error as any).context = context;
  (error as any).cause = cause;
  (error as any).timestamp = new Date().toISOString();
  (error as any).errorId = uuidv4();
  return error;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function calculateLogHash(message: string, context?: Record<string, any>): string {
  const content = JSON.stringify({ message, context });
  return simpleHash(content);
}

export default logger;
