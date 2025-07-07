/**
 * Logging configuration for The New Fuse system.
 * Configures logging formats, handlers, and levels for different components.
 */

import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

// Define log level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'white',
  debug: 'cyan',
  silly: 'grey'
};

// Configuration interface
export interface LoggingConfig {
  level: string;
  logDir: string;
  console: {
    enabled: boolean;
    level: string;
    colorize: boolean;
  };
  file: {
    enabled: boolean;
    level: string;
    maxSize: string;
    maxFiles: string;
    datePattern: string;
    zippedArchive: boolean;
  };
  database: {
    enabled: boolean;
    level: string;
    tableName: string;
  };
  elasticsearch: {
    enabled: boolean;
    level: string;
    node: string;
    index: string;
    auth?: {
      username: string;
      password: string;
    };
  };
}

// Default configuration
const defaultConfig: LoggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',
  console: {
    enabled: process.env.CONSOLE_LOG_ENABLED !== 'false',
    level: process.env.CONSOLE_LOG_LEVEL || 'info',
    colorize: process.env.NODE_ENV !== 'production',
  },
  file: {
    enabled: process.env.FILE_LOG_ENABLED !== 'false',
    level: process.env.FILE_LOG_LEVEL || 'info',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
    datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
    zippedArchive: process.env.LOG_COMPRESS === 'true',
  },
  database: {
    enabled: process.env.DB_LOG_ENABLED === 'true',
    level: process.env.DB_LOG_LEVEL || 'warn',
    tableName: process.env.DB_LOG_TABLE || 'logs',
  },
  elasticsearch: {
    enabled: process.env.ES_LOG_ENABLED === 'true',
    level: process.env.ES_LOG_LEVEL || 'info',
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'fuse-logs',
    auth: process.env.ELASTICSEARCH_USERNAME ? {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD || '',
    } : undefined,
  },
};

export class LoggingConfigManager {
  private config: LoggingConfig;
  private logger: winston.Logger;

  constructor(config?: Partial<LoggingConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.ensureLogDirectory();
    this.logger = this.createLogger();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.console.enabled) {
      transports.push(
        new winston.transports.Console({
          level: this.config.console.level,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize({ all: this.config.console.colorize }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} [${level}]: ${message}${metaString}`;
            })
          ),
        })
      );
    }

    // File transport
    if (this.config.file.enabled) {
      transports.push(
        new DailyRotateFile({
          level: this.config.file.level,
          filename: path.join(this.config.logDir, 'application-%DATE%.log'),
          datePattern: this.config.file.datePattern,
          zippedArchive: this.config.file.zippedArchive,
          maxSize: this.config.file.maxSize,
          maxFiles: this.config.file.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
          ),
        })
      );

      // Error file transport
      transports.push(
        new DailyRotateFile({
          level: 'error',
          filename: path.join(this.config.logDir, 'error-%DATE%.log'),
          datePattern: this.config.file.datePattern,
          zippedArchive: this.config.file.zippedArchive,
          maxSize: this.config.file.maxSize,
          maxFiles: this.config.file.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
          ),
        })
      );
    }

    // Database transport (placeholder)
    if (this.config.database.enabled) {
      console.warn('Database transport is not yet implemented');
    }

    // Elasticsearch transport
    if (this.config.elasticsearch.enabled) {
      try {
        const ElasticsearchTransport = require('winston-elasticsearch');
        transports.push(
          new ElasticsearchTransport({
            level: this.config.elasticsearch.level,
            clientOpts: {
              node: this.config.elasticsearch.node,
              auth: this.config.elasticsearch.auth,
            },
            index: this.config.elasticsearch.index,
            indexSuffixPattern: 'YYYY-MM-DD',
            messageType: '_doc',
            mapping: {
              '@timestamp': { type: 'date' },
              level: { type: 'keyword' },
              message: { type: 'text' },
              meta: { type: 'object' },
            },
          })
        );
      } catch (error) {
        console.warn('Failed to initialize Elasticsearch transport:', error);
      }
    }

    return winston.createLogger({
      level: this.config.level,
      levels: winston.config.npm.levels,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
      ),
      transports,
      exitOnError: false,
    });
  }

  getLogger(): winston.Logger {
    return this.logger;
  }

  getConfig(): LoggingConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.close();
    this.logger = this.createLogger();
  }

  createChildLogger(service: string): winston.Logger {
    return this.logger.child({ service });
  }
}

// Export singleton instance
export const loggingConfig = new LoggingConfigManager();
export const logger = loggingConfig.getLogger();

// Add colors to winston
winston.addColors(colors);

export default loggingConfig;