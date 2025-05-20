export declare class MonitoringService {
    private readonly metrics;
    private readonly alerting;
    private readonly storage;
    private readonly logger;
    constructor(metrics: MetricsRegistry, alerting: AlertingService, storage: TimeSeriesStorage, logger: Logger);
    trackAgentMetrics(): Promise<void>;
}
