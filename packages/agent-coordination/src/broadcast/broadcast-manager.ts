import { Logger } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { A2APriority } from '@the-new-fuse/a2a-core';
import { BroadcastMessage, CoordinationChannel, MessageHandler } from '../types/coordination.types';
import { MessageSerializer } from '../serializers/message-serializer';
import { v4 as uuidv4 } from 'uuid';

/**
 * Broadcast manager for multi-agent coordination
 */
export class BroadcastManager {
  private readonly logger = new Logger(BroadcastManager.name);
  private readonly keyPrefix: string;
  private readonly serializer: MessageSerializer;
  private readonly handlers: Map<string, Set<MessageHandler>> = new Map();
  private readonly subscriptions: Set<string> = new Set();

  constructor(
    private readonly redisService: UnifiedRedisService,
    keyPrefix: string,
    serializer: MessageSerializer
  ) {
    this.keyPrefix = keyPrefix;
    this.serializer = serializer;
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(
    fromAgent: string,
    payload: any,
    options?: {
      channel?: CoordinationChannel;
      topic?: string;
      priority?: A2APriority;
      ttl?: number;
    }
  ): Promise<void> {
    const message: BroadcastMessage = {
      id: uuidv4(),
      fromAgent,
      channel: options?.channel || CoordinationChannel.BROADCAST,
      topic: options?.topic,
      payload,
      priority: options?.priority || A2APriority.MEDIUM,
      timestamp: Date.now(),
      ttl: options?.ttl,
    };

    const channel = this.keyPrefix + message.channel;
    const fullChannel = message.topic ? channel + ':' + message.topic : channel;

    await this.redisService.publish(fullChannel, this.serializer.serialize(message));

    const topicSuffix = message.topic ? ':' + message.topic : '';
    this.logger.debug('Broadcast sent from ' + fromAgent + ' on channel ' + message.channel + topicSuffix);
  }

  /**
   * Subscribe to broadcast messages
   */
  async subscribe(
    channel: CoordinationChannel,
    handler: MessageHandler,
    topic?: string
  ): Promise<void> {
    const fullChannel = topic 
      ? this.keyPrefix + channel + ':' + topic
      : this.keyPrefix + channel;

    if (!this.handlers.has(fullChannel)) {
      this.handlers.set(fullChannel, new Set());
    }
    this.handlers.get(fullChannel)!.add(handler);

    if (!this.subscriptions.has(fullChannel)) {
      await this.redisService.subscribe(fullChannel, async (message) => {
        const msgContent = typeof message.message === 'string' 
          ? message.message 
          : JSON.stringify(message.message);
        await this.handleMessage(fullChannel, msgContent);
      });
      
      this.subscriptions.add(fullChannel);
      this.logger.log('Subscribed to channel: ' + fullChannel);
    }
  }

  /**
   * Subscribe to pattern-based channels
   */
  async subscribePattern(
    channelPattern: string,
    handler: MessageHandler
  ): Promise<void> {
    const fullPattern = this.keyPrefix + channelPattern;

    if (!this.handlers.has(fullPattern)) {
      this.handlers.set(fullPattern, new Set());
    }
    this.handlers.get(fullPattern)!.add(handler);

    if (!this.subscriptions.has(fullPattern)) {
      await this.redisService.psubscribe(fullPattern, async (message) => {
        const msgContent = typeof message.message === 'string' 
          ? message.message 
          : JSON.stringify(message.message);
        await this.handleMessage(message.channel, msgContent);
      });
      
      this.subscriptions.add(fullPattern);
      this.logger.log('Subscribed to pattern: ' + fullPattern);
    }
  }

  async unsubscribe(channel: CoordinationChannel, topic?: string): Promise<void> {
    const fullChannel = topic 
      ? this.keyPrefix + channel + ':' + topic
      : this.keyPrefix + channel;

    if (this.subscriptions.has(fullChannel)) {
      await this.redisService.unsubscribe(fullChannel);
      this.subscriptions.delete(fullChannel);
      this.handlers.delete(fullChannel);
      
      this.logger.log('Unsubscribed from channel: ' + fullChannel);
    }
  }

  async unsubscribePattern(channelPattern: string): Promise<void> {
    const fullPattern = this.keyPrefix + channelPattern;

    if (this.subscriptions.has(fullPattern)) {
      await this.redisService.punsubscribe(fullPattern);
      this.subscriptions.delete(fullPattern);
      this.handlers.delete(fullPattern);
      
      this.logger.log('Unsubscribed from pattern: ' + fullPattern);
    }
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  async clearAll(): Promise<void> {
    for (const channel of this.subscriptions) {
      if (channel.includes('*')) {
        await this.redisService.punsubscribe(channel);
      } else {
        await this.redisService.unsubscribe(channel);
      }
    }

    this.subscriptions.clear();
    this.handlers.clear();
    
    this.logger.log('All subscriptions cleared');
  }

  private async handleMessage(channel: string, messageData: string): Promise<void> {
    try {
      const message = this.serializer.deserialize<BroadcastMessage>(messageData);

      if (message.ttl && Date.now() - message.timestamp > message.ttl) {
        this.logger.debug('Message expired: ' + message.id);
        return;
      }

      const handlers = this.handlers.get(channel);
      if (handlers) {
        for (const handler of handlers) {
          try {
            await handler(message);
          } catch (error) {
            this.logger.error('Handler error for channel ' + channel + ':', error);
          }
        }
      }

      for (const [pattern, handlers] of this.handlers.entries()) {
        if (pattern.includes('*') && this.matchesPattern(channel, pattern)) {
          for (const handler of handlers) {
            try {
              await handler(message);
            } catch (error) {
              this.logger.error('Pattern handler error for ' + pattern + ':', error);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to handle broadcast message:', error);
    }
  }

  private matchesPattern(channel: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(channel);
  }
}
