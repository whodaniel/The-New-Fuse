import { Logger } from "winston";
import { MetricsCollector } from '../metrics/metrics-collector.js';
import { ErrorHandler } from '../error/error-handler.js';
export interface Event {
  type: string;
  payload: unknown;
  metadata: EventMetadata;
}
export interface EventMetadata {
  timestamp: number;
  correlationId?: string;
  userId?: string;
  source: string;
}
export type EventHandler = (event: Event) => Promise<void>;
export declare class EventBus {
  private logger;
  private metrics;
  private errorHandler;
  private emitter;
  private handlers;
  private retryAttempts;
  constructor(
    logger: Logger,
    metrics: MetricsCollector,
    errorHandler: ErrorHandler,
  );
  publish(
    eventType: string,
    payload: unknown,
    metadata?: Partial<EventMetadata>,
  ): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): () => void;
  publishBatch(events: Event[]): Promise<void>;
  private executeHandler;
  private setupErrorHandling;
  getMetrics(): {
    [key: string]: number;
  };
}
//# sourceMappingURL=event-(bus as any).d.ts.map
