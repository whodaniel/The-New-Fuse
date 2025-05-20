import { injectable, inject } from "inversify";
import { Logger, createLogger, format, transports } from "winston";
import TYPES from '../di/types.js';
import { ConfigService } from '../config/config-service.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';
import * as Transport from "winston-transport";

interface LogContext {
  component?: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

@injectable()
export class EnhancedLogger implements Logger {
  private logger: Logger;
  private context: LogContext = {};

  constructor(
    @inject(TYPES.Config) private config: ConfigService,
    @inject(TYPES.MetricsCollector) private metrics: MetricsCollector,
  ) {
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logConfig = this.config.get<Record<string, any>>("logging");
    const transportsArray: Transport[] = [];

    const customFormat = format.combine(
      format.timestamp(),
      format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
    );

    if (logConfig.console?.enabled !== false) {
      transportsArray.push(
        new transports.Console({
          level: logConfig.console?.level || "info",
          format: format.combine(format.colorize(), customFormat)
        })
      );
    }

    if (logConfig.file?.enabled !== false) {
      transportsArray.push(
        new transports.File({
          filename: logConfig.file?.path || "logs/app.log",
          level: logConfig.file?.level || "info",
          maxsize: logConfig.file?.maxSize || 5242880,
          maxFiles: logConfig.file?.maxFiles || 5,
          format: customFormat,
        }),
      );
    }

    this.logger = createLogger({
      level: logConfig.level || "info",
      defaultMeta: this.context,
      transports: transportsArray,
      exitOnError: false,
    });
  }

  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
    (this.logger as any).defaultMeta = this.context;
  }

  public clearContext(): void {
    this.context = {};
    (this.logger as any).defaultMeta = {};
  }

  public log(level: string, message: string, ...meta: unknown[]): Logger {
    this.metrics.incrementCounter("log_entries_total", { level });
    return this.logger.log(level, message, ...meta);
  }

  public error(message: string, ...meta: unknown[]): Logger {
    this.metrics.incrementCounter("error_logs_total");
    return this.logger.error(message, ...meta);
  }

  public warn(message: string, ...meta: unknown[]): Logger {
    return this.logger.warn(message, ...meta);
  }

  public info(message: string, ...meta: unknown[]): Logger {
    return this.logger.info(message, ...meta);
  }

  public debug(message: string, ...meta: unknown[]): Logger {
    return this.logger.debug(message, ...meta);
  }

  public verbose(message: string, ...meta: unknown[]): Logger {
    return this.logger.verbose(message, ...meta);
  }

  public profile(id: string | number, meta?: unknown): Logger {
    return (this.logger as any).profile(id, meta);
  }
}
