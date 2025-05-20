import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Message,
  MessageType,
  MessagePriority,
  MessageStatus,
  Channel,
  MessageHandler,
  MessageStats,
  MessageValidationError,
  MessageError, // Assuming MessageError is defined in types
  MessageValidationErrorCode, // Assuming this is defined for specific error codes
  ChannelType,
  ChannelOptions,
} from './types.js';
import { ChannelManager } from './channel.js'; // Assuming ChannelManager exists and is injectable
import { MessageRouter } from './MessageRouter.js'; // Corrected import name
import { MessageValidator } from './MessageValidator.js'; // Corrected import name
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils'; // Assuming Logger is available

@Injectable()
export class CommunicationProtocol {
  private readonly logger: Logger;

  constructor(
    private readonly channelManager: ChannelManager,
    private readonly router: MessageRouter,
    private readonly validator: MessageValidator,
    private readonly configService: ConfigService, // Keep if used, otherwise remove
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = new Logger(CommunicationProtocol.name);
  }

  async send(message: Omit<Message, 'id' | 'timestamp' | 'status' | 'error'>): Promise<Message> {
    const fullMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: MessageStatus.PENDING,
      error: null,
    };

    try {
      this.logger.debug(`Sending message: ${fullMessage.id}`, fullMessage);
      const errors: MessageValidationError[] = await this.validator.validate(fullMessage);
      if (errors.length > 0) {
        fullMessage.status = MessageStatus.FAILED;
        fullMessage.error = {
          code: 'VALIDATION_ERROR' as MessageValidationErrorCode, // Or a more specific code
          message: `Message validation failed: ${this.formatValidationErrors(errors)}`,
          details: errors,
        };
        this.eventEmitter.emit('message.failed', { messageId: fullMessage.id, error: fullMessage.error });
        this.logger.warn(`Message validation failed for ${fullMessage.id}:`, errors);
        throw new Error(fullMessage.error.message);
      }

      const channel = await this.router.routeMessage(fullMessage);
      if (!channel) {
        fullMessage.status = MessageStatus.FAILED;
        fullMessage.error = {
          code: 'NO_CHANNEL_FOUND' as MessageValidationErrorCode,
          message: 'No suitable channel found for message',
        };
        this.eventEmitter.emit('message.failed', { messageId: fullMessage.id, error: fullMessage.error });
        this.logger.warn(`No channel found for message ${fullMessage.id}`);
        throw new Error(fullMessage.error.message);
      }

      await this.channelManager.publish(channel.id, fullMessage);
      fullMessage.status = MessageStatus.SENT;
      this.eventEmitter.emit('message.sent', { messageId: fullMessage.id, channelId: channel.id });
      this.logger.info(`Message ${fullMessage.id} sent to channel ${channel.id}`);
      return fullMessage;

    } catch (error: unknown) {
      this.logger.error(`Failed to send message ${fullMessage.id}:`, error);
      fullMessage.status = MessageStatus.FAILED;
      if (!(error instanceof Error && (error as any).details)) { // Avoid overwriting detailed validation error
        fullMessage.error = {
          code: 'SEND_FAILED' as MessageValidationErrorCode,
          message: error instanceof Error ? error.message : 'Unknown send error',
          details: error,
        };
      }
      this.eventEmitter.emit('message.failed', { messageId: fullMessage.id, error: fullMessage.error });
      // Re-throw the original error or a new one encapsulating the failure
      if (error instanceof Error) throw error;
      throw new Error(fullMessage.error?.message || 'Failed to send message');
    }
  }

  async subscribe(
    pattern: string, // e.g., topic name, user ID for direct, or channel ID
    handler: MessageHandler,
    options?: {
      types?: MessageType[];
      priorities?: MessagePriority[];
      sources?: string[];
      tags?: string[];
      channelType?: ChannelType; // Hint for channel creation if pattern is not a channel ID
      channelOptions?: Partial<ChannelOptions>;
    },
  ): Promise<string> {
    this.logger.debug(`Subscribing to pattern: ${pattern}`, options);
    // Attempt to find an existing channel by pattern (if pattern could be a name/topic)
    // Or, if pattern is a direct channelId, use it.
    // This logic might need refinement based on how patterns map to channels.
    let channel = await this.findChannelByPattern(pattern, options?.channelType);

    if (!channel) {
      // If no channel found, and pattern suggests a new one (e.g. a topic name)
      // This assumes findChannelByPattern doesn't create, and creation is explicit or handled by router.
      // For simplicity, let's assume if a channel is needed for subscription and doesn't exist,
      // it might be created here or this subscription waits for the channel.
      // Or, the pattern itself is the channel ID.
      // Let's assume for now pattern can be a channel ID or a name that resolves to one.
      // If it's a name that needs a new topic channel:
      if (options?.channelType === ChannelType.TOPIC) {
         channel = await this.createTopicChannel(pattern, options?.channelOptions);
      } else {
        // If it's not a topic or a known channel, this subscription might be invalid
        // or requires a channel to be explicitly created first.
        // For now, we'll assume the channel must exist or be creatable as a topic.
        this.logger.warn(`No channel found for subscription pattern: ${pattern} and type ${options?.channelType}. Subscription might not be active until channel exists.`);
        // Depending on requirements, you might throw an error or allow "pending" subscriptions.
        // For now, let's assume channelManager.subscribe can handle subscribing to a non-existent channel ID
        // if the channel is expected to be created later, or it throws.
        // If pattern is intended to be a channel ID directly:
        // channel = { id: pattern, name: pattern, type: options?.channelType || ChannelType.UNKNOWN, metadata: {} } as Channel;
      }
    }
    
    if (!channel) {
        const errorMessage = `Cannot subscribe: Channel could not be found or created for pattern "${pattern}"`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
    }


    const subscriptionId = await this.channelManager.subscribe(
      channel.id,
      async (message: Message) => {
        if (this.matchesFilters(message, options)) {
          try {
            await handler(message);
          } catch (err: unknown) {
            this.logger.error(`Error in message handler for subscription ${channel?.id} on message ${message.id}:`, err);
            // Optionally, emit an event or implement retry logic for the handler
          }
        }
      },
    );
    this.logger.info(`Subscribed to channel ${channel.id} with subscription ID: ${subscriptionId}`);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.logger.debug(`Unsubscribing: ${subscriptionId}`);
    try {
      await this.channelManager.unsubscribe(subscriptionId);
      this.logger.info(`Unsubscribed: ${subscriptionId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to unsubscribe ${subscriptionId}:`, error);
      throw error;
    }
  }

  // Placeholder: Actual implementation depends on how channels are named/identified by patterns
  private async findChannelByPattern(pattern: string, typeHint?: ChannelType): Promise<Channel | null> {
    this.logger.debug(`Finding channel by pattern: ${pattern}, type hint: ${typeHint}`);
    // 1. Check if pattern is a known channel ID
    let channel = await this.channelManager.getChannel(pattern);
    if (channel) return channel;

    // 2. If not an ID, try to find by name/topic (if ChannelManager supports this)
    // This is highly dependent on ChannelManager's capabilities.
    // For example, if ChannelManager can list channels:
    const allChannels = await this.channelManager.getAllChannels();
    channel = allChannels.find(ch => ch.name === pattern && (typeHint ? ch.type === typeHint : true)) || null;
    
    this.logger.debug(`Channel found by pattern "${pattern}": ${channel ? channel.id : 'None'}`);
    return channel;
  }

  private matchesFilters(
    message: Message,
    filters?: {
      types?: MessageType[];
      priorities?: MessagePriority[];
      sources?: string[];
      tags?: string[];
    },
  ): boolean {
    if (!filters) {
      return true;
    }

    if (filters.types && filters.types.length > 0 && !filters.types.includes(message.type)) {
      return false;
    }

    // Assuming priority is part of message.metadata or directly on message
    const priority = (message as any).priority || (message.metadata as any)?.priority;
    if (filters.priorities && filters.priorities.length > 0 && (!priority || !filters.priorities.includes(priority))) {
      return false;
    }

    if (filters.sources && filters.sources.length > 0 && !filters.sources.includes(message.source)) {
      return false;
    }

    // Assuming tags are part of message.metadata or directly on message
    const tags = (message as any).tags || (message.metadata as any)?.tags;
    if (filters.tags && filters.tags.length > 0) {
      if (!tags || !Array.isArray(tags) || !filters.tags.every(tag => tags.includes(tag))) {
        return false;
      }
    }
    return true;
  }

  private formatValidationErrors(errors: MessageValidationError[]): string {
    return errors
      .map(error => `[${error.field || 'general'}: ${error.message} (${error.code})]`)
      .join(', ');
  }

  async getStats(): Promise<MessageStats> {
    this.logger.debug('Fetching message statistics');
    // This would likely aggregate data from ChannelManager or a dedicated stats service
    // Placeholder implementation:
    const allChannels = await this.channelManager.getAllChannels();
    let totalMessages = 0;
    const messagesByType: Record<string, number> = {};
    const messagesByStatus: Record<string, number> = {}; // Assuming MessageStatus can be tracked

    allChannels.forEach(channel => {
      totalMessages += channel.metadata.messageCount || 0;
      // Further stats would require more detailed tracking per channel or message
    });

    return {
      totalMessages,
      messagesByType, // Needs population
      messagesByStatus, // Needs population
      averageLatency: 0, // Needs calculation
      errorRate: 0, // Needs calculation
      activeChannels: allChannels.length,
      activeSubscriptions: await this.channelManager.getActiveSubscriptionCount(), // Assuming this method exists
    };
  }

  async createDirectChannel(userId1: string, userId2: string, options?: Partial<ChannelOptions>): Promise<Channel> {
    this.logger.info(`Creating direct channel between ${userId1} and ${userId2}`);
    const userIds = [userId1, userId2].sort();
    const channelName = `dm-${userIds[0]}-${userIds[1]}`;
    // Check if channel already exists (optional, ChannelManager might handle this)
    let channel = await this.findChannelByPattern(channelName, ChannelType.DIRECT);
    if (channel) return channel;

    channel = await this.channelManager.createChannel(channelName, ChannelType.DIRECT, {
        ...options,
        participants: userIds, // Ensure participants are part of options or metadata
    });
    // No explicit routing needed here if direct channels are handled by naming convention or target user ID
    this.logger.info(`Direct channel ${channel.id} created for ${userId1}, ${userId2}`);
    return channel;
  }

  async createBroadcastChannel(name: string, options?: Partial<ChannelOptions>): Promise<Channel> {
    this.logger.info(`Creating broadcast channel: ${name}`);
    const channel = await this.channelManager.createChannel(name, ChannelType.BROADCAST, options);
    // Broadcast channels might not need specific routes in MessageRouter if they are globally accessible
    // Or, add a generic route if needed: await this.router.addRoute('*', channel.id);
    this.logger.info(`Broadcast channel ${channel.id} created: ${name}`);
    return channel;
  }

  async createGroupChannel(name: string, participants: string[], options?: Partial<ChannelOptions>): Promise<Channel> {
    this.logger.info(`Creating group channel: ${name} with participants: ${participants.join(', ')}`);
    const channel = await this.channelManager.createChannel(name, ChannelType.GROUP, {
        ...options,
        participants, // Ensure participants are part of options or metadata
    });
    // For group channels, you might add routes for each participant to this channel
    // for (const participantId of participants) {
    //   await this.router.addRoute(participantId, channel.id);
    // }
    this.logger.info(`Group channel ${channel.id} created: ${name}`);
    return channel;
  }

  async createTopicChannel(topic: string, options?: Partial<ChannelOptions>): Promise<Channel> {
    this.logger.info(`Creating topic channel: ${topic}`);
    const channel = await this.channelManager.createChannel(topic, ChannelType.TOPIC, options);
    // Topic channels might be routed based on the topic name (pattern)
    // await this.router.addRoute('*', channel.id, topic); // If router supports pattern-based routes
    this.logger.info(`Topic channel ${channel.id} created for topic: ${topic}`);
    return channel;
  }
}
