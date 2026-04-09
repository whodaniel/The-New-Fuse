import * as winston from 'winston';

export function setupLogging(app: any): winston.Logger {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

  app.logger = logger;
  return logger;
}
