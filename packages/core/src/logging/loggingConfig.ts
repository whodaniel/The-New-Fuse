/**
 * Logging configuration for the Cline Bridge system.
 * Configures logging formats, handlers, and levels for different components.
 */

import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
import { format } from 'winston';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

interface LoggerConfig {
  logLevel?: string;
  logDir?: string;
  consoleOutput?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

interface LoggerCollection {
  client: winston.Logger;
  coordination: winston.Logger;
  redis: winston.Logger;
  [key: string]: winston.Logger;
}

/**
 * Set up logging configuration for the Cline Bridge system.
 * @param config Configuration options for logging
 * @returns Collection of configured loggers
 */
export function setupLogging(config: LoggerConfig = {}): LoggerCollection {
  const {
    logLevel = 'info',
    logDir = 'logs',
    consoleOutput = true,
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5
  } = config;

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Define detailed format for logs
  const detailedFormat = format.combine(
    format.timestamp(),
    format.label({ label: 'cline-bridge' }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.colorize(),
    format.printf(({ timestamp, level, message, label, metadata }) => {
      let msg = `${timestamp} [${label}] ${level}: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    })
  );

  // Set up transports
  const transports: winston.transport[] = [];

  // Add console transport if enabled
  if (consoleOutput) {
    transports.push(
      new (winston as any).transports.Console({
        format: detailedFormat
      })
    );
  }

  // Add file transport with rotation
  const fileTransport = new (winston as any).transports.DailyRotateFile({
    dirname: logDir,
    filename: 'cline_bridge_%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize,
    maxFiles,
    format: detailedFormat
  });

  transports.push(fileTransport);

  // Create loggers for different components
  const loggers: LoggerCollection = {
    client: createComponentLogger('client', logLevel, transports),
    coordination: createComponentLogger('coordination', logLevel, transports),
    redis: createComponentLogger('redis', logLevel, transports)
  };

  // Log initialization
  Object.values(loggers).forEach(logger => {
    logger.info('Logger initialized');
  });

  return loggers;
}

/**
 * Create a component-specific logger
 * @param component Component name
 * @param level Log level
 * @param transports Winston transports to use
 * @returns Configured logger
 */
function createComponentLogger(
  component: string,
  level: string,
  transports: winston.transport[]
): winston.Logger {
  return winston.createLogger({
    level,
    defaultMeta: { component },
    transports: [...transports]
  });
}

/**
 * Get a logger by name
 * @param name Logger name
 * @returns Logger instance
 */
export function getLogger(name: string): winston.Logger {
  const loggerName = `cline_bridge.${name}`;
  return (winston as any).loggers.get(loggerName) || createDefaultLogger(name);
}

/**
 * Create a default logger if one doesn't exist
 * @param name Logger name
 * @returns Default configured logger
 */
function createDefaultLogger(name: string): winston.Logger {
  const logger = winston.createLogger({
    level: 'info',
    defaultMeta: { component: name },
    format: format.combine(
      format.timestamp(),
      format.label({ label: 'cline-bridge' }),
      format.metadata()
    ),
    transports: [
      new (winston as any).transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      })
    ]
  });

  (winston as any).loggers.add(name, logger);
  return logger;
}

// Export log levels for external use
export const LOG_LEVELS = logLevels;
