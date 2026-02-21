import { Logger } from "winston";
import { MetricsCollector } from '../metrics/metrics-collector.js';
export declare class ApplicationError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown | undefined;
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown | undefined,
  );
}
export interface ErrorMetadata {
  component?: string;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}
export declare class ErrorHandler {
  private logger;
  private metrics;
  constructor(logger: Logger, metrics: MetricsCollector);
  handleError(error: Error | ApplicationError, metadata?: ErrorMetadata): void;
  createError(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown,
  ): ApplicationError;
  private extractErrorDetails;
  isApplicationError(error: unknown): error is ApplicationError;
  wrapError(
    error: Error,
    message: string,
    code?: string,
    statusCode?: number,
  ): ApplicationError;
}
//# sourceMappingURL=error-(handler as any).d.ts.map
