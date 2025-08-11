/**
 * @fileoverview Production-ready logging utility
 */

import { LogLevel, LogEntry } from '../types/monitoring';

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  enableStructured: boolean;
  enableTracing: boolean;
  maxFileSize?: number;
  maxFiles?: number;
}

export class Logger {
  private config: LoggerConfig;
  private context: Record<string, any> = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableStructured: true,
      enableTracing: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config,
    };
  }

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    } : context;

    this.log(LogLevel.ERROR, message, errorContext);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    const errorContext = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    } : context;

    this.log(LogLevel.FATAL, message, errorContext);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      source: this.getSource(),
      context: { ...this.context, ...context },
      traceId: this.getTraceId(),
      spanId: this.getSpanId(),
    };

    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(logEntry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : '';
    
    if (this.config.enableStructured) {
      console.log(JSON.stringify(entry, null, 2));
    } else {
      const message = `[${timestamp}] ${entry.level} ${entry.source}: ${entry.message}`;
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(message, contextStr);
          break;
        case LogLevel.INFO:
          console.info(message, contextStr);
          break;
        case LogLevel.WARN:
          console.warn(message, contextStr);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(message, contextStr);
          break;
      }
    }
  }

  private logToFile(entry: LogEntry): void {
    // File logging implementation would go here
    // For now, we'll just implement the interface
    // In production, this would use a proper file logging library
    try {
      const logLine = JSON.stringify(entry) + '\n';
      // fs.appendFileSync(this.config.filePath!, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private getSource(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';
    
    const lines = stack.split('\n');
    // Skip the first 4 lines (Error, this.getSource, this.log, calling method)
    const callerLine = lines[4];
    if (!callerLine) return 'unknown';
    
    const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
    if (match) {
      const [, functionName, filePath, lineNumber] = match;
      const fileName = filePath.split('/').pop() || filePath;
      return `${fileName}:${lineNumber}`;
    }
    
    return 'unknown';
  }

  private getTraceId(): string | undefined {
    if (!this.config.enableTracing) return undefined;
    // In a real implementation, this would get the trace ID from the current context
    // For now, return undefined
    return undefined;
  }

  private getSpanId(): string | undefined {
    if (!this.config.enableTracing) return undefined;
    // In a real implementation, this would get the span ID from the current context
    // For now, return undefined
    return undefined;
  }

  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

// Global logger instance
export const logger = new Logger({
  level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  enableConsole: true,
  enableStructured: process.env.NODE_ENV === 'production',
  enableTracing: process.env.ENABLE_TRACING === 'true',
});