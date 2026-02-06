import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';

export interface MetricEvent {
  type: 'system' | 'application' | 'agent' | 'task';
  severity: 'info' | 'warning' | 'error';
  metric: string;
  value: number;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
}

export interface ApplicationMetrics {
  responseTime: number;
  errorRate: number;
}

export interface AgentMetrics {
  activeAgents: number;
}

@Injectable()
export class MetricsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsProcessor.name);
  private metricsBuffer: MetricEvent[] = [];
  private readonly maxBufferSize = 1000;
  private processingInterval: NodeJS.Timeout | null = null;

  onModuleInit() {
    this.logger.log('Metrics processor initialized');
    this.startPeriodicProcessing();
  }

  onModuleDestroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    this.flushMetrics();
  }

  async trackEvent(eventType: string, data: any = {}) {
    try {
      const metric: MetricEvent = {
        type: 'application',
        severity: 'info',
        metric: eventType,
        value: typeof data.value === 'number' ? data.value : 1,
        timestamp: new Date(),
        metadata: data,
      };
      this.addToBuffer(metric);
    } catch (error) {
      this.logger.error('Failed to track event', { error, eventType, data });
    }
  }

  async processSystemMetrics() {
    try {
      const systemMetrics = await this.getSystemMetrics();
      if (systemMetrics.cpuUsage > 80) {
        this.addToBuffer({
          type: 'system',
          severity: 'warning',
          metric: 'cpu_usage',
          value: systemMetrics.cpuUsage,
          timestamp: new Date(),
        });
      }
      if (systemMetrics.memoryUsage > 80) {
        this.addToBuffer({
          type: 'system',
          severity: 'warning',
          metric: 'memory_usage',
          value: systemMetrics.memoryUsage,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error processing system metrics', { error });
    }
  }

  private addToBuffer(metric: MetricEvent) {
    this.metricsBuffer.push(metric);
    if (this.metricsBuffer.length > this.maxBufferSize) {
      this.metricsBuffer.shift();
    }
  }

  private startPeriodicProcessing() {
    this.processingInterval = setInterval(async () => {
      await this.processSystemMetrics();
      await this.flushMetrics();
    }, 30000);
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) {
      return;
    }
    try {
      this.logger.debug('Flushing metrics', { count: this.metricsBuffer.length });
      this.metricsBuffer.length = 0;
    } catch (error) {
      this.logger.error('Failed to flush metrics', { error });
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    return {
      cpuUsage: os.loadavg()[0],
      memoryUsage: ((totalMemory - freeMemory) / totalMemory) * 100,
    };
  }

  getMetricsBuffer(): MetricEvent[] {
    return [...this.metricsBuffer];
  }

  clearBuffer() {
    this.metricsBuffer.length = 0;
    this.logger.log('Metrics buffer cleared');
  }
}
