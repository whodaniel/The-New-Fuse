/**
 * Simple Logger utility for MCP Core
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
}

export class Logger {
  private component: string;
  private logLevel: LogLevel;

  constructor(component: string = 'MCP', logLevel: LogLevel = 'info') {
    this.component = component;
    this.logLevel = logLevel;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      this.log('info', message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, data);
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      this.log('error', message, data);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      component: this.component,
    };

    const logMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${this.component}] ${message}`;

    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}
