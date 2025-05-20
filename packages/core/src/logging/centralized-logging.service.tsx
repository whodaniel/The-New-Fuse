import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { CorrelationIdManager } from '../utils/correlation-id.js';
import * as path from 'path';
import * as fs from 'fs';
import * as zlib from 'zlib';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface LoggingConfig {
  level: LogLevel;
  console: {
    enabled: boolean;
    level: LogLevel;
    colorize: boolean;
  };
  file: {
    enabled: boolean;
    level: LogLevel;
    directory: string;
    maxSize: string;
    maxFiles: number;
    compress: boolean;
  };
  elasticsearch: {
    enabled: boolean;
    level: LogLevel;
    node: string;
    indexPrefix: string;
    auth?: {
      username: string;
      password: string;
    };
  };
}

@Injectable()
export class CentralizedLoggingService implements OnModuleInit {
  private logger: winston.Logger;
  private config: LoggingConfig;
  private readonly defaultConfig: LoggingConfig = {
    level: LogLevel.INFO,
    console: {
      enabled: true,
      level: LogLevel.INFO,
      colorize: true
    },
    file: {
      enabled: true,
      level: LogLevel.INFO,
      directory: 'logs',
      maxSize: '10m',
      maxFiles: 14,
      compress: true
    },
    elasticsearch: {
      enabled: false,
      level: LogLevel.INFO,
      node: 'http://localhost:9200',
      indexPrefix: 'logs'
    }
  };

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Load configuration
    this.config = {
      level: this.configService.get<LogLevel>('logging.level', this.defaultConfig.level),
      console: {
        enabled: this.configService.get<boolean>('logging.console.enabled', this.defaultConfig.console.enabled),
        level: this.configService.get<LogLevel>('logging.console.level', this.defaultConfig.console.level),
        colorize: this.configService.get<boolean>('logging.console.colorize', this.defaultConfig.console.colorize)
      },
      file: {
        enabled: this.configService.get<boolean>('logging.file.enabled', this.defaultConfig.file.enabled),
        level: this.configService.get<LogLevel>('logging.file.level', this.defaultConfig.file.level),
        directory: this.configService.get<string>('logging.file.directory', this.defaultConfig.file.directory),
        maxSize: this.configService.get<string>('logging.file.maxSize', this.defaultConfig.file.maxSize),
        maxFiles: this.configService.get<number>('logging.file.maxFiles', this.defaultConfig.file.maxFiles),
        compress: this.configService.get<boolean>('logging.file.compress', this.defaultConfig.file.compress)
      },
      elasticsearch: {
        enabled: this.configService.get<boolean>('logging.elasticsearch.enabled', this.defaultConfig.elasticsearch.enabled),
        level: this.configService.get<LogLevel>('logging.elasticsearch.level', this.defaultConfig.elasticsearch.level),
        node: this.configService.get<string>('logging.elasticsearch.node', this.defaultConfig.elasticsearch.node),
        indexPrefix: this.configService.get<string>('logging.elasticsearch.indexPrefix', this.defaultConfig.elasticsearch.indexPrefix),
        auth: {
          username: this.configService.get<string>('logging.elasticsearch.auth.username', ''),
          password: this.configService.get<string>('logging.elasticsearch.auth.password', '')
        }
      }
    };

    // Initialize logger
    await this.initializeLogger();
  }

  /**
   * Log a message at the specified level
   */
  log(entry: LogEntry): void {
    const { level, message, context, correlationId, timestamp, metadata } = entry;
    
    this.logger.log({
      level,
      message,
      context,
      correlationId: correlationId || CorrelationIdManager.getCurrentId(),
      timestamp: timestamp || new Date(),
      ...metadata
    });
  }

  /**
   * Log an error message
   */
  error(message: string, options?: { error?: Error; context?: string; correlationId?: string; metadata?: Record<string, any> }): void {
    const { error, context, correlationId, metadata } = options || {};
    
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      context,
      correlationId,
      metadata: {
        ...metadata,
        stack: error?.stack,
        errorMessage: error?.message
      }
    };
    
    this.log(logEntry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, options?: { context?: string; correlationId?: string; metadata?: Record<string, any> }): void {
    const { context, correlationId, metadata } = options || {};
    
    this.log({
      level: LogLevel.WARN,
      message,
      context,
      correlationId,
      metadata
    });
  }

  /**
   * Log an info message
   */
  info(message: string, options?: { context?: string; correlationId?: string; metadata?: Record<string, any> }): void {
    const { context, correlationId, metadata } = options || {};
    
    this.log({
      level: LogLevel.INFO,
      message,
      context,
      correlationId,
      metadata
    });
  }

  /**
   * Log a debug message
   */
  debug(message: string, options?: { context?: string; correlationId?: string; metadata?: Record<string, any> }): void {
    const { context, correlationId, metadata } = options || {};
    
    this.log({
      level: LogLevel.DEBUG,
      message,
      context,
      correlationId,
      metadata
    });
  }

  /**
   * Log an HTTP request
   */
  http(message: string, options?: { method?: string; url?: string; statusCode?: number; responseTime?: number; context?: string; correlationId?: string; metadata?: Record<string, any> }): void {
    const { method, url, statusCode, responseTime, context, correlationId, metadata } = options || {};
    
    this.log({
      level: LogLevel.HTTP,
      message,
      context,
      correlationId,
      metadata: {
        ...metadata,
        http: {
          method,
          url,
          statusCode,
          responseTime
        }
      }
    });
  }

  /**
   * Create a child logger with a specific context
   */
  createLogger(context: string): {
    error: (message: string, options?: { error?: Error; correlationId?: string; metadata?: Record<string, any> }) => void;
    warn: (message: string, options?: { correlationId?: string; metadata?: Record<string, any> }) => void;
    info: (message: string, options?: { correlationId?: string; metadata?: Record<string, any> }) => void;
    debug: (message: string, options?: { correlationId?: string; metadata?: Record<string, any> }) => void;
    http: (message: string, options?: { method?: string; url?: string; statusCode?: number; responseTime?: number; correlationId?: string; metadata?: Record<string, any> }) => void;
  } {
    return {
      error: (message, options) => this.error(message, { ...options, context }),
      warn: (message, options) => this.warn(message, { ...options, context }),
      info: (message, options) => this.info(message, { ...options, context }),
      debug: (message, options) => this.debug(message, { ...options, context }),
      http: (message, options) => this.http(message, { ...options, context })
    };
  }

  /**
   * Private methods
   */

  private async initializeLogger(): Promise<void> {
    // Create transports array
    const transports: Transport[] = [];
    
    // Add console transport if enabled
    if (this.config.console.enabled) {
      transports.push(new winston.transports.Console({
        level: this.config.console.level,
        format: winston.format.combine(
          this.config.console.colorize ? winston.format.colorize() : winston.format.simple(),
          winston.format.timestamp(),
          winston.format.printf(this.createLogFormatter())
        )
      }));
    }
    
    // Add file transport if enabled
    if (this.config.file.enabled) {
      // Ensure log directory exists
      const logDir = path.resolve(process.cwd(), this.config.file.directory);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Create daily rotate file transport
      const fileTransport = new DailyRotateFile({
        level: this.config.file.level,
        dirname: logDir,
        filename: '%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: this.config.file.maxSize,
        maxFiles: this.config.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        zippedArchive: this.config.file.compress
      });
      
      transports.push(fileTransport);
    }
    
    // Add Elasticsearch transport if enabled
    if (this.config.elasticsearch.enabled) {
      const esTransportOpts: any = {
        level: this.config.elasticsearch.level,
        clientOpts: {
          node: this.config.elasticsearch.node,
          log: 'error'
        },
        indexPrefix: this.config.elasticsearch.indexPrefix
      };
      
      // Add auth if provided
      if (this.config.elasticsearch.auth?.username && this.config.elasticsearch.auth?.password) {
        esTransportOpts.clientOpts.auth = {
          username: this.config.elasticsearch.auth.username,
          password: this.config.elasticsearch.auth.password
        };
      }
      
      transports.push(new ElasticsearchTransport(esTransportOpts));
    }
    
    // Create logger
    this.logger = winston.createLogger({
      level: this.config.level,
      levels: winston.config.npm.levels,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: {
        service: this.configService.get<string>('service.name', 'app')
      },
      transports
    });
    
    this.info('Centralized logging service initialized', { 
      context: 'CentralizedLoggingService',
      metadata: {
        config: {
          level: this.config.level,
          transports: {
            console: this.config.console.enabled,
            file: this.config.file.enabled,
            elasticsearch: this.config.elasticsearch.enabled
          }
        }
      }
    });
  }

  private createLogFormatter() {
    return (info: any) => {
      const { timestamp, level, message, context, correlationId, ...metadata } = info;
      
      let formattedMessage = `${timestamp} [${level}]`;
      
      if (context) {
        formattedMessage += ` [${context}]`;
      }
      
      if (correlationId) {
        formattedMessage += ` [${correlationId}]`;
      }
      
      formattedMessage += `: ${message}`;
      
      // Add metadata if present
      const metadataKeys = Object.keys(metadata).filter(key => !['service', 'timestamp', 'level'].includes(key));
      if (metadataKeys.length > 0) {
        const metadataObj = metadataKeys.reduce((obj, key) => {
          obj[key] = metadata[key];
          return obj;
        }, {} as Record<string, any>);
        
        formattedMessage += ` ${JSON.stringify(metadataObj)}`;
      }
      
      return formattedMessage;
    };
  }
}
