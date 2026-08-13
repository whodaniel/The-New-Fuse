import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class LoggingService implements LoggerService {
  private coreLogger: any;
  private context: string = 'App';

  constructor() {
    // Initialize logger
    this.coreLogger = console;
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: any, context?: string): void {
    this.coreLogger.log(`[${context || this.context}] ${message}`);
  }

  error(message: any, trace?: string, context?: string): void {
    this.coreLogger.error(`[${context || this.context}] ${message}`, trace);
  }

  warn(message: any, context?: string): void {
    this.coreLogger.warn(`[${context || this.context}] ${message}`);
  }

  debug(message: any, context?: string): void {
    this.coreLogger.debug(`[${context || this.context}] ${message}`);
  }

  verbose(message: any, context?: string): void {
    this.coreLogger.info(`[${context || this.context}] ${message}`);
  }

  info(message: any, context?: string): void {
    this.coreLogger.info(`[${context || this.context}] ${message}`);
  }

  logRequest(payload: Record<string, any>): void {
    this.coreLogger.info(`[${this.context}] request ${JSON.stringify(payload)}`);
  }

  logPerformance(metric: string, duration: number, data?: Record<string, any>): void {
    this.coreLogger.info(
      `[${this.context}] performance ${metric} ${duration}ms ${JSON.stringify(data || {})}`
    );
  }
}
