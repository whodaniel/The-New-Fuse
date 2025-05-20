/**
 * Redis Logger
 * 
 * This module provides logging functionality for the Redis implementation.
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level?: LogLevel | string;
  console?: {
    enabled?: boolean;
    level?: LogLevel | string;
    colorize?: boolean;
  };
  file?: {
    enabled?: boolean;
    level?: LogLevel | string;
    path?: string;
    maxSize?: number;
    maxFiles?: number;
  };
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  console: {
    enabled: true,
    level: LogLevel.INFO,
    colorize: true,
  },
  file: {
    enabled: true,
    level: LogLevel.INFO,
    path: 'logs/redis',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  },
};

/**
 * Create a logger instance
 */
export function createLogger(name: string, config: LoggerConfig = {}): winston.Logger {
  // Merge with default config
  const mergedConfig: LoggerConfig = {
    level: config.level || DEFAULT_CONFIG.level,
    console: {
      enabled: config.console?.enabled !== undefined ? config.console.enabled : DEFAULT_CONFIG.console?.enabled,
      level: config.console?.level || DEFAULT_CONFIG.console?.level,
      colorize: config.console?.colorize !== undefined ? config.console.colorize : DEFAULT_CONFIG.console?.colorize,
    },
    file: {
      enabled: config.file?.enabled !== undefined ? config.file.enabled : DEFAULT_CONFIG.file?.enabled,
      level: config.file?.level || DEFAULT_CONFIG.file?.level,
      path: config.file?.path || DEFAULT_CONFIG.file?.path,
      maxSize: config.file?.maxSize || DEFAULT_CONFIG.file?.maxSize,
      maxFiles: config.file?.maxFiles || DEFAULT_CONFIG.file?.maxFiles,
    },
  };

  // Create transports array
  const transports: winston.transport[] = [];

  // Add console transport
  if (mergedConfig.console?.enabled) {
    transports.push(
      new winston.transports.Console({
        level: mergedConfig.console.level,
        format: winston.format.combine(
          winston.format.colorize({ all: mergedConfig.console.colorize }),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}] [${name}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          })
        ),
      })
    );
  }

  // Add file transport
  if (mergedConfig.file?.enabled) {
    // Ensure log directory exists
    const logDir = mergedConfig.file.path || 'logs/redis';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create daily rotate file transport
    transports.push(
      new winston.transports.DailyRotateFile({
        level: mergedConfig.file.level,
        dirname: logDir,
        filename: `${name}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: mergedConfig.file.maxSize,
        maxFiles: mergedConfig.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  // Create logger
  return winston.createLogger({
    level: mergedConfig.level,
    defaultMeta: { service: name },
    transports,
  });
}

// Create Redis logger instance
export const redisLogger = createLogger('redis');

// Create Redis client logger instance
export const redisClientLogger = createLogger('redis-client');

// Create Redis service logger instance
export const redisServiceLogger = createLogger('redis-service');

// Export default logger
export default redisLogger;
