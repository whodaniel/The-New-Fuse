import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricCollector } from './metrics.js';
import { AlertManager } from './alerts.js';
import { TracingService } from './tracing.js';
import { PerformanceProfiler } from './profiler.js';
import {
  MonitoringConfig,
  Dashboard,
  DashboardPanel,
  HealthCheck,
} from './types.js';

@Injectable()
export class SystemMonitor {
  private readonly config: MonitoringConfig;
  private readonly dashboards: Map<string, Dashboard>;
  private readonly healthChecks: Map<string, HealthCheck>;
  private healthCheckTimer: NodeJS.Timer;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricCollector: MetricCollector,
    private readonly alertManager: AlertManager,
    private readonly tracingService: TracingService,
    private readonly performanceProfiler: PerformanceProfiler,
  ) {
    this.config = this.loadConfig();
    this.dashboards = new Map();
    this.healthChecks = new Map();
    this.initialize();
  }

  private loadConfig(): MonitoringConfig {
    return {
      enabled: this.configService.get('MONITORING_ENABLED', true),
      metrics: {
        enabled: this.configService.get('METRICS_ENABLED', true),
        interval: this.configService.get('METRICS_INTERVAL', 10000),
        retention: this.configService.get('METRICS_RETENTION', 604800),
      },
      alerts: {
        enabled: this.configService.get('ALERTS_ENABLED', true),
        channels: this.configService.get('ALERT_CHANNELS', []),
      },
      tracing: {
        enabled: this.configService.get('TRACING_ENABLED', true),
        sampleRate: this.configService.get('TRACING_SAMPLE_RATE', 0.1),
      },
      profiling: {
        enabled: this.configService.get('PROFILING_ENABLED', true),
        interval: this.configService.get('PROFILING_INTERVAL', 60000),
      },
      healthChecks: {
        enabled: this.configService.get('HEALTH_CHECKS_ENABLED', true),
        interval: this.configService.get('HEALTH_CHECK_INTERVAL', 30000),
      },
    };
  }

  private initialize(): void {
    if (this.config.metrics.enabled) {
      this.initializeMetrics();
    }
    if (this.config.alerts.enabled) {
      this.initializeAlerts();
    }
    if (this.config.tracing.enabled) {
      this.initializeTracing();
    }
    if (this.config.profiling.enabled) {
      this.initializeProfiling();
    }
    if (this.config.healthChecks.enabled) {
      this.initializeHealthChecks();
    }
  }

  private initializeMetrics(): void {
    // Set up system metrics collection
    this.collectSystemMetrics();
    // Set up default alerts
    this.setupDefaultAlerts();

    // Subscribe to metric events for alert checking
    this.eventEmitter.on('metric.recorded', metric => {
      // Alert manager will handle checking conditions
    });
  }

  private initializeAlerts(): void {
    // Implement alert initialization
  }

  private initializeTracing(): void {
    // Set up trace context propagation
    this.setupTraceContextPropagation();
    // Start the performance profiler
    this.performanceProfiler.startProfiling();
  }

  private initializeProfiling(): void {
    // Implement profiling initialization
  }

  private initializeHealthChecks(): void {
    // Set up health check timer
    this.healthCheckTimer = setInterval(() => {
      this.runHealthChecks();
    }, this.config.healthChecks.interval);
  }

  private collectSystemMetrics(): void {
    // System metrics collection (CPU, Memory, Disk, Network)
    setInterval(() => {
      this.collectCPUMetrics();
    }, this.config.metrics.interval);

    setInterval(() => {
      this.collectMemoryMetrics();
    }, this.config.metrics.interval);

    setInterval(() => {
      this.collectDiskMetrics();
    }, this.config.metrics.interval);

    setInterval(() => {
      this.collectNetworkMetrics();
    }, this.config.metrics.interval);

    // Process metrics collection (Heap, GC, Event Loop)
    setInterval(() => {
      this.collectHeapMetrics();
    }, this.config.metrics.interval);

    setInterval(() => {
      this.collectGCMetrics();
    }, this.config.metrics.interval);

    setInterval(() => {
      this.collectEventLoopMetrics();
    }, this.config.metrics.interval);

    // Custom application metrics
    setInterval(() => {
      this.collectApplicationMetrics();
    }, this.config.metrics.interval);
  }

  private async collectCPUMetrics(): Promise<void> {
    const usage = process.cpuUsage();
    this.metricCollector.gauge(
      'system_cpu_usage',
      (usage.user + usage.system) / 1000000,
      'percentage',
      [{ name: 'type', value: 'total' }],
    );
  }

  private async collectMemoryMetrics(): Promise<void> {
    const usage = process.memoryUsage();
    this.metricCollector.gauge(
      'system_memory_usage',
      usage.heapUsed,
      'bytes',
      [{ name: 'type', value: 'heap_used' }],
    );
  }

  private async collectDiskMetrics(): Promise<void> {
    // Implement disk metrics collection
  }

  private async collectNetworkMetrics(): Promise<void> {
    // Implement network metrics collection
  }

  private async collectHeapMetrics(): Promise<void> {
    const heap = process.memoryUsage();
    this.metricCollector.gauge(
      'process_heap_size',
      heap.heapTotal,
      'bytes',
      [{ name: 'type', value: 'total' }],
    );
  }

  private async collectGCMetrics(): Promise<void> {
    // Implement GC metrics collection
  }

  private async collectEventLoopMetrics(): Promise<void> {
    // Implement event loop metrics collection
  }

  private async collectApplicationMetrics(): Promise<void> {
    // Implement application-specific metrics
  }

  private async collectBusinessMetrics(): Promise<void> {
    // Implement business-specific metrics
  }

  private setupDefaultAlerts(): void {
    // Set up CPU usage alert
    this.alertManager.createAlert({
      name: 'High CPU Usage',
      description: 'CPU usage is above 80%',
      condition: 'system_cpu_usage > 80',
      severity: 'warning',
      metadata: {
        source: 'system',
        metric: 'system_cpu_usage',
        threshold: 80,
      },
    });

    // Set up memory usage alert
    this.alertManager.createAlert({
      name: 'High Memory Usage',
      description: 'Memory usage is above 90%',
      condition: 'system_memory_usage > 90',
      severity: 'critical',
      metadata: {
        source: 'system',
        metric: 'system_memory_usage',
        threshold: 90,
      },
    });
  }

  private setupTraceContextPropagation(): void {
    // Implement trace context propagation
  }

  private setupAutoInstrumentation(): void {
    // Implement automatic instrumentation
  }

  public async createDashboard(options: {
    name: string;
    description: string;
    panels: DashboardPanel[];
  }): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: `dashboard_${Date.now()}`,
      name: options.name,
      description: options.description,
      panels: options.panels,
      layout: {
        rows: Math.ceil(options.panels.length / 2),
        columns: 2,
        panels: options.panels.map((_, index) => ({
          panelId: options.panels[index].id,
          x: index % 2,
          y: Math.floor(index / 2),
          w: 1,
          h: 1,
        })),
      },
      metadata: {
        createdAt: new Date(),
        owner: 'system',
      },
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  public async registerHealthCheck(check: Omit<HealthCheck, 'id' | 'lastCheck' | 'status'>): Promise<HealthCheck> {
    const healthCheck: HealthCheck = {
      ...check,
      id: `health_check_${Date.now()}`,
      lastCheck: new Date(),
      status: 'up',
    };

    this.healthChecks.set(healthCheck.id, healthCheck);
    return healthCheck;
  }

  private async runHealthChecks(): Promise<void> {
    for (const check of this.healthChecks.values()) {
      try {
        const startTime = Date.now();
        const status = await this.executeHealthCheck(check);
        const duration = Date.now() - startTime;

        // Update health check status
        check.status = status;
        check.lastCheck = new Date();

        // Record metrics
        this.metricCollector.gauge(
          'health_check_duration',
          duration,
          'milliseconds',
          [
            { name: 'check', value: check.name },
            { name: 'status', value: status },
          ],
        );

        // Emit event
        this.eventEmitter.emit('health.check.completed', {
          checkId: check.id,
          status,
          duration,
        });
      } catch (error) {
        check.status = 'down';
        check.lastCheck = new Date();

        this.eventEmitter.emit('health.check.failed', {
          checkId: check.id,
          error,
        });
      }
    }
  }

  private async executeHealthCheck(check: HealthCheck): Promise<'up' | 'down' | 'degraded'> {
    switch (check.type) {
      case 'http':
        return this.executeHttpHealthCheck(check);
      case 'tcp':
        return this.executeTcpHealthCheck(check);
      case 'custom':
        return this.executeCustomHealthCheck(check);
      default:
        throw new Error(`Unknown health check type: ${check.type}`);
    }
  }

  private async executeHttpHealthCheck(check: HealthCheck): Promise<'up' | 'down' | 'degraded'> {
    // Implement HTTP health check
    return 'up';
  }

  private async executeTcpHealthCheck(check: HealthCheck): Promise<'up' | 'down' | 'degraded'> {
    // Implement TCP health check
    return 'up';
  }

  private async executeCustomHealthCheck(check: HealthCheck): Promise<'up' | 'down' | 'degraded'> {
    // Implement custom health check
    return 'up';
  }

  onModuleDestroy() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }
}

export { SystemMonitor };
export { MetricCollector } from './metrics.js';
export { PerformanceProfiler as PerformanceMonitor } from './profiler.js';
export * from './types.js';
export * from './interfaces.js';
export * from './MetricsService.js';
export * from './MetricsModule.js';
export * from './RedisMetricsStorage.js';
export * from './RealTimeMetricsAggregator.js';

// Re-export common types for convenience
export type {
  MetricLabel,
  MetricType,
  MetricUnit,
  Metric,
  Alert,
  HealthStatus,
  SystemMetrics,
  DatabaseMetrics,
  MetricsSnapshot,
  MetricValue,
  MetricsProviderOptions,
  MetricsCollectorConfig,
  MetricsStorage,
  MetricsQuery,
  AggregatedMetric
} from './types.js';
