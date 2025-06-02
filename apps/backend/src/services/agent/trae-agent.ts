import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

interface AgentMessage {
  type: string;
  timestamp: string;
  metadata: {
    version: string;
    priority: 'low' | 'medium' | 'high';
    source: string;
  };
  details?: Record<string, any>;
}

export class TraeAgent extends EventEmitter {
  private readonly logger = new Logger(TraeAgent.name);
  private readonly redis: Redis;
  private readonly subscriber: Redis;
  private isConnected = false;
  private readonly channels = {
    primary: 'agent:trae',
    broadcast: 'agent:broadcast',
    augment: 'agent:augment',
    heartbeat: 'agent:heartbeat',
    metrics: 'monitoring:metrics',
    alerts: 'monitoring:alerts'
  };

  constructor() {
    super();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
    
    this.setupSubscriptions();
    this.setupErrorHandling();
  }

  private setupSubscriptions(): void {
    this.subscriber.subscribe(this.channels.primary, (err) => {
      if (err) {
        this.logger.error('Subscription error:', err);
        return;
      }
      this.isConnected = true;
      this.logger.log('Subscribed to channels');
    });

    this.subscriber.on('message', async (channel, message) => {
      try {
        const parsedMessage = JSON.parse(message) as AgentMessage;
        await this.handleMessage(channel, parsedMessage);
      } catch (error) {
        this.logger.error('Error processing message:', error);
      }
    });
  }

  private setupErrorHandling(): void {
    this.redis.on('error', this.handleError.bind(this));
    this.subscriber.on('error', this.handleError.bind(this));
  }

  private async handleMessage(channel: string, message: AgentMessage): Promise<void> {
    this.logger.log(`Received message on ${channel}:`, message);

    if (message.type === 'task' && message.details?.action === 'ping') {
      const response: AgentMessage = {
        type: 'task_response',
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          priority: 'high',
          source: 'trae'
        },
        details: {
          action: 'pong',
          originalTimestamp: message.timestamp,
          status: 'success'
        }
      };

      await this.publishMessage(this.channels.primary, response);
      this.logger.log('Sent pong response');
    }
  }

  private async publishMessage(channel: string, message: AgentMessage): Promise<void> {
    try {
      await this.redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      this.logger.error(`Failed to publish message to ${channel}:`, error);
      throw error;
    }
  }

  private handleError(error: Error): void {
    this.logger.error('Redis error:', error);
    this.isConnected = false;
  }

  public async cleanup(): Promise<void> {
    try {
      await this.subscriber.unsubscribe();
      await this.subscriber.quit();
      await this.redis.quit();
    } catch (error) {
      this.logger.error('Cleanup error:', error);
    }
  }
}
