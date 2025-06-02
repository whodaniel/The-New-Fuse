import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

interface MetricData {
  messageType: string;
  processingTime: number;
  success: boolean;
  errorDetails?: string;
}

export class TraeMonitor {
  private readonly logger = new Logger(TraeMonitor.name);
  private readonly redis: Redis;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private readonly metrics: Map<string, MetricData[]> = new Map();
  
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  public async initialize(): Promise<void> {
    try {
      // Verify Redis connection
      const pingResult = await this.redis.ping();
      if (pingResult !== 'PONG') {
        throw new Error('Redis connection failed');
      }
      this.logger.log('TraeMonitor initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize TraeMonitor:', error);
      throw error;
    }
  }

  public async startHeartbeat(agentId: string): Promise<void> {
    // Clear any existing heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send initial heartbeat
    await this.sendHeartbeat(agentId);

    // Set up heartbeat interval (every 30 seconds)
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat(agentId);
      } catch (error) {
        this.logger.error('Error sending heartbeat:', error);
      }
    }, 30000); // 30 seconds
  }

  private async sendHeartbeat(agentId: string): Promise<void> {
    const heartbeat = {
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.1.0',
        source: agentId,
        status: 'active'
      }
    };

    await this.redis.publish('agent:heartbeat', JSON.stringify(heartbeat));
  }

  public enableMetrics(options: { collectInterval: number, reportInterval: number }): void {
    // Set up metrics collection interval
    this.metricsCollectionInterval = setInterval(() => {
      this.reportMetrics();
    }, options.reportInterval);
  }

  public recordMetric(data: MetricData): void {
    const messageType = data.messageType;
    if (!this.metrics.has(messageType)) {
      this.metrics.set(messageType, []);
    }
    
    const metricsList = this.metrics.get(messageType);
    if (metricsList) {
      metricsList.push(data);
    }
  }

  private async reportMetrics(): Promise<void> {
    const metricReport = {
      type: 'metric',
      timestamp: new Date().toISOString(),
      data: {
        messageFlow: this.calculateMessageFlow(),
        errorRate: this.calculateErrorRate(),
        averageProcessingTime: this.calculateAverageProcessingTime(),
        queueLength: this.calculateQueueLength()
      }
    };

    await this.redis.publish('monitoring:metrics', JSON.stringify(metricReport));
    
    // Clear old metrics after reporting
    this.metrics.clear();
  }

  private calculateMessageFlow(): number {
    let totalMessages = 0;
    this.metrics.forEach(metricsList => {
      totalMessages += metricsList.length;
    });
    return totalMessages;
  }

  private calculateErrorRate(): number {
    let totalErrors = 0;
    let totalMessages = 0;
    
    this.metrics.forEach(metricsList => {
      totalMessages += metricsList.length;
      metricsList.forEach(metric => {
        if (!metric.success) {
          totalErrors++;
        }
      });
    });
    
    return totalMessages > 0 ? (totalErrors / totalMessages) : 0;
  }

  private calculateAverageProcessingTime(): number {
    let totalTime = 0;
    let totalMessages = 0;
    
    this.metrics.forEach(metricsList => {
      metricsList.forEach(metric => {
        totalTime += metric.processingTime;
        totalMessages++;
      });
    });
    
    return totalMessages > 0 ? (totalTime / totalMessages) : 0;
  }

  private calculateQueueLength(): number {
    // This would be implemented with actual queue monitoring
    // For now, return a placeholder value
    return 0;
  }

  public onAlert(callback: (alert: any) => void): void {
    // Subscribe to alerts channel
    const alertSubscriber = this.redis.duplicate();
    alertSubscriber.subscribe('monitoring:alerts');
    alertSubscriber.on('message', (_channel, message) => {
      try {
        const alert = JSON.parse(message);
        callback(alert);
      } catch (error) {
        this.logger.error('Error processing alert:', error);
      }
    });
  }

  public async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
    
    await this.redis.quit();
  }
}