/**
 * Winston Logger Configuration
 * Provides structured JSON logging with multiple transports
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

export interface LoggerConfig {
  level: LogLevel;
  serviceName: string;
  environment: 'development' | 'staging' | 'production';
  console?: {
    enabled: boolean;
    colorize?: boolean;
    timestamp?: boolean;
  };
  file?: {
    enabled: boolean;
    dir: string;
    filename?: string;
    maxSize?: string;
    maxFiles?: string | number;
    datePattern?: string;
  };
  enableErrorFile?: boolean;
  enableCombinedFile?: boolean;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Winston Logger wrapper
 */
export class WinstonLogger {
  private logger: any;
  private config: LoggerConfig;
  private winston: any;
  private winstonDailyRotate: any;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Initialize Winston logger
   */
  async initialize(): Promise<void> {
    try {
      // Dynamically import winston
      this.winston = await import('winston');

      // Try to import winston-daily-rotate-file if file logging is enabled
      if (this.config.file?.enabled) {
        try {
          this.winstonDailyRotate = await import('winston-daily-rotate-file');
        } catch (error) {
          console.warn('winston-daily-rotate-file not available, using basic file transport');
        }
      }

      const transports: any[] = [];

      // Console transport
      if (this.config.console?.enabled !== false) {
        transports.push(
          new this.winston.transports.Console({
            format: this.winston.format.combine(
              this.winston.format.timestamp(),
              this.config.console?.colorize ? this.winston.format.colorize() : this.winston.format.uncolorize(),
              this.winston.format.printf(this.formatConsoleLog.bind(this))
            ),
          })
        );
      }

      // File transports
      if (this.config.file?.enabled) {
        const fileDir = this.config.file.dir || './logs';

        if (this.winstonDailyRotate) {
          // Daily rotate file transport
          transports.push(
            new this.winstonDailyRotate.default({
              dirname: fileDir,
              filename: this.config.file.filename || '%DATE%-app.log',
              datePattern: this.config.file.datePattern || 'YYYY-MM-DD',
              maxSize: this.config.file.maxSize || '20m',
              maxFiles: this.config.file.maxFiles || '14d',
              format: this.winston.format.combine(
                this.winston.format.timestamp(),
                this.winston.format.json()
              ),
            })
          );

          // Error file transport
          if (this.config.enableErrorFile !== false) {
            transports.push(
              new this.winstonDailyRotate.default({
                dirname: fileDir,
                filename: '%DATE%-error.log',
                datePattern: this.config.file.datePattern || 'YYYY-MM-DD',
                level: 'error',
                maxSize: this.config.file.maxSize || '20m',
                maxFiles: this.config.file.maxFiles || '14d',
                format: this.winston.format.combine(
                  this.winston.format.timestamp(),
                  this.winston.format.json()
                ),
              })
            );
          }
        } else {
          // Basic file transport
          transports.push(
            new this.winston.transports.File({
              dirname: fileDir,
              filename: this.config.file.filename || 'app.log',
              maxsize: 20971520, // 20MB
              maxFiles: 5,
              format: this.winston.format.combine(
                this.winston.format.timestamp(),
                this.winston.format.json()
              ),
            })
          );
        }
      }

      this.logger = this.winston.createLogger({
        level: this.config.level,
        defaultMeta: {
          service: this.config.serviceName,
          environment: this.config.environment,
          ...this.config.metadata,
        },
        transports,
        exitOnError: false,
      });

      console.log(`Winston logger initialized for ${this.config.serviceName}`);
    } catch (error) {
      console.error('Failed to initialize Winston logger:', error);
      throw error;
    }
  }

  /**
   * Format console log output
   */
  private formatConsoleLog(info: any): string {
    const timestamp = info.timestamp;
    const level = info.level.toUpperCase().padEnd(7);
    const service = info.service?.padEnd(20) || '';
    const message = info.message;

    let output = `${timestamp} [${level}] ${service} ${message}`;

    if (info.duration) {
      output += ` (${info.duration}ms)`;
    }

    if (info.statusCode) {
      output += ` [${info.statusCode}]`;
    }

    if (info.error) {
      output += `\n  Error: ${info.error.message}`;
      if (info.error.stack && this.config.level === 'debug') {
        output += `\n${info.error.stack}`;
      }
    }

    if (info.metadata && Object.keys(info.metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(info.metadata, null, 2)}`;
    }

    return output;
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (!this.logger) {
      console.error(message, error, metadata);
      return;
    }

    this.logger.error(message, {
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
      metadata,
    });
  }

  /**
   * Log warning
   */
  warn(message: string, metadata?: Record<string, any>): void {
    if (!this.logger) {
      console.warn(message, metadata);
      return;
    }

    this.logger.warn(message, { metadata });
  }

  /**
   * Log info
   */
  info(message: string, metadata?: Record<string, any>): void {
    if (!this.logger) {
      console.info(message, metadata);
      return;
    }

    this.logger.info(message, { metadata });
  }

  /**
   * Log HTTP request
   */
  http(message: string, metadata?: Record<string, any>): void {
    if (!this.logger) {
      console.log(message, metadata);
      return;
    }

    this.logger.http(message, { metadata });
  }

  /**
   * Log debug
   */
  debug(message: string, metadata?: Record<string, any>): void {
    if (!this.logger) {
      console.debug(message, metadata);
      return;
    }

    this.logger.debug(message, { metadata });
  }

  /**
   * Log request
   */
  logRequest(req: any, res: any, duration: number): void {
    const metadata = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.id,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    if (!this.logger) {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, metadata);
      return;
    }

    this.logger[level](`${req.method} ${req.url}`, metadata);
  }

  /**
   * Log slow query
   */
  logSlowQuery(query: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      this.warn('Slow query detected', {
        query,
        duration,
        threshold,
      });
    }
  }

  /**
   * Child logger with additional metadata
   */
  child(metadata: Record<string, any>): WinstonLogger {
    const childConfig = {
      ...this.config,
      metadata: {
        ...this.config.metadata,
        ...metadata,
      },
    };
    const childLogger = new WinstonLogger(childConfig);
    childLogger.logger = this.logger?.child(metadata);
    childLogger.winston = this.winston;
    childLogger.winstonDailyRotate = this.winstonDailyRotate;
    return childLogger;
  }
}

/**
 * Create logger instance
 */
export function createLogger(config: LoggerConfig): WinstonLogger {
  return new WinstonLogger(config);
}
