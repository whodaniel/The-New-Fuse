import { Injectable } from '@nestjs/common';
import { LoggingService as CoreLoggingService } from './loggingService.js';

interface LogMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

@Injectable()
export class LoggingService {
  private coreLogger: CoreLoggingService;

  constructor() {
    // Create a default configuration for the logger
    const config = {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json' as 'json' | 'simple',
      transports: {
        console: true,
        file: process.env.LOG_TO_FILE === 'true' ? {
          filename: process.env.LOG_FILE_PATH || 'logs/app.log',
          maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
          maxSize: process.env.LOG_MAX_SIZE || '10m'
        } : undefined
      }
    };

    this.coreLogger = new CoreLoggingService(config);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.coreLogger.info(message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.coreLogger.error(message, { ...metadata, error });
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.coreLogger.warn(message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.coreLogger.debug(message, metadata);
  }

  setContext(context: string): void {
    this.coreLogger.setContext(context);
  }
}
