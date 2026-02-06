// Monitoring Dashboard Service - Comprehensive system observability and metrics aggregation
// Integrates performance monitoring, caching statistics, job queue metrics, WebSocket data, and A2A protocol analytics

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OptimizedA2AService } from '../../a2a-enhanced/src/optimized-a2a.service';
import { RedisCacheService } from '../../cache/src/redis-cache.service';
import { OptimizedQueueService } from '../../job-queue/src/optimized-queue.service';
import { OptimizedWebSocketService } from '../../websocket/src/optimized-websocket.service';

export interface SystemMetrics {
  timestamp: number;
  system: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    totalKeys: number;
    connections: number;
  };
  queue: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    throughput: number;
  };
  websocket: {
    activeConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    errorRate: number;
  };
  a2a: {
    messagesSent: number;
    messagesReceived: number;
    averageLatency: number;
    activeAgents: number;
    errorRate: number;
  };
  database: {
    activeConnections: number;
    slowQueries: number;
    averageQueryTime: number;
    connectionPoolSize: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  service: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
  resolved: boolean;
}

export interface DashboardData {
  overview: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    totalUsers: number;
    activeAgents: number;
    totalWorkflows: number;
    systemLoad: number;
  };
  realTimeMetrics: SystemMetrics;
  historicalData: {
    timeRange: string;
    dataPoints: SystemMetrics[];
  };
  alerts: PerformanceAlert[];
  healthChecks: {
    redis: { status: string; latency: number };
    database: { status: string; latency: number };
    queue: { status: string; pendingJobs: number };
    websocket: { status: string; connections: number };
    a2a: { status: string; agents: number };
  };
  trends: {
    userGrowth: number[];
    agentActivity: number[];
    workflowExecution: number[];
    systemPerformance: number[];
  };
}

@Injectable()
export class MonitoringDashboardService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringDashboardService.name);

  private metricsHistory: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isCollecting = false;

  // Performance thresholds for alerting
  private readonly thresholds = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    cacheHitRate: { warning: 70, critical: 50 },
    queueThroughput: { warning: 50, critical: 20 },
    websocketLatency: { warning: 1000, critical: 2000 },
    a2aErrorRate: { warning: 5, critical: 10 },
    dbQueryTime: { warning: 500, critical: 1000 },
  };

  private metricsInterval: NodeJS.Timeout;
  private alertsInterval: NodeJS.Timeout;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private cacheService: RedisCacheService,
    private queueService: OptimizedQueueService,
    private websocketService: OptimizedWebSocketService,
    private a2aService: OptimizedA2AService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeMonitoring();
    this.startMetricsCollection();
    this.startAlertProcessing();
    this.startHealthChecks();
    this.logger.log('Monitoring Dashboard Service initialized');
  }

  private async initializeMonitoring(): Promise<void> {
    // Load historical metrics from cache if available
    try {
      const cachedMetrics = await this.cacheService.get('monitoring:historical_metrics');
      if (cachedMetrics) {
        this.metricsHistory = cachedMetrics;
      }

      const cachedAlerts = await this.cacheService.get('monitoring:alerts');
      if (cachedAlerts) {
        this.alerts = cachedAlerts;
      }
    } catch (error) {
      this.logger.error('Error loading cached monitoring data:', error);
    }
  }

  // Main dashboard data aggregation
  async getDashboardData(): Promise<DashboardData> {
    const currentMetrics = await this.collectCurrentMetrics();
    const healthChecks = await this.performHealthChecks();
    const trends = await this.calculateTrends();

    const overallStatus = this.calculateOverallStatus(currentMetrics, healthChecks);

    return {
      overview: {
        status: overallStatus,
        uptime: currentMetrics.system.uptime,
        totalUsers: await this.getTotalUsers(),
        activeAgents: currentMetrics.a2a.activeAgents,
        totalWorkflows: await this.getTotalWorkflows(),
        systemLoad: currentMetrics.system.cpu,
      },
      realTimeMetrics: currentMetrics,
      historicalData: {
        timeRange: '24h',
        dataPoints: this.getRecentMetrics(24 * 60), // Last 24 hours
      },
      alerts: this.getActiveAlerts(),
      healthChecks,
      trends,
    };
  }

  // Real-time metrics collection
  private async collectCurrentMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    const [systemStats, cacheStats, queueMetrics, websocketMetrics, a2aMetrics, databaseStats] =
      await Promise.all([
        this.getSystemStats(),
        this.cacheService.getStats(),
        this.queueService.getQueueMetrics(),
        this.websocketService.getConnectionMetrics(),
        this.a2aService.getMetrics(),
        this.getDatabaseStats(),
      ]);

    const metrics: SystemMetrics = {
      timestamp,
      system: systemStats,
      cache: {
        hitRate: cacheStats.hitRate,
        memoryUsage: cacheStats.memory,
        totalKeys: cacheStats.keys,
        connections: 1, // Redis connections
      },
      queue: {
        totalJobs: this.calculateTotalJobs(queueMetrics),
        activeJobs: this.calculateActiveJobs(queueMetrics),
        completedJobs: this.calculateCompletedJobs(queueMetrics),
        failedJobs: this.calculateFailedJobs(queueMetrics),
        throughput: this.calculateQueueThroughput(queueMetrics),
      },
      websocket: {
        activeConnections: websocketMetrics.activeConnections,
        messagesPerSecond: websocketMetrics.messagesPerSecond,
        averageLatency: websocketMetrics.averageLatency,
        errorRate: websocketMetrics.errorRate,
      },
      a2a: {
        messagesSent: a2aMetrics.messagesSent,
        messagesReceived: a2aMetrics.messagesReceived,
        averageLatency: a2aMetrics.averageLatency,
        activeAgents: a2aMetrics.onlineAgents,
        errorRate: a2aMetrics.errorRate,
      },
      database: databaseStats,
    };

    return metrics;
  }

  // Health checks for all services
  private async performHealthChecks(): Promise<DashboardData['healthChecks']> {
    const [redisHealth, queueHealth] = await Promise.all([
      this.cacheService.healthCheck(),
      this.checkQueueHealth(),
    ]);

    return {
      redis: {
        status: redisHealth.status,
        latency: redisHealth.latency,
      },
      database: {
        status: 'healthy', // Implement database health check
        latency: 50,
      },
      queue: {
        status: queueHealth.status,
        pendingJobs: queueHealth.pendingJobs,
      },
      websocket: {
        status: 'healthy', // Implement WebSocket health check
        connections: (await this.websocketService.getConnectionMetrics()).activeConnections,
      },
      a2a: {
        status: 'healthy', // Implement A2A health check
        agents: (await this.a2aService.getMetrics()).onlineAgents,
      },
    };
  }

  // Trend calculation for dashboard charts
  private async calculateTrends(): Promise<DashboardData['trends']> {
    const last24Hours = this.getRecentMetrics(24 * 60);

    return {
      userGrowth: this.extractTrend(last24Hours, 'user_growth'),
      agentActivity: this.extractTrend(last24Hours, 'agent_activity'),
      workflowExecution: this.extractTrend(last24Hours, 'workflow_execution'),
      systemPerformance: this.extractTrend(last24Hours, 'system_performance'),
    };
  }

  // Alert management
  private async processAlerts(metrics: SystemMetrics): Promise<void> {
    const newAlerts: PerformanceAlert[] = [];

    // CPU Alert
    if (metrics.system.cpu > this.thresholds.cpu.critical) {
      newAlerts.push(
        this.createAlert(
          'critical',
          'system',
          'cpu',
          metrics.system.cpu,
          this.thresholds.cpu.critical
        )
      );
    } else if (metrics.system.cpu > this.thresholds.cpu.warning) {
      newAlerts.push(
        this.createAlert(
          'warning',
          'system',
          'cpu',
          metrics.system.cpu,
          this.thresholds.cpu.warning
        )
      );
    }

    // Memory Alert
    if (metrics.system.memory > this.thresholds.memory.critical) {
      newAlerts.push(
        this.createAlert(
          'critical',
          'system',
          'memory',
          metrics.system.memory,
          this.thresholds.memory.critical
        )
      );
    } else if (metrics.system.memory > this.thresholds.memory.warning) {
      newAlerts.push(
        this.createAlert(
          'warning',
          'system',
          'memory',
          metrics.system.memory,
          this.thresholds.memory.warning
        )
      );
    }

    // Cache Hit Rate Alert
    if (metrics.cache.hitRate < this.thresholds.cacheHitRate.critical) {
      newAlerts.push(
        this.createAlert(
          'critical',
          'cache',
          'hitRate',
          metrics.cache.hitRate,
          this.thresholds.cacheHitRate.critical
        )
      );
    } else if (metrics.cache.hitRate < this.thresholds.cacheHitRate.warning) {
      newAlerts.push(
        this.createAlert(
          'warning',
          'cache',
          'hitRate',
          metrics.cache.hitRate,
          this.thresholds.cacheHitRate.warning
        )
      );
    }

    // WebSocket Latency Alert
    if (metrics.websocket.averageLatency > this.thresholds.websocketLatency.critical) {
      newAlerts.push(
        this.createAlert(
          'critical',
          'websocket',
          'latency',
          metrics.websocket.averageLatency,
          this.thresholds.websocketLatency.critical
        )
      );
    } else if (metrics.websocket.averageLatency > this.thresholds.websocketLatency.warning) {
      newAlerts.push(
        this.createAlert(
          'warning',
          'websocket',
          'latency',
          metrics.websocket.averageLatency,
          this.thresholds.websocketLatency.warning
        )
      );
    }

    // A2A Error Rate Alert
    if (metrics.a2a.errorRate > this.thresholds.a2aErrorRate.critical) {
      newAlerts.push(
        this.createAlert(
          'critical',
          'a2a',
          'errorRate',
          metrics.a2a.errorRate,
          this.thresholds.a2aErrorRate.critical
        )
      );
    } else if (metrics.a2a.errorRate > this.thresholds.a2aErrorRate.warning) {
      newAlerts.push(
        this.createAlert(
          'warning',
          'a2a',
          'errorRate',
          metrics.a2a.errorRate,
          this.thresholds.a2aErrorRate.warning
        )
      );
    }

    // Database Query Time Alert
    if (metrics.database.averageQueryTime > this.thresholds.dbQueryTime.critical) {
      newAlerts.push(
        this.createAlert(
          'critical',
          'database',
          'queryTime',
          metrics.database.averageQueryTime,
          this.thresholds.dbQueryTime.critical
        )
      );
    } else if (metrics.database.averageQueryTime > this.thresholds.dbQueryTime.warning) {
      newAlerts.push(
        this.createAlert(
          'warning',
          'database',
          'queryTime',
          metrics.database.averageQueryTime,
          this.thresholds.dbQueryTime.warning
        )
      );
    }

    // Add new alerts and resolve old ones
    for (const alert of newAlerts) {
      const existingAlert = this.alerts.find(
        (a) => a.service === alert.service && a.metric === alert.metric && !a.resolved
      );

      if (!existingAlert) {
        this.alerts.push(alert);
        this.logger.warn(
          `New alert: ${alert.type} - ${alert.service}.${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`
        );
      }
    }

    // Auto-resolve alerts that are no longer triggered
    this.autoResolveAlerts(metrics);

    // Persist alerts to cache
    await this.cacheService.set('monitoring:alerts', this.alerts, { ttl: 3600 });
  }

  private createAlert(
    type: 'warning' | 'error' | 'critical',
    service: string,
    metric: string,
    value: number,
    threshold: number
  ): PerformanceAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      service,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      message: `${service.toUpperCase()}: ${metric} is ${value} (threshold: ${threshold})`,
      resolved: false,
    };
  }

  private autoResolveAlerts(currentMetrics: SystemMetrics): void {
    for (const alert of this.alerts) {
      if (alert.resolved) continue;

      let currentValue: number;
      let threshold: number;

      // Get current value for the alert metric
      switch (alert.service) {
        case 'system':
          currentValue =
            alert.metric === 'cpu' ? currentMetrics.system.cpu : currentMetrics.system.memory;
          threshold =
            alert.metric === 'cpu' ? this.thresholds.cpu.warning : this.thresholds.memory.warning;
          break;
        case 'cache':
          currentValue = currentMetrics.cache.hitRate;
          threshold = this.thresholds.cacheHitRate.warning;
          break;
        case 'websocket':
          currentValue = currentMetrics.websocket.averageLatency;
          threshold = this.thresholds.websocketLatency.warning;
          break;
        case 'a2a':
          currentValue = currentMetrics.a2a.errorRate;
          threshold = this.thresholds.a2aErrorRate.warning;
          break;
        case 'database':
          currentValue = currentMetrics.database.averageQueryTime;
          threshold = this.thresholds.dbQueryTime.warning;
          break;
        default:
          continue;
      }

      // Auto-resolve if metric is back to normal
      const isResolved =
        alert.metric === 'hitRate' ? currentValue > threshold : currentValue < threshold;

      if (isResolved) {
        alert.resolved = true;
        this.logger.log(`Alert resolved: ${alert.service}.${alert.metric} back to normal`);
      }
    }
  }

  // Periodic tasks
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      if (this.isCollecting) return;

      this.isCollecting = true;
      try {
        const metrics = await this.collectCurrentMetrics();
        this.metricsHistory.push(metrics);

        // Keep only last 1440 entries (24 hours of minute-by-minute data)
        if (this.metricsHistory.length > 1440) {
          this.metricsHistory = this.metricsHistory.slice(-1440);
        }

        // Cache metrics for persistence
        await this.cacheService.set('monitoring:historical_metrics', this.metricsHistory, {
          ttl: 86400,
        });
      } catch (error) {
        this.logger.error('Error collecting metrics:', error);
      } finally {
        this.isCollecting = false;
      }
    }, 60000); // Collect every minute
  }

  private startAlertProcessing(): void {
    this.alertsInterval = setInterval(async () => {
      try {
        const currentMetrics = await this.collectCurrentMetrics();
        await this.processAlerts(currentMetrics);
      } catch (error) {
        this.logger.error('Error processing alerts:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.logger.error('Error performing health checks:', error);
      }
    }, 300000); // Health check every 5 minutes
  }

  // Utility methods
  private getRecentMetrics(minutes: number): SystemMetrics[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.metricsHistory.filter((m) => m.timestamp > cutoff);
  }

  private getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter((a) => !a.resolved).slice(-50); // Last 50 active alerts
  }

  private calculateOverallStatus(
    metrics: SystemMetrics,
    healthChecks: DashboardData['healthChecks']
  ): 'healthy' | 'warning' | 'critical' {
    const criticalConditions = [
      metrics.system.cpu > this.thresholds.cpu.critical,
      metrics.system.memory > this.thresholds.memory.critical,
      metrics.cache.hitRate < this.thresholds.cacheHitRate.critical,
      healthChecks.redis.status !== 'healthy',
      healthChecks.database.status !== 'healthy',
    ];

    const warningConditions = [
      metrics.system.cpu > this.thresholds.cpu.warning,
      metrics.system.memory > this.thresholds.memory.warning,
      metrics.cache.hitRate < this.thresholds.cacheHitRate.warning,
      metrics.websocket.averageLatency > this.thresholds.websocketLatency.warning,
    ];

    if (criticalConditions.some((condition) => condition)) {
      return 'critical';
    } else if (warningConditions.some((condition) => condition)) {
      return 'warning';
    }

    return 'healthy';
  }

  private extractTrend(metrics: SystemMetrics[], type: string): number[] {
    // Simple trend extraction - implement based on your specific needs
    return metrics.map((m) => {
      switch (type) {
        case 'user_growth':
          return m.websocket.activeConnections;
        case 'agent_activity':
          return m.a2a.activeAgents;
        case 'workflow_execution':
          return m.queue.completedJobs;
        case 'system_performance':
          return 100 - m.system.cpu;
        default:
          return 0;
      }
    });
  }

  // System stats collection
  private async getSystemStats(): Promise<SystemMetrics['system']> {
    // Implement actual system stats collection
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      uptime: process.uptime(),
    };
  }

  private async getDatabaseStats(): Promise<SystemMetrics['database']> {
    // Implement actual database stats collection
    return {
      activeConnections: 10,
      slowQueries: 0,
      averageQueryTime: 25,
      connectionPoolSize: 20,
    };
  }

  private async getTotalUsers(): Promise<number> {
    // Implement actual user count
    return 150;
  }

  private async getTotalWorkflows(): Promise<number> {
    // Implement actual workflow count
    return 45;
  }

  private calculateTotalJobs(queueMetrics: any): number {
    if (typeof queueMetrics === 'object' && queueMetrics instanceof Map) {
      return Array.from(queueMetrics.values()).reduce(
        (total, metrics) =>
          total + (metrics.pending + metrics.active + metrics.completed + metrics.failed),
        0
      );
    }
    return 0;
  }

  private calculateActiveJobs(queueMetrics: any): number {
    if (typeof queueMetrics === 'object' && queueMetrics instanceof Map) {
      return Array.from(queueMetrics.values()).reduce(
        (total, metrics) => total + metrics.active,
        0
      );
    }
    return 0;
  }

  private calculateCompletedJobs(queueMetrics: any): number {
    if (typeof queueMetrics === 'object' && queueMetrics instanceof Map) {
      return Array.from(queueMetrics.values()).reduce(
        (total, metrics) => total + metrics.completed,
        0
      );
    }
    return 0;
  }

  private calculateFailedJobs(queueMetrics: any): number {
    if (typeof queueMetrics === 'object' && queueMetrics instanceof Map) {
      return Array.from(queueMetrics.values()).reduce(
        (total, metrics) => total + metrics.failed,
        0
      );
    }
    return 0;
  }

  private calculateQueueThroughput(queueMetrics: any): number {
    if (typeof queueMetrics === 'object' && queueMetrics instanceof Map) {
      return Array.from(queueMetrics.values()).reduce(
        (total, metrics) => total + (metrics.throughput || 0),
        0
      );
    }
    return 0;
  }

  private async checkQueueHealth(): Promise<{ status: string; pendingJobs: number }> {
    try {
      const queueMetrics = await this.queueService.getQueueMetrics();
      const pendingJobs = this.calculateActiveJobs(queueMetrics);

      return {
        status: pendingJobs > 1000 ? 'warning' : 'healthy',
        pendingJobs,
      };
    } catch (error) {
      return { status: 'unhealthy', pendingJobs: 0 };
    }
  }

  // API methods for dashboard endpoints
  async getMetricsHistory(timeRange: string = '24h'): Promise<SystemMetrics[]> {
    const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
    return this.getRecentMetrics(hours * 60);
  }

  async getAlerts(limit: number = 50): Promise<PerformanceAlert[]> {
    return this.alerts.slice(-limit);
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      await this.cacheService.set('monitoring:alerts', this.alerts, { ttl: 3600 });
      return true;
    }
    return false;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.logger.log('Monitoring Dashboard Service shutdown complete');
  }
}
