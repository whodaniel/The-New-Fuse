import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface LogOptions {
  filePath?: string;
  consoleOutput?: boolean;
  level?: LogLevel;
}

export class Logger extends EventEmitter {
  private filePath: string | null = null;
  private consoleOutput: boolean;
  private level: LogLevel;

  constructor(options?: LogOptions) {
    super();
    this.filePath = options?.filePath || null;
    this.consoleOutput = options?.consoleOutput ?? true;
    this.level = options?.level || LogLevel.INFO;

    if (this.filePath) {
      const logDir = path.dirname(this.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (this.consoleOutput) {
        console.log(logMessage, ...args);
      }

      if (this.filePath) {
        fs.appendFileSync(this.filePath, `${logMessage}\n`);
      }

      this.emit('log', { level, message: logMessage, args });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.TRACE, LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  fatal(message: string, ...args: any[]): void {
    this.log(LogLevel.FATAL, message, ...args);
  }
}

export const newLogger = (name: string, options?: LogOptions) => new Logger(options);
