/**
 * Simple Logger wrapper for the agent package
 * Provides a consistent logging interface with context support
 */

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

export class Logger {
  private context: string;
  private level: number;

  constructor(context: string = 'Agent') {
    this.context = context;
    this.level = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): number {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR':
        return LOG_LEVELS.ERROR;
      case 'WARN':
        return LOG_LEVELS.WARN;
      case 'INFO':
        return LOG_LEVELS.INFO;
      case 'DEBUG':
        return LOG_LEVELS.DEBUG;
      default:
        return LOG_LEVELS.INFO;
    }
  }

  private formatMessage(
    level: string,
    message: string,
    errorOrContext?: Error | Record<string, any>,
    context?: Record<string, any>,
  ): string {
    const timestamp = new Date().toISOString();

    let errorStr = '';
    let contextStr = '';

    if (errorOrContext instanceof Error) {
      errorStr = ` - Error: ${errorOrContext.message}`;
      contextStr = context ? ` ${JSON.stringify(context)}` : '';
    } else if (errorOrContext) {
      contextStr = ` ${JSON.stringify(errorOrContext)}`;
    }

    return `${timestamp} [${level}] [${this.context}]: ${message}${errorStr}${contextStr}`;
  }

  private shouldLog(level: number): boolean {
    return level <= this.level;
  }

  error(
    message: string,
    errorOrContext?: Error | Record<string, any>,
    context?: Record<string, any>,
  ): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage('ERROR', message, errorOrContext, context));
    }
  }

  warn(
    message: string,
    errorOrContext?: Error | Record<string, any>,
    context?: Record<string, any>,
  ): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage('WARN', message, errorOrContext, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  debug(
    message: string,
    errorOrContext?: Error | Record<string, any>,
    context?: Record<string, any>,
  ): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, errorOrContext, context));
    }
  }

  log(message: string, context?: Record<string, any>): void {
    this.info(message, context);
  }

  setContext(context: string): void {
    this.context = context;
  }

  getContext(): string {
    return this.context;
  }
}

// Default logger instance
export const logger = new Logger('Core');
