import { RedisMonitor } from './redis-monitor.js';
import { AgentMonitor } from './agent-monitor.js';
import { MetricsCollector } from './metrics-collector.js';
import { SystemMetrics, HealthStatus, Alert, MonitoringOptions } from './types.js';
import { Logger } from '@the-new-fuse/utils';

const logger = new Logger('UnifiedMonitor');

export interface AgentStatus {
  id: string;
  status: 'active' | 'inactive' | 'error';
  lastSeen: Date;
  metrics?: SystemMetrics;
  errors?: string[];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  activeAgents: number;
  messageFlow: number;
  errorRate: number;
  latency: number;
  timestamp: Date;
  details?: Record<string, any>;
}

export class UnifiedMonitor {
  private readonly redisMonitor: RedisMonitor;
  private readonly agentMonitor: AgentMonitor;
  private readonly metrics: MetricsCollector;
  private readonly options: MonitoringOptions;

  constructor(options: Partial<MonitoringOptions> = {}) {
    this.options = {
      metricsPrefix: 'monitor:',
      retentionPeriod: 86400,
      aggregationInterval: 60000,
      maxDataPoints: 1000,
      ...options
    };

    this.redisMonitor = new RedisMonitor();
    this.agentMonitor = AgentMonitor.getInstance();
    this.metrics = new MetricsCollector(this.redisMonitor.getClient(), this.options);

    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Monitor agent communication
    this.redisMonitor.subscribe('monitoring:metrics', (data: unknown) => {
      this.processMetrics(data);
    });

    // Monitor alerts
    this.redisMonitor.subscribe('monitoring:alerts', (alert: Alert) => {
      this.handleAlert(alert);
    });
  }

  private processMetrics(data: unknown): void {
    try {
      // Process and store metrics
      this.metrics.recordValue('system.metrics', 1, {
        type: typeof data === 'object' ? (data as any)?.type : 'unknown'
      });

      // Check for anomalies
      if (this.detectAnomaly(data)) {
        this.triggerAlert(data);
      }
    } catch (error) {
      logger.error('Error processing metrics:', error);
    }
  }

  private detectAnomaly(data: unknown): boolean {
    // Implement anomaly detection logic
    return false;
  }

  private async triggerAlert(data: unknown): Promise<void> {
    try {
      const alert: Alert = {
        id: crypto.randomUUID(),
        name: 'Anomaly Detected',
        level: 'warning',
        metric: 'cpu',
        value: 0,
        threshold: 0,
        message: 'Anomaly detected in metrics',
        timestamp: Date.now()
      };

      await this.redisMonitor.publish('monitoring:alerts', alert);
    } catch (error) {
      logger.error('Error triggering alert:', error);
    }
  }

  private handleAlert(alert: Alert): void {
    logger.warn(`Alert received: ${alert.message}`, {
      alert
    });
  }

  public getAgentStatus(agentId: string): AgentStatus {
    return {
      id: agentId,
      status: this.agentMonitor.getStatus(agentId),
      lastSeen: new Date(this.redisMonitor.getLastMessage(agentId)),
      metrics: this.metrics.getLatestMetrics()?.database[agentId] as SystemMetrics
    };
  }

  public getSystemHealth(): SystemHealth {
    const metrics = this.metrics.getLatestMetrics();
    const errorRate = this.calculateErrorRate();

    return {
      status: this.determineSystemStatus(errorRate),
      activeAgents: this.agentMonitor.getActiveAgents().length,
      messageFlow: metrics?.database.main?.queries ?? 0,
      errorRate,
      latency: metrics?.database.main?.avgLatencyMs ?? 0,
      timestamp: new Date(),
      details: metrics
    };
  }

  private calculateErrorRate(): number {
    const metrics = this.metrics.getLatestMetrics();
    if (!metrics?.database.main) return 0;

    const { errors = 0, queries = 0 } = metrics.database.main;
    return queries > 0 ? errors / queries : 0;
  }

  private determineSystemStatus(errorRate: number): SystemHealth['status'] {
    if (errorRate >= 0.1) return 'unhealthy';
    if (errorRate >= 0.05) return 'degraded';
    return 'healthy';
  }

  public async stop(): Promise<void> {
    await Promise.all([
      this.metrics.stopCollection(),
      this.redisMonitor.disconnect(),
      this.agentMonitor.stop()
    ]);
  }
}
