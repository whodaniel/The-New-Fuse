import { Logger } from "winston";
import { ConfigService } from '../config/config-service.js';
import { MetricsCollector } from '../metrics/metrics-collector.js';
interface LogContext {
  component?: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}
export declare class EnhancedLogger implements Logger {
  private config;
  private metrics;
  private logger;
  private context;
  constructor(config: ConfigService, metrics: MetricsCollector);
  private initializeLogger;
  setContext(context: LogContext): void;
  clearContext(): void;
  log(level: string, message: string, ...meta: unknown[]): Logger;
  error(message: string, ...meta: unknown[]): Logger;
  warn(message: string, ...meta: unknown[]): Logger;
  info(message: string, ...meta: unknown[]): Logger;
  debug(message: string, ...meta: unknown[]): Logger;
  verbose(message: string, ...meta: unknown[]): Logger;
  profile(id: string | number, meta?: unknown): Logger;
}
export {};
