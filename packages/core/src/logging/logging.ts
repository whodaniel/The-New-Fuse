import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

interface LogConfig {
  level: string;
  format: winston.Logform.Format;
  transports: winston.transport[];
}

const DEFAULT_CONFIG: LogConfig = {
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
};

export class LoggingService {
  private logger: winston.Logger;

  constructor(config: Partial<LogConfig> = {}) {
    this.logger = winston.createLogger({
      ...DEFAULT_CONFIG,
      ...config
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error): void {
    this.logger.error(message, error);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}

export const logger = new LoggingService();