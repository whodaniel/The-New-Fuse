import { Injectable } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import * as Transport from 'winston-transport';

export interface LogMetadata {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

export interface LoggerConfig {
  level: string;
  format: 'json' | 'simple';
  transports: {
    console?: boolean;
    file?: {
      filename: string;
      maxFiles: number;
      maxSize: string;
    };
  };
}

@Injectable()
export class LoggingService {
  private logger: WinstonLogger;
  private defaultMetadata: LogMetadata = {};

  constructor(config: LoggerConfig) {
    this.logger = this.createLogger(config);
  }

  private createLogger(config: LoggerConfig): WinstonLogger {
    const logTransports: Transport[] = [];

    // Console transport
    if (config.transports.console) {
      logTransports.push(
        new transports.Console({
          format: config.format === 'json' 
            ? format.json()
            : format.simple()
        })
      );
    }

    // File transport
    if (config.transports.file) {
      logTransports.push(
        new transports.File({
          filename: config.transports.file.filename,
          maxFiles: config.transports.file.maxFiles,
          maxsize: parseInt(config.transports.file.maxSize),
          format: format.json()
        })
      );
    }

    return createLogger({
      level: config.level,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata()
      ),
      defaultMeta: this.defaultMetadata,
      transports: logTransports
    });
  }

  setDefaultMetadata(metadata: LogMetadata) {
    this.defaultMetadata = { ...this.defaultMetadata, ...metadata };
    this.logger.defaultMeta = this.defaultMetadata;
  }

  info(message: string, metadata?: LogMetadata) {
    this.logger.info(message, { metadata });
  }

  warn(message: string, metadata?: LogMetadata) {
    this.logger.warn(message, { metadata });
  }

  error(message: string, metadata?: LogMetadata) {
    this.logger.error(message, { metadata });
  }

  debug(message: string, metadata?: LogMetadata) {
    this.logger.debug(message, { metadata });
  }

  // Specialized logging methods
  logRequest(metadata: LogMetadata) {
    this.info('HTTP Request', {
      ...metadata,
      type: 'request'
    });
  }

  logError(error: Error, metadata?: LogMetadata) {
    this.error(error.message, {
      ...metadata,
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }

  logSecurity(event: string, metadata?: LogMetadata) {
    this.warn(event, {
      ...metadata,
      type: 'security'
    });
  }

  logPerformance(operation: string, duration: number, metadata?: LogMetadata) {
    this.info('Performance metric', {
      ...metadata,
      type: 'performance',
      operation,
      duration
    });
  }

  logAudit(action: string, metadata?: LogMetadata) {
    this.info('Audit event', {
      ...metadata,
      type: 'audit',
      action
    });
  }

  // Create child logger with additional default metadata
  child(metadata: LogMetadata): LoggingService {
    const childLogger = Object.create(this);
    childLogger.logger = this.logger.child(metadata);
    childLogger.defaultMetadata = { ...this.defaultMetadata, ...metadata };
    return childLogger;
  }
} 