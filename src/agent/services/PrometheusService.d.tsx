export declare class PrometheusService {
  private readonly logger;
  private readonly registry;
  private messageCounter;
  private processingTimeGauge;
  private errorCounter;
  private memoryGauge;
  private cpuGauge;
  private activeAgentsGauge;
  constructor();
  private initializeMetrics;
  recordMetrics(agentId: string, metrics: unknown): Promise<void>;
  recordSystemMetrics(metrics: unknown): Promise<void>;
  getMetrics(): Promise<string>;
}
