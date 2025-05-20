import { Logger } from "winston";
import { MetricsCollector } from '../metrics/metrics-collector.js';
import { ConfigService } from '../config/config-service.js';
import { EventBus } from '../events/event-bus.js';
export declare class MonitoringService {
  private logger;
  private metrics;
  private config;
  private eventBus;
  private metricsInterval;
  private readonly METRICS_INTERVAL;
  constructor(
    logger: Logger,
    metrics: MetricsCollector,
    config: ConfigService,
    eventBus: EventBus,
  );
  start(): Promise<void>;
  stop(): Promise<void>;
  private initializeSystemMetrics;
  private startMetricsCollection;
  private collectSystemMetrics;
  private updateMetrics;
  private collectNodeMetrics;
  private checkHealthMetrics;
  private subscribeToEvents;
}
