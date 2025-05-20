import { injectable, inject } from "inversify";
import TYPES from '../di/types.js';
import { ILogger, IConfigService, IEventBus } from '../di/types.js';
import { createLogger, format, transports, Logger } from "winston";

@injectable()
export class LoggingService implements ILogger {
  private logger: Logger;

  constructor(
    @inject(TYPES.Config) private config: IConfigService,
    @inject(TYPES.EventBus) private eventBus: IEventBus,
  ) {
    this.initializeLogger();
  }

  log(
    level: string,
    message: string,
    context?: Record<string, any>,
  ): void {
    if (context) {
      this.logger.log(level, message, { context });
    } else {
      this.logger.log(level, message);
    }
  }

  private initializeLogger() {
    const loggingConfig = this.config.get("logging", {});
    const logLevel = loggingConfig?.level || "info";
    const logFormat = format.combine(
      format.timestamp(),
      format.json()
    );
    
    const transportsList = [];

    // Console transport
    transportsList.push(
      new transports.Console({
        level: logLevel,
        format: logFormat,
      }),
    );

    // File transport if configured
    if (loggingConfig?.file?.enabled) {
      transportsList.push(
        new transports.File({
          filename: loggingConfig?.file?.path || "logs/app.log",
          level: loggingConfig?.file?.level || logLevel,
          format: logFormat,
          maxsize: loggingConfig?.file?.maxSize || 5242880,
          maxFiles: loggingConfig?.file?.maxFiles || 5,
        }),
      );
    }

    this.logger = createLogger({
      level: logLevel,
      format: logFormat,
      transports: transportsList,
    });

    // Log uncaught exceptions
    this.logger.exceptions.handle(
      new transports.File({ filename: "logs/exceptions.log" })
    );
  }

  info(message: string | Record<string, any>): void {
    if (typeof message === "string") {
      this.logger.info(message);
    } else {
      this.logger.info(message);
    }
  }

  error(message: string | Record<string, any>): void {
    if (typeof message === "string") {
      this.logger.error(message);
    } else {
      this.logger.error(message);
    }
  }

  warn(message: string | Record<string, any>): void {
    if (typeof message === "string") {
      this.logger.warn(message);
    } else {
      this.logger.warn(message);
    }
  }

  debug(message: string | Record<string, any>): void {
    if (typeof message === "string") {
      this.logger.debug(message);
    } else {
      this.logger.debug(message);
    }
  }
}
