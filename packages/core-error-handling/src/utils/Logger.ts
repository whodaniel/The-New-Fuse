/**
 * Simple logger utility for core error handling
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

/**
 * Simple logger implementation
 */
export class Logger {
  private readonly component: string;
  private readonly minLevel: LogLevel;

  private static readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(component: string, minLevel: LogLevel = 'info') {
    this.component = component;
    this.minLevel = minLevel;
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (Logger.levelPriority[level] < Logger.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      data,
    };

    const logMessage = this.formatLogEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const component = entry.component.padEnd(20);

    let message = `${timestamp} [${level}] ${component} ${entry.message}`;

    if (entry.data) {
      message += ` ${JSON.stringify(entry.data)}`;
    }

    return message;
  }
}
