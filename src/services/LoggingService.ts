export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  timestamp?: Date;
  correlationId?: string;
  [key: string]: unknown;
}

export class LoggingService {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context);
  }

  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const timestamp = context.timestamp || new Date();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context
    };

    // In a real implementation, this would use an appropriate logging backend
    const consoleMethodMap = {
      [LogLevel.INFO]: console.info,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error,
      [LogLevel.DEBUG]: console.debug,
    };

    const logFn = consoleMethodMap[level] || console.log;
    logFn(JSON.stringify(logEntry));
  }
}
