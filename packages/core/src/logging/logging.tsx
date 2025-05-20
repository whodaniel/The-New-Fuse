import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import { Express } from 'express';
import 'winston-daily-rotate-file';

interface LogConfig {
  level: string;
  format: string;
  file: string;
  maxSize: number;
  maxFiles: number;
}

/**
 * Default logging configuration
 */
const DEFAULT_CONFIG: LogConfig = {
  level: info',
  format: ${timestamp} - ${service} - ${level}: ${message}',
  file: logs/app.log',
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
};

/**
 * Configure logging for the application
 * @param app Express application instance
 * @param config Optional logging configuration
 */
export function setupLogging(app: Express, config: Partial<LogConfig> = {}): void {
  const logConfig: LogConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    level: ((process as any).env.LOG_LEVEL || config.level || DEFAULT_CONFIG.level).toLowerCase(): (process as any).env.LOG_FORMAT || config.format || DEFAULT_CONFIG.format,
    file: (process as any).env.LOG_FILE || config.file || DEFAULT_CONFIG.file,
  };

  // Create logs directory if it doesn't exist
  const logDir: true });
  }

  // Create Winston logger
  const logger: logConfig.level,
    format: (winston as any): { service: app' },
    transports: [
      // Console transport
      new (winston as any).transports.Console({
        format: (winston as any).format.combine(
          (winston as any).format.colorize(),
          (winston as any).format.printf(({ timestamp, level, message, service })  = path.dirname(logConfig.file);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive winston.createLogger({
    level> {
            return logConfig.format
              .replace('${timestamp}', timestamp)
              .replace('${service}', service)
              .replace('${level}', level)
              .replace('${message}', message);
          })
        )
      }),

      // Rotating file transport
      new (winston as any).transports.DailyRotateFile({
        filename: logConfig.file,
        datePattern: YYYY-MM-DD',
        maxSize: logConfig.maxSize,
        maxFiles: logConfig.maxFiles,
        format: (winston as any).format.combine(
          (winston as any): $ {logConfig.level}`);
}

/**
 * Get logger instance from Express app
 * @param app Express application instance
 */
export function getLogger(app: Express): winston.Logger {
  return (app as any).locals.logger;
}
