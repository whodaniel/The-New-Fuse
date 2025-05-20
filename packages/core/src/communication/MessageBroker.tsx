import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';
import { Message, CommunicationProtocol, MessageType, MessagePriority } from './Protocol.js';
import { EventEmitter } from 'events';
import { RedisService } from '../redis/redis.service.js';
import { AICommAnalyticsService } from './services/AICommAnalyticsService.js';

interface SubscriptionOptions {
  pattern: string;
  handler: (message: Message) => Promise<void>;
  priority?: MessagePriority;
}

interface PublishOptions {
  channel: string;
  priority?: MessagePriority;
  ttl?: number;
  persist?: boolean;
}

@Injectable()
export class MessageBroker extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;
  private logger: Logger;
  private protocol: CommunicationProtocol;
  private subscriptions: Map<string, Set<(message: Message) => Promise<void>>>;
  private readonly HIGH_PRIORITY_PREFIX = 'high:';
  private readonly PERSIST_PREFIX = 'persist:';

  constructor(
    private readonly redisService: RedisService,
    private readonly analyticsService: AICommAnalyticsService
  ) {
    super();
    this.logger = new Logger(MessageBroker.name);
    this.subscriptions = new Map();
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.publisher = new Redis((process as any).env.REDIS_URL);
      this.subscriber = new Redis((process as any).env.REDIS_URL);

      this.subscriber.on('message', async (channel, message) => {
        try {
          const parsedMessage = JSON.parse(message);
          const handlers = this.subscriptions.get(channel);
          if (handlers) {
            const promises = Array.from(handlers).map(handler => handler(parsedMessage));
            await Promise.all(promises);
          }
        } catch (error) {
          this.logger.error(`Error handling message on channel ${channel}:`, error);
        }
      });
    } catch (error) {
      this.logger.error('Failed to connect MessageBroker:', error);
    }
  }

  private async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher?.disconnect(),
      this.subscriber?.disconnect()
    ]);
  }

  async publish(message: Message, options: PublishOptions): Promise<void> {
    const startTime = Date.now();
    try {
      // Validate message
      await this.protocol.validateMessage(message);

      const messageString = JSON.stringify(message);

      if (options.persist) {
        // Store message in persistent storage
        await this.publisher.lpush(this.PERSIST_PREFIX + options.channel, messageString);
        if (options.ttl) {
          await this.publisher.expire(this.PERSIST_PREFIX + options.channel, options.ttl);
        }
      }

      // Publish message
      await this.publisher.publish(options.channel, messageString);
      this.emit('messagePublished', { channel: options.channel, message });

      // Record communication metrics
      await this.analyticsService.recordCommunication({
        ...message,
        channel: options.channel,
        responseTime: Date.now() - startTime,
        status: 'sent'
      });

    } catch (error) {
      this.logger.error('Error publishing message:', error);

      // Record failed communication
      await this.analyticsService.recordCommunication({
        ...message,
        channel: options.channel,
        responseTime: Date.now() - startTime,
        status: 'error',
        error: error.message
      });

      throw error;
    }
  }

  async subscribe(options: SubscriptionOptions): Promise<void> {
    try {
      const channel = this.getChannelName({
        channel: options.pattern,
        priority: options.priority
      });

      // Register handler
      const handlers = this.subscriptions.get(channel) || new Set();
      handlers.add(options.handler);
      this.subscriptions.set(channel, handlers);

      await this.subscriber.subscribe(channel);
      this.logger.log(`Subscribed to channel: ${channel}`);

      // Process any persisted messages
      await this.processPersistentMessages(channel, options.handler);

    } catch (error) {
      this.logger.error('Error subscribing to channel:', error);
    }
  }

  async unsubscribe(channel: string, handler: (message: Message) => Promise<void>): Promise<void> {
    try {
      const handlers = this.subscriptions.get(channel);
      if (!handlers) {
        return;
      }

      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
        await this.subscriber.unsubscribe(channel);
        this.logger.log(`Unsubscribed from channel: ${channel}`);
      }

    } catch (error) {
      this.logger.error('Error unsubscribing from channel:', error);
    }
  }

  private async processPersistentMessages(channel: string, handler: (message: Message) => Promise<void>): Promise<void> {
    const persistentChannel = this.PERSIST_PREFIX + channel;
    try {
      const messages = await this.publisher.lrange(persistentChannel, 0, -1);
      for (const messageString of messages) {
        try {
          const message = JSON.parse(messageString);
          await handler(message);
        } catch (error) {
          this.logger.error('Error processing persistent message:', error);
        }
      }
    } catch (error) {
      this.logger.error('Error processing persistent messages:', error);
    }
  }

  private getChannelName(options: { channel: string; priority?: MessagePriority }): string {
    if (options.priority === MessagePriority.HIGH) {
      return this.HIGH_PRIORITY_PREFIX + options.channel;
    }
    return options.channel;
  }

  async createRequest(
    action: string,
    data: unknown,
    target: { id: string; type: string },
    options: {
      priority?: MessagePriority;
      ttl?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Message> {
    const requestId = Math.random().toString(36).substring(7);
    const message: Message = {
      id: requestId,
      type: MessageType.REQUEST,
      action,
      payload: {
        data
      },
      metadata: {
        ...options.metadata,
        priority: options.priority,
        ttl: options.ttl
      }
    };

    await this.publish(message, {
      channel: `${target.type}.${target.id}`,
      priority: options.priority,
      ttl: options.ttl
    });

    return message;
  }

  async broadcast(
    action: string,
    data: unknown,
    options: {
      priority?: MessagePriority;
      ttl?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Message> {
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      type: MessageType.BROADCAST,
      action,
      payload: {
        data
      },
      metadata: {
        ...options.metadata,
        priority: options.priority,
        ttl: options.ttl
      }
    };

    await this.publish(message, {
      channel: 'broadcast',
      priority: options.priority,
      ttl: options.ttl
    });

    return message;
  }
}
