import { ILogger, IConfigService, IEventBus } from '../di/types.js';
export declare class LoggingService implements ILogger {
  private config;
  private eventBus;
  private logger;
  constructor(config: IConfigService, eventBus: IEventBus);
  log(level: string, message: string, context?: Record<string, any>): void;
  private initializeLogger;
  info(message: string | Record<string, any>): void;
  error(message: string | Record<string, any>): void;
  warn(message: string | Record<string, any>): void;
  debug(message: string | Record<string, any>): void;
}
