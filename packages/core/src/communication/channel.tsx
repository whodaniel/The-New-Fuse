import { Injectable } from '@nestjs/common';
import { RedisManager } from '../redis_manager.js';
import { Logger } from '../utils/logger.js';
import { Message, MessageType, Priority } from '@the-new-fuse/types';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Channel,
  ChannelOptions,
  MessageHandler,
  Subscription,
} from './types.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChannelManager {
  private readonly channels: Map<string, Channel>;
  private readonly subscriptions: Map<string, Set<MessageHandler>>;
  private readonly options: Map<string, ChannelOptions>;
  private readonly logger = new Logger(ChannelManager.name);

  constructor(
    private readonly redisManager: RedisManager,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.channels = new Map();
    this.subscriptions = new Map();
    this.options = new Map();
  }

  async createChannel(
    name: string,
    type: Channel['type'],
    options?: ChannelOptions,
  ): Promise<Channel> {
    const channel: Channel = {
      id: uuidv4(),
      name,
      type,
      createdAt: new Date(),
    };

    if(type === 'topic') {
      channel.pattern = name;
    }

    // Store channel in Redis
    await this.redisManager.hset(
      `channel:${channel.id}`,
      this.serializeChannel(channel)
    );
    this.options.set(channel.id, options);

    return channel;
  }

  async getChannel(id: string): Promise<Channel | null> {
    const cached = this.channels.get(id);
    if(cached) {
      return cached;
    }

    const data  = await this.redisManager.hgetall(`channel:${id}`);
    if(!data) {
      return null;
    }

    const channel = this.deserializeChannel(data);
    this.channels.set(id, channel);

    return channel;
  }

  async subscribe(
    channelId: string,
    handler: MessageHandler,
    pattern?: string,
  ): Promise<Subscription> {
    const channel = await this.getChannel(channelId);
    if(!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const subscription: Subscription  = {
      id: uuidv4(),
      channelId,
      subscriberId: uuidv4(), // This should be replaced with actual subscriber ID
      pattern,
      metadata: {
        createdAt: new Date(),
      },
    };

    // Store subscription in Redis
    await this.redisManager.hset(
      `subscription:$ {subscription.id}`,
      this.serializeSubscription(subscription)
    );

    if (!this.subscriptions.has(channelId)) {
      this.subscriptions.set(channelId, new Set());
    }
    this.subscriptions.get(channelId).add(handler);

    return subscription;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
const data = await this.redisManager.hgetall(`subscription:${subscriptionId}`);
    if(!data) {
      return;
    }

    const subscription = this.deserializeSubscription(data);

    const handlers   = this.subscriptions.get(subscription.channelId);
    if(handlers) {
      // TODO: Implement a robust way to remove the specific handler associated with this subscriptionId.
      // Currently, this only checks if there are any handlers for the channel and doesn't remove a specific one.
      // handlers.delete(handler);
    }
  }

  async publish(channelId: string, message: Message, options?: ChannelOptions): Promise<void> {
    this.logger.debug(`Publishing message ${message.id} to channel ${channelId}`);
    const handlers = this.subscriptions.get(channelId);
    if (handlers && handlers.size > 0) { // Check if handlers exist and is not empty
      const promises = Array.from(handlers).map(handler =>
        this.handleMessage(handler, { ...message }, options), // Pass a copy of message
      );
      await Promise.all(promises);
    } else {
      this.logger.warn(`No subscribers for channel ${channelId} when publishing message ${message.id}`);
      // Optionally, handle messages with no subscribers (e.g., dead-letter queue or log)
    }

    this.eventEmitter.emit('message.published', {
      channelId,
      messageId: message.id, // Corrected property name
      // any other relevant data
    });

    // Removed incorrect logging of the entire message object directly
    // this.logger.info(
    //   `Message published to channel ${channelId}: ${message.id}`,
    //   JSON.stringify(message), // Serialize message for logging if needed, or log specific fields
    // );
  }

  private async handleMessage(
    handler: MessageHandler,
    message: Message,
    options?: ChannelOptions,
  ): Promise<void> {
    const maxRetries = options?.retryPolicy?.maxRetries || 3;
    const backoff = options?.retryPolicy?.backoff || {
      type: 'exponential' as 'exponential' | 'fixed', // Added type assertion
      delay: 1000,
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await handler(message);
        message.status = MessageStatus.PROCESSED; // Corrected status
        // Log success or emit event
        this.logger.debug(`Message ${message.id} processed successfully by handler.`);
        this.eventEmitter.emit('message.processed', { messageId: message.id });
        return; // Exit if successful
      } catch (error: any) { // Added type for error
        this.logger.error(`Handler error for message ${message.id}, attempt ${attempt + 1}:`, error);
        message.status = MessageStatus.FAILED; // Corrected status
        message.error = {
          code: 'HANDLER_ERROR', // Corrected string literal
          message: error.message,
          details: error,
        };

        if (attempt < maxRetries) {
          const delay = backoff.type === 'exponential'
            ? backoff.delay * Math.pow(2, attempt)
            : backoff.delay;
          this.logger.info(`Retrying message ${message.id} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.logger.error(`Max retries reached for message ${message.id}. Giving up.`);
          this.eventEmitter.emit('message.failed', {
            messageId: message.id,
            error: message.error,
            final: true, // Indicate final failure
          });
          // Optionally, move to a dead-letter queue
          break; // Exit loop after max retries
        }
      }
    }
  }

  private serializeChannel(channel: Channel): Record<string, string> {
    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      pattern: channel.pattern || '',
      metadata: JSON.stringify(channel.metadata),
    };
  }

  private deserializeChannel(data: Record<string, string>): Channel {
    return {
      id: data.id,
      name: data.name,
      type: data.type as Channel['type'],
      pattern: data.pattern || undefined,
      metadata: JSON.parse(data.metadata),
    };
  }

  private serializeSubscription(subscription: Subscription): Record<string, string> {
    return {
      id: subscription.id,
      channelId: subscription.channelId,
      subscriberId: subscription.subscriberId,
      pattern: subscription.pattern || '',
      filters: JSON.stringify(subscription.filters || {}),
      metadata: JSON.stringify(subscription.metadata),
    };
  }

  private deserializeSubscription(data: Record<string, string>): Subscription {
    return {
      id: data.id,
      channelId: data.channelId,
      subscriberId: data.subscriberId,
      pattern: data.pattern || undefined,
      filters: JSON.parse(data.filters),
      metadata: JSON.parse(data.metadata),
    };
  }

  private serializeOptions(options: ChannelOptions): Record<string, string> {
    return {
      bufferSize: options.bufferSize?.toString() || '',
      persistent: options.persistent?.toString() || '',
      encrypted: options.encrypted?.toString() || '',
      compression: options.compression?.toString() || '',
      qos: options.qos?.toString() || '',
      retryPolicy: JSON.stringify(options.retryPolicy || {}),
    };
  }
}
