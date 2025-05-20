import { MonitoringService } from './MonitoringService.js';
import { AlertService } from './AlertService.js';
export interface DashboardData {
  metrics: {
    current: unknown;
    historical: unknown[];
  };
  alerts: {
    active: unknown[];
    recent: unknown[];
  };
  health: {
    status: "healthy" | "degraded" | "unhealthy";
    indicators: Record<string, boolean>;
  };
  performance: {
    throughput: number;
    latency: number;
    errorRate: number;
  };
}
export declare class DashboardService {
  private readonly eventEmitter;
  private readonly monitoringService;
  private readonly alertService;
  private readonly logger;
  private metricsHistory;
  private readonly maxHistoryLength;
  constructor(
    eventEmitter: EventEmitter2,
    monitoringService: MonitoringService,
    alertService: AlertService,
  );
  private setupEventListeners;
  private updateMetricsHistory;
  getDashboardData(): Promise<DashboardData>;
  private calculateHealthStatus;
  private calculatePerformanceMetrics;
  exportDashboardMetrics(format?: "json" | "csv"): Promise<string>;
  private convertToCSV;
}
