import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
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

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly metricsHistory: unknown[] = [];
  private readonly maxHistoryLength = 1000;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly monitoringService: MonitoringService,
    private readonly alertService: AlertService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on(
      "monitoring.metrics.updated",
      this.updateMetricsHistory.bind(this)
    );
  }

  private updateMetricsHistory(metrics: unknown): void {
    this.metricsHistory.push({
      timestamp: new Date(),
      ...metrics,
    });

    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    const currentMetrics = await this.monitoringService.getCurrentMetrics();
    const recentAlerts = await this.alertService.getRecentAlerts();

    return {
      metrics: {
        current: currentMetrics,
        historical: this.metricsHistory,
      },
      alerts: {
        active: recentAlerts.filter((alert) => !alert.resolved),
        recent: recentAlerts,
      },
      health: this.calculateHealthStatus(currentMetrics),
      performance: this.calculatePerformanceMetrics(currentMetrics),
    };
  }

  private calculateHealthStatus(metrics: unknown): DashboardData["health"] {
    const indicators = {
      errorRate: metrics.errorRate < 0.05,
      queueSize: metrics.queueMetrics.currentSize < 500,
      processingTime: metrics.processingTimePercentiles.p90 < 2000,
    };

    const healthyCount = Object.values(indicators).filter(Boolean).length;
    
    let status: "healthy" | "degraded" | "unhealthy";
    if (healthyCount === Object.keys(indicators).length) {
      status = "healthy";
    } else if (healthyCount > Object.keys(indicators).length / 2) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    return {
      status,
      indicators,
    };
  }

  private calculatePerformanceMetrics(
    metrics: unknown,
  ): DashboardData["performance"] {
    return {
      throughput: metrics.totalProcessed / (metrics.uptime || 1),
      latency: metrics.processingTimePercentiles.p50,
      errorRate: metrics.failureCount / (metrics.totalProcessed || 1),
    };
  }

  async exportDashboardMetrics(
    format: "json" | "csv" = "json"
  ): Promise<string> {
    const data = await this.getDashboardData();
    
    if (format === "csv") {
      return this.convertToCSV(data.metrics.historical);
    }

    return JSON.stringify(data, null, 2);
  }

  private convertToCSV(data: unknown[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => JSON.stringify(row[header])).join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  }
}
