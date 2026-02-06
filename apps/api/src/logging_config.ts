import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

export function setupLogging(): any {
  const isProduction = process.env.NODE_ENV === 'production';

  const logTransports: any[] = [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ];

  // Only add file logging in development - production uses console output only
  // Railway and other container environments don't have writable local filesystems
  if (!isProduction) {
    logTransports.push(
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
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: logTransports,
  });
}
