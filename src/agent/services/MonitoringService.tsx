import { Injectable, Logger } from "@nestjs/common";
import { PrometheusService } from './PrometheusService.js';
import { RedisService } from './RedisService.js';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Histogram, Counter, Gauge, register } from 'prom-client';
import { trace, Span, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

interface AgentMetrics {
  messagesSent: number;
  messagesReceived: number;
  processingTime: number;
  errorCount: number;
  successCount: number;
  lastActive: Date;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  activeAgents: number;
  totalMessages: number;
  errorRate: number;
}

/**
 * Agent-specific MonitoringService
 * This service is being consolidated with UnifiedMonitoringService
 * It now delegates most functionality to UnifiedMonitoringService while maintaining
 * backward compatibility for agent-specific monitoring needs
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly systemMetrics: SystemMetrics;
  private metricsInterval: NodeJS.Timeout;
  
  // Flag to indicate if we're using UnifiedMonitoringService
  private useUnifiedMonitoring = false;
  private unifiedMonitoring?: any; // UnifiedMonitoringService

  constructor(
    private prometheus: PrometheusService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {
    // Try to detect if UnifiedMonitoringService is available
    try {
      // This will be injected by the module system if available
      this.unifiedMonitoring = undefined; // Will be injected if available
      this.useUnifiedMonitoring = !!this.unifiedMonitoring;
      
      if (this.useUnifiedMonitoring) {
        this.logger.log('Using UnifiedMonitoringService for agent monitoring');
      } else {
        this.logger.log('UnifiedMonitoringService not available, using standalone agent monitoring');
        this.initializeMetrics();
      }
    } catch (error) {
      this.logger.warn('Failed to detect UnifiedMonitoringService, using standalone agent monitoring');
      this.initializeMetrics();
    }
  }

  private initializeMetrics(): void {
    // Prometheus metrics
    this.messageCounter = new Counter({
      name: 'agent_messages_total',
      help: 'Total number of agent messages',
      labelNames: ['direction', 'status'],
    });

    this.processingTimeHistogram = new Histogram({
      name: 'agent_processing_time_seconds',
      help: 'Agent message processing time distribution',
      buckets: [0.1, 0.5, 1, 2, 5],
      labelNames: ['agent_type'],
    });

    this.systemHealthGauge = new Gauge({
      name: 'system_health_status',
      help: 'Overall system health status (1 = healthy, 0 = unhealthy)',
    });

    // OpenTelemetry tracer
    this.tracer = trace.getTracer('monitoring-service');

    // Initialize system metrics
    this.systemMetrics = {
      cpuUsage: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        rss: 0,
      },
      activeAgents: 0,
      totalMessages: 0,
      errorRate: 0,
    };
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async (): Promise<void> {) => {
      try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        this.systemMetrics = {
          cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
          memoryUsage: {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            rss: memUsage.rss,
          },
          activeAgents: this.agentMetrics.size,
          totalMessages: Array.from(this.agentMetrics.values()).reduce(
            (total, agent) =>
              total + agent.messagesSent + agent.messagesReceived,
            0,
          ),
          errorRate: this.calculateErrorRate(),
        };

        await this.prometheus.recordSystemMetrics(this.systemMetrics);
        await this.redis.setSystemMetrics(this.systemMetrics);

        this.eventEmitter.emit("monitoring.metrics.updated", {
          system: this.systemMetrics,
          agents: Array.from(this.agentMetrics.entries()),
        });
      } catch (error) {
        this.logger.error("Failed to collect system metrics", error);
      }
    }, this.METRICS_INTERVAL);
  }

  private calculateErrorRate(): number {
    const metrics = Array.from(this.agentMetrics.values());
    const totalErrors = metrics.reduce(
      (total, agent) => total + agent.errorCount,
      0,
    );
    const totalMessages = metrics.reduce(
      (total, agent) => total + agent.messagesSent + agent.messagesReceived,
      0,
    );
    return totalMessages === 0 ? 0 : totalErrors / totalMessages;
  }

  async checkAgentHealth(agentId: string): Promise<{
    healthy: boolean;
    lastActive: Date | null;
    errorRate: number;
  }> {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics) {
      return { healthy: false, lastActive: null, errorRate: 0 };
    }

    const errorRate =
      metrics.errorCount / (metrics.messagesSent + metrics.messagesReceived);
    const lastActiveThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

    return {
      healthy: errorRate < 0.1 && metrics.lastActive > lastActiveThreshold,
      lastActive: metrics.lastActive,
      errorRate,
    };
  }

  onModuleDestroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}
