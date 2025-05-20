import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReliabilityMetricsService } from './ReliabilityMetricsService.js';
import { CapabilitySecurityService } from './CapabilitySecurityService.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  metrics: Record<string, any>;
  issues?: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface MonitoringMetrics {
  requestCount: number;
  errorCount: number;
  totalLatency: number;
  lastUpdate: number;
  healthChecks: HealthStatus[];
}

@Injectable()
export class MonitoringService {
  private metrics = new Map<string, Map<string, MonitoringMetrics>>();
  private healthStatuses = new Map<string, HealthStatus>();
  private readonly metricsRetention = 24 * 60 * 60 * 1000; // 24 hours
  private readonly healthCheckInterval = 60 * 1000; // 1 minute
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private reliabilityService: ReliabilityMetricsService,
    private securityService: CapabilitySecurityService
  ) {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.loadHistoricalMetrics();
    this.setupEventListeners();
    this.startHealthChecks();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('capability.executed', (data: any) => {
      this.recordMetrics(data.agentId, data.capabilityId, {
        latency: data.latency,
        success: data.success,
        error: data.error
      });
    });

    this.eventEmitter.on('agent.status.changed', (data: any) => {
      this.updateHealthStatus(data.agentId, data.status);
    });
  }

  private async loadHistoricalMetrics(): Promise<void> {
    const historical = await this.prisma.monitoringMetrics.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - this.metricsRetention)
        }
      }
    });

    for (const metric of historical) {
      this.initializeMetrics(metric.agentId, metric.capabilityId);
      const metrics = this.metrics.get(metric.agentId)!.get(metric.capabilityId)!;
      metrics.requestCount += metric.requestCount;
      metrics.errorCount += metric.errorCount;
      metrics.totalLatency += metric.totalLatency;
    }
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  async recordMetrics(
    agentId: string,
    capabilityId: string,
    data: {
      latency: number;
      success: boolean;
      error?: string;
    }
  ): Promise<void> {
    this.initializeMetrics(agentId, capabilityId);
    const metrics = this.metrics.get(agentId)!.get(capabilityId)!;

    metrics.requestCount++;
    if (!data.success) {
      metrics.errorCount++;
    }
    metrics.totalLatency += data.latency;
    metrics.lastUpdate = Date.now();

    // Persist metrics periodically
    if (metrics.requestCount % 100 === 0) {
      await this.persistMetrics(agentId, capabilityId, metrics);
    }

    // Check for anomalies
    this.detectAnomalies(agentId, capabilityId, metrics);
  }

  async getMetrics(
    agentId: string,
    capabilityId: string
  ): Promise<MonitoringMetrics | undefined> {
    return this.metrics.get(agentId)?.get(capabilityId);
  }

  async getHealthStatus(agentId: string): Promise<HealthStatus | undefined> {
    return this.healthStatuses.get(agentId);
  }

  private initializeMetrics(agentId: string, capabilityId: string): void {
    if (!this.metrics.has(agentId)) {
      this.metrics.set(agentId, new Map());
    }

    if (!this.metrics.get(agentId)!.has(capabilityId)) {
      this.metrics.get(agentId)!.set(capabilityId, {
        requestCount: 0,
        errorCount: 0,
        totalLatency: 0,
        lastUpdate: Date.now(),
        healthChecks: []
      });
    }
  }

  private async performHealthChecks(): Promise<void> {
    for (const [agentId, agentMetrics] of this.metrics.entries()) {
      const issues: HealthStatus['issues'] = [];
      let status: HealthStatus['status'] = 'healthy';

      // Check error rates
      for (const [capabilityId, metrics] of agentMetrics.entries()) {
        const errorRate = metrics.errorCount / metrics.requestCount;
        if (errorRate > 0.1) {
          issues.push({
            type: 'high_error_rate',
            description: `High error rate (${(errorRate * 100).toFixed(2)}%) for capability ${capabilityId}`,
            severity: errorRate > 0.2 ? 'high' : 'medium'
          });
          status = 'degraded';
        }

        // Check latency trends
        const avgLatency = metrics.totalLatency / metrics.requestCount;
        if (avgLatency > 1000) { // 1 second threshold
          issues.push({
            type: 'high_latency',
            description: `High average latency (${avgLatency.toFixed(2)}ms) for capability ${capabilityId}`,
            severity: avgLatency > 2000 ? 'high' : 'medium'
          });
          status = 'degraded';
        }
      }

      // Check agent responsiveness
      const lastUpdate = Math.min(...Array.from(agentMetrics.values()).map(m => m.lastUpdate));
      if (Date.now() - lastUpdate > 5 * 60 * 1000) { // 5 minutes threshold
        issues.push({
          type: 'agent_unresponsive',
          description: 'Agent has not reported metrics for over 5 minutes',
          severity: 'high'
        });
        status = 'unhealthy';
      }

      // Update health status
      this.healthStatuses.set(agentId, {
        status,
        timestamp: Date.now(),
        metrics: this.aggregateMetrics(agentMetrics),
        issues: issues.length > 0 ? issues : undefined
      });

      // Emit events for status changes
      this.eventEmitter.emit('monitoring.health.updated', {
        agentId,
        status,
        issues
      });
    }
  }

  private detectAnomalies(
    agentId: string,
    capabilityId: string,
    metrics: MonitoringMetrics
  ): void {
    // Calculate moving averages and detect sudden changes
    const recentRequests = metrics.requestCount - (metrics.healthChecks[0]?.metrics.requestCount || 0);
    const recentErrors = metrics.errorCount - (metrics.healthChecks[0]?.metrics.errorCount || 0);
    const recentErrorRate = recentErrors / recentRequests;

    if (recentErrorRate > 0.2 && recentRequests >= 10) {
      this.eventEmitter.emit('monitoring.anomaly.detected', {
        type: 'error_spike',
        agentId,
        capabilityId,
        errorRate: recentErrorRate,
        timestamp: Date.now()
      });
    }
  }

  private aggregateMetrics(
    agentMetrics: Map<string, MonitoringMetrics>
  ): Record<string, any> {
    const aggregate = {
      totalRequests: 0,
      totalErrors: 0,
      averageLatency: 0,
      capabilities: agentMetrics.size
    };

    for (const metrics of agentMetrics.values()) {
      aggregate.totalRequests += metrics.requestCount;
      aggregate.totalErrors += metrics.errorCount;
      aggregate.averageLatency += metrics.totalLatency;
    }

    aggregate.averageLatency /= aggregate.totalRequests;
    return aggregate;
  }

  private async persistMetrics(
    agentId: string,
    capabilityId: string,
    metrics: MonitoringMetrics
  ): Promise<void> {
    try {
      await this.prisma.monitoringMetrics.create({
        data: {
          agentId,
          capabilityId,
          requestCount: metrics.requestCount,
          errorCount: metrics.errorCount,
          totalLatency: metrics.totalLatency,
          timestamp: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to persist metrics:', error);
    }
  }

  private updateHealthStatus(agentId: string, status: HealthStatus['status']): void {
    const currentStatus = this.healthStatuses.get(agentId);
    if (!currentStatus || currentStatus.status !== status) {
      this.healthStatuses.set(agentId, {
        status,
        timestamp: Date.now(),
        metrics: currentStatus?.metrics || {},
        issues: currentStatus?.issues
      });

      this.eventEmitter.emit('monitoring.status.changed', {
        agentId,
        oldStatus: currentStatus?.status,
        newStatus: status,
        timestamp: Date.now()
      });
    }
  }
}