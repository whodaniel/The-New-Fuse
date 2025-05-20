import { injectable } from 'inversify';
import winston, { Logger as WinstonLogger, createLogger, format, transports } from 'winston';

export interface LogMetadata {
  timestamp?: string;
  level?: string;
  service?: string;
  [key: string]: unknown;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

@injectable()
export class LoggingService {
  private logger: WinstonLogger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      transports: [new transports.Console()]
    });
  }

  error(message: string, metadata?: LogMetadata): void {
    this.logger.log('error', message, metadata);
  }
  warn(message: string, metadata?: LogMetadata): void {
    this.logger.log('warn', message, metadata);
  }
  info(message: string, metadata?: LogMetadata): void {
    this.logger.log('info', message, metadata);
  }
  debug(message: string, metadata?: LogMetadata): void {
    this.logger.log('debug', message, metadata);
  }

  createLogger(service: string): LoggingService {
    // For compatibility, just return this instance
    return this;
  }
}

export type Logger = LoggingService;
