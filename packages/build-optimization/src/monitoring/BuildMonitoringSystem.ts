/**
 * Build-specific monitoring system implementation
 * Extends the base monitoring system with build-specific functionality
 */

import {
  BaseMonitoringConfig,
  BaseMonitoringSystem,
  IMetricsCollector,
  Logger,
} from '@the-new-fuse/core-monitoring';
import { BuildMetricsCollector, DetailedBuildMetrics } from './BuildMetricsCollector.js';

/**
 * Build monitoring configuration
 */
export interface BuildMonitoringConfig extends BaseMonitoringConfig {
  // Build-specific configuration options
  trackMemoryUsage?: boolean;
  trackStageMetrics?: boolean;
  trackPerformanceStats?: boolean;
  memoryMonitoringInterval?: number;
}

/**
 * Build monitoring system implementation
 */
export class BuildMonitoringSystem extends BaseMonitoringSystem<
  DetailedBuildMetrics,
  BuildMonitoringConfig
> {
  private buildMetricsCollector?: BuildMetricsCollector;

  constructor(logger?: Logger) {
    super(logger || new Logger('BuildMonitoringSystem'));
  }

  /**
   * Create build-specific metrics collector
   */
  protected createMetricsCollector(): IMetricsCollector<DetailedBuildMetrics> {
    if (!this.config) {
      throw new Error('Configuration not set');
    }

    this.buildMetricsCollector = new BuildMetricsCollector(
      this.config.memoryMonitoringInterval || 1000
    );
    return this.buildMetricsCollector;
  }

  /**
   * Format build metrics for Prometheus export
   */
  protected formatPrometheusMetrics(metrics: DetailedBuildMetrics): string {
    const lines: string[] = [];

    // Helper function to add metric
    const addMetric = (name: string, value: number, labels?: Record<string, string>) => {
      const labelStr = labels
        ? `{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';
      lines.push(`build_${name}${labelStr} ${value}`);
    };

    // Build metrics
    addMetric('total_time_ms', metrics.totalBuildTime);
    addMetric('peak_memory_mb', metrics.peakMemoryUsage);
    addMetric('average_memory_mb', metrics.averageMemoryUsage);
    addMetric('stages_executed', metrics.stagesExecuted);
    addMetric('successful_builds', metrics.successfulBuilds);
    addMetric('failed_builds', metrics.failedBuilds);

    // Performance metrics
    addMetric('avg_build_time_per_package_ms', metrics.performanceStats.avgBuildTimePerPackage);
    addMetric('memory_efficiency_score', metrics.performanceStats.memoryEfficiencyScore);
    addMetric('concurrency_utilization_percent', metrics.performanceStats.concurrencyUtilization);
    addMetric('cleanup_time_ms', metrics.performanceStats.cleanupTime);
    addMetric('memory_violations', metrics.performanceStats.memoryViolations);

    // Stage metrics
    metrics.stageMetrics.forEach((stage, index) => {
      const stageLabels = { stage: stage.stageId, index: index.toString() };
      addMetric('stage_duration_ms', stage.duration, stageLabels);
      addMetric('stage_peak_memory_mb', stage.peakMemoryUsage, stageLabels);
      addMetric('stage_success', stage.success ? 1 : 0, stageLabels);
      addMetric('stage_package_count', stage.packages.length, stageLabels);
    });

    return lines.join('\n');
  }

  /**
   * Get build-specific status information
   */
  async getBuildStatus(): Promise<{
    isBuilding: boolean;
    currentStage?: string;
    progress: number;
    memoryUsage: number;
  }> {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }

    const metrics = this.buildMetricsCollector.getMetrics();

    return {
      isBuilding: this.buildMetricsCollector['isCollecting'] || false,
      currentStage: this.buildMetricsCollector['currentStage']?.stageId,
      progress:
        metrics.stagesExecuted > 0
          ? (metrics.successfulBuilds / (metrics.successfulBuilds + metrics.failedBuilds)) * 100
          : 0,
      memoryUsage: metrics.peakMemoryUsage,
    };
  }

  /**
   * Start build monitoring
   */
  startBuildMonitoring(): void {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }
    this.buildMetricsCollector.startCollection();
  }

  /**
   * Stop build monitoring
   */
  stopBuildMonitoring(): DetailedBuildMetrics {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }
    this.buildMetricsCollector.stopCollection();
    return this.buildMetricsCollector.getMetrics();
  }

  /**
   * Record build events
   */
  recordBuildEvent(event: any): void {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }
    this.buildMetricsCollector.recordEvent(event);
  }

  /**
   * Record successful build
   */
  recordSuccessfulBuild(packageName: string, duration: number): void {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }
    this.buildMetricsCollector.recordSuccessfulBuild(packageName, duration);
  }

  /**
   * Record failed build
   */
  recordFailedBuild(packageName: string, error: string): void {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }
    this.buildMetricsCollector.recordFailedBuild(packageName, error);
  }

  /**
   * Generate build report
   */
  generateBuildReport(): string {
    if (!this.buildMetricsCollector) {
      throw new Error('Build metrics collector not initialized');
    }
    return this.buildMetricsCollector.generateReport();
  }
}
