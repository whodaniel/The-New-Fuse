import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, register } from 'prom-client';
import { WebSocketMetrics, HealthStatus } from '../types/index.js';

@Injectable()
export class WebSocketMonitoring {
  private readonly logger = new Logger(WebSocketMonitoring.name);
  private registry: Registry;

  // Metrics
  private connectionsTotal!: Counter;
  private activeConnections!: Gauge;
  private messagesTotal!: Counter;
  private messageLatency!: Histogram;
  private errorsTotal!: Counter;
  private reconnectionsTotal!: Counter;
  private queueSize!: Gauge;
  private messageProcessingTime!: Histogram;

  constructor(registry?: Registry) {
    this.registry = registry || register;
    this.initializeMetrics();
  }

  /**
   * Initialize Prometheus metrics
   */
  private initializeMetrics(): void {
    // Total connections
    this.connectionsTotal = new Counter({
      name: 'websocket_connections_total',
      help: 'Total number of WebSocket connections',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // Active connections
    this.activeConnections = new Gauge({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections',
      registers: [this.registry],
    });

    // Total messages
    this.messagesTotal = new Counter({
      name: 'websocket_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['direction', 'channel'],
      registers: [this.registry],
    });

    // Message latency
    this.messageLatency = new Histogram({
      name: 'websocket_message_latency_seconds',
      help: 'WebSocket message latency in seconds',
      labelNames: ['channel'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    // Total errors
    this.errorsTotal = new Counter({
      name: 'websocket_errors_total',
      help: 'Total number of WebSocket errors',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // Total reconnections
    this.reconnectionsTotal = new Counter({
      name: 'websocket_reconnections_total',
      help: 'Total number of WebSocket reconnections',
      registers: [this.registry],
    });

    // Queue size
    this.queueSize = new Gauge({
      name: 'websocket_queue_size',
      help: 'Current size of message queue',
      registers: [this.registry],
    });

    // Message processing time
    this.messageProcessingTime = new Histogram({
      name: 'websocket_message_processing_seconds',
      help: 'Time to process a message in seconds',
      labelNames: ['channel'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.logger.log('Metrics initialized');
  }

  /**
   * Record new connection
   */
  public recordConnection(success: boolean = true): void {
    this.connectionsTotal.inc({ status: success ? 'success' : 'failed' });
    if (success) {
      this.activeConnections.inc();
    }
  }

  /**
   * Record disconnection
   */
  public recordDisconnection(): void {
    this.activeConnections.dec();
  }

  /**
   * Record message
   */
  public recordMessage(direction: 'inbound' | 'outbound', channel: string = 'default'): void {
    this.messagesTotal.inc({ direction, channel });
  }

  /**
   * Record message latency
   */
  public recordMessageLatency(latencyMs: number, channel: string = 'default'): void {
    this.messageLatency.observe({ channel }, latencyMs / 1000);
  }

  /**
   * Record error
   */
  public recordError(type: string = 'unknown'): void {
    this.errorsTotal.inc({ type });
  }

  /**
   * Record reconnection
   */
  public recordReconnection(): void {
    this.reconnectionsTotal.inc();
  }

  /**
   * Update queue size
   */
  public updateQueueSize(size: number): void {
    this.queueSize.set(size);
  }

  /**
   * Record message processing time
   */
  public recordProcessingTime(timeMs: number, channel: string = 'default'): void {
    this.messageProcessingTime.observe({ channel }, timeMs / 1000);
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics as JSON
   */
  public async getMetricsJSON(): Promise<WebSocketMetrics> {
    const metrics = await this.registry.getMetricsAsJSON();

    const result: WebSocketMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      messagesPerSecond: 0,
      averageLatency: 0,
      errors: 0,
      reconnections: 0,
    };

    for (const metric of metrics) {
      if (metric.name === 'websocket_connections_total') {
        result.totalConnections = metric.values.reduce((sum, v) => sum + (v.value as number), 0);
      } else if (metric.name === 'websocket_connections_active') {
        result.activeConnections = (metric.values[0]?.value as number) || 0;
      } else if (metric.name === 'websocket_messages_total') {
        result.totalMessages = metric.values.reduce((sum, v) => sum + (v.value as number), 0);
      } else if (metric.name === 'websocket_errors_total') {
        result.errors = metric.values.reduce((sum, v) => sum + (v.value as number), 0);
      } else if (metric.name === 'websocket_reconnections_total') {
        result.reconnections = (metric.values[0]?.value as number) || 0;
      }
    }

    return result;
  }

  /**
   * Get health status
   */
  public async getHealthStatus(additionalChecks?: {
    redis?: boolean;
    queueSize?: number;
    errors?: string[];
  }): Promise<HealthStatus> {
    const metrics = await this.getMetricsJSON();

    const healthy =
      metrics.activeConnections >= 0 &&
      (additionalChecks?.redis ?? true) &&
      (additionalChecks?.queueSize ?? 0) < 10000;

    return {
      healthy,
      timestamp: new Date(),
      connections: metrics.activeConnections,
      redis: additionalChecks?.redis ?? true,
      messageQueue: additionalChecks?.queueSize ?? 0,
      errors: additionalChecks?.errors ?? [],
    };
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.registry.clear();
    this.initializeMetrics();
    this.logger.log('Metrics reset');
  }

  /**
   * Get registry
   */
  public getRegistry(): Registry {
    return this.registry;
  }
}
