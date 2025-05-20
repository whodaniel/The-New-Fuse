import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

export interface LogMetadata {
  timestamp?: string;
  level?: string;
  service?: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

export const createLogger = (config: {
  logDir: string;
  level: string;
  service: string;
}) => {
  // Create log directory if it doesn't exist
  if (!fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
  }

  // Define log formats
  const detailedFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...metadata } = info;
      return JSON.stringify({
        timestamp,
        level,
        message,
        metadata
      });
    })
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );

  // Configure transports
  const transports: winston.transport[] = [
    // Console Transport
    new winston.transports.Console({
      level: config.level,
      format: consoleFormat
    }),
    // File Transport for all logs
    new winston.transports.DailyRotateFile({
      filename: path.join(config.logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '7d',
      format: detailedFormat
    }),
    // File Transport for error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(config.logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
      level: 'error',
      format: detailedFormat
    })
  ];

  // Create logger instance
  const logger = winston.createLogger({
    level: config.level,
    levels: LOG_LEVELS,
    defaultMeta: {
      service: config.service
    },
    transports
  });

  return logger;
};

// Custom log levels with colors
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
});
