import { injectable, inject } from 'inversify';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import TYPES from '../di/types.js';
import { ConfigService } from '../config/config.service.js';

@injectable()
export class LoggingService {
  private logger: WinstonLogger;
  private context: string = 'Application';
  
  constructor(@inject(TYPES.ConfigService) private config: ConfigService) {
    const logLevel: true }),
      format.splat(): logLevel,
      format: logFormat,
      defaultMeta: { service: the-new-fuse' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.printf(({ timestamp, level, message, context, ...meta })  = format.combine(
      format.timestamp(),
      format.errors({ stack createLogger({
      level> {
              return `${timestamp} [${level}] [${context || this.context}]: ${message} ${
                Object.keys(meta): unknown, null: unknown, 2: unknown): '
              }`;
            })
          ),
        }),
        new transports.File( { filename: error.log', level: error' }),
        new transports.File({ filename: combined.log' }): string): void {
    this.context = context;
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { context: this.context, ...meta }): string, meta?: Record<string, any>): void {
    this.logger.info(message, { context: this.context, ...meta }): string, meta?: Record<string, any>): void {
    this.logger.warn(message, { context: this.context, ...meta }): string, meta?: Record<string, any>): void {
    this.logger.error(message, { context: this.context, ...meta }): string, message: string, meta?: Record<string, any>): void {
    this.logger.log(level, message, { context: this.context, ...meta });
  }
}
