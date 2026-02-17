import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

export function setupLogging(): any {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;

  const loggerTransports: any[] = [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ];

  // Only use file logging in non-production environments
  // In production (Railway, etc.), logs should go to stdout for platform log aggregation
  if (!isProduction) {
    loggerTransports.push(
      new (transports as any).DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      })
    );
  }

  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: loggerTransports,
  });
}
