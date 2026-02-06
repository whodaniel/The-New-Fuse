import { Injectable } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { ConfigService } from '../config/ConfigService';

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class LoggingService {
  private logger!: WinstonLogger;

  constructor(private configService: ConfigService) {
    this.initializeWinston();
  }

  private initializeWinston() {
    this.logger = createLogger({
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
        new transports.File({
          filename: 'error.log',
          level: 'error',
        }),
        new transports.File({
          filename: 'combined.log',
        }),
      ],
    });
  }

  async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<LogEntry> {
    this.logger.log(level, message, metadata);

    const logEntry: LogEntry = {
      id: this.generateId(),
      level,
      message,
      metadata,
      timestamp: new Date(),
    };
    return logEntry;
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<LogEntry> {
    return this.log('debug', message, metadata);
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<LogEntry> {
    return this.log('info', message, metadata);
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<LogEntry> {
    return this.log('warn', message, metadata);
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<LogEntry> {
    return this.log('error', message, metadata);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
