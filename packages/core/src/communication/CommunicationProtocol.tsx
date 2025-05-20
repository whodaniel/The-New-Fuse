import { Injectable } from '@nestjs/common';
import { Message, Channel, MessageHandler, MessageType, MessageStatus } from './CommunicationTypes.js';
import { MessageRouter } from './MessageRouter.js';
import { MessageValidator } from './MessageValidator.js';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommunicationProtocol extends EventEmitter {
  private logger: Logger;
  private channels: Map<string, Set<MessageHandler>>;
  private activeMessages: Map<string, Message>;
  private db: DatabaseService;

  constructor(
    private readonly router: MessageRouter,
    private readonly validator: MessageValidator,
    db: DatabaseService
  ) {
    super();
    this.logger = new Logger(CommunicationProtocol.name);
    this.channels = new Map();
    this.activeMessages = new Map();
    this.db = db;
  }

  public async send(message: Message): Promise<void> {
    try {
      // Generate message ID if not provided
      if (!message.id) {
        message.id = uuidv4();
      }

      // Set default metadata
      message.metadata = {
        ...message.metadata,
        timestamp: new Date(),
        status: MessageStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
        tags: [...(message.metadata?.tags || [])],
        trace: {
          spanId: uuidv4(),
          startTime: Date.now()
        }
      };

      // Validate message
      await this.validator.validate(message);

      // Get target channel
      const channel = await this.router.findOrCreateChannel(message);

      // Send message to channel
      this.publishToChannel(channel, message);
    } catch (error) {
      this.logger.error(`Failed to send message ${message.id}:`, error);
    }
  }

  private publishToChannel(channel: Channel, message: Message): void {
    try {
      const handlers = this.channels.get(channel.id) || new Set();

      // Send to all handlers
      const promises = Array.from(handlers).map(handler =>
        this.executeHandler(handler, message)
      );

      Promise.all(promises).then(() => {
        // Update message status
        (message as any).metadata.status = MessageStatus.DELIVERED;
        message.metadata.trace.endTime = Date.now();
        this.saveMessage(message);

        // Emit sent event
        this.emit('messageSent', {
          messageId: message.id,
          channel: channel.id,
          timestamp: new Date()
        });
      }).catch(err => {
        this.logger.error(`Error in message delivery for ${message.id}:`, err);
      });
    } catch (error) {
      this.logger.error(`Failed to publish message to channel ${channel.id}:`, error);
    }
  }

  public async subscribe(pattern: string, handler: MessageHandler): Promise<void> {
    try {
      const channel = await this.router.findOrCreateChannel(pattern);

      // Add handler to channel
      if (!this.channels.has(channel.id)) {
        this.channels.set(channel.id, new Set());
      }
      this.channels.get(channel.id).add(handler);

      // Update channel metadata
      (channel as any).metadata.subscribers++;
      await this.router.saveChannel(channel);

      this.logger.debug(`Subscribed handler to channel ${channel.id}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${pattern}:`, error);
    }
  }

  public async unsubscribe(pattern: string, handler: MessageHandler): Promise<void> {
    try {
      const channel = await this.router.getChannel(pattern);
      if (!channel) return;

      const handlers = this.channels.get(channel.id);
      if (handlers) {
        handlers.delete(handler);

        // Update channel metadata
        (channel as any).metadata.subscribers--;
        await this.router.saveChannel(channel);
      }

      this.logger.debug(`Unsubscribed handler from channel ${channel.id}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from channel ${pattern}:`, error);
    }
  }

  private async executeHandler(
    handler: MessageHandler,
    message: Message
  ): Promise<void> {
    try {
      await handler(message);
    } catch (error: unknown) {
      this.logger.error(`Handler failed for message ${message.id}:`, error);
      // Optional: Implement retry logic or dead-letter queue based on message.metadata
      if (message.metadata?.retries && message.metadata?.maxRetries && message.metadata.retries < message.metadata.maxRetries) {
        message.metadata.retries++;
        // Potentially add a delay before resending
        await this.send(message);
        this.logger.info(`Retrying message ${message.id}, attempt ${message.metadata.retries}`);
      } else {
        this.logger.error(`Max retries reached or no retry policy for message ${message.id}. Giving up.`);
        // Optionally, move to a dead-letter queue or emit a final failure event
        this.emit('messageFailed', { messageId: message.id, error, final: true });
      }
    }
  }

  private async saveMessage(message: Message): Promise<void> {
    try {
      // Assuming this.router handles database interactions now
      await this.router.saveMessage(message);
      this.logger.debug(`Message ${message.id} saved.`);
    } catch (error: unknown) {
      this.logger.error(`Failed to save message ${message.id}:`, error);
      // Decide if this failure should be propagated or handled locally
    }
  }

  // Example of a method to handle routed messages (if needed here, or could be in MessageRouter)
  private handleRoutedMessage(event: { messageId: string; channel: string }): void {
    this.logger.debug(`Message ${event.messageId} routed to channel ${event.channel}`);
    // Additional logic if CommunicationProtocol needs to react to routing
  }

  // Example of a method to handle validation failures (if needed here, or could be in MessageValidator)
  private handleValidationFailure(event: { messageId: string; error: string | MessageValidationError[] }): void {
    this.logger.error(`Message ${event.messageId} validation failed:`, event.error);
    // Additional logic if CommunicationProtocol needs to react to validation errors
  }

  public async getActiveMessages(): Promise<Message[]> {
    // This method might need to be re-evaluated.
    // If messages are persisted, retrieving "active" messages might mean querying based on status.
    // For now, assuming it's a conceptual placeholder or needs a different implementation.
    this.logger.warn('getActiveMessages currently returns an empty array. Implementation needed.');
    return []; // Placeholder
  }

  public async getMessageById(messageId: string): Promise<Message | null> {
    // This should now fetch from the router/database
    try {
      return await this.router.getMessageById(messageId);
    } catch (error: unknown) {
      this.logger.error(`Error fetching message ${messageId} by ID:`, error);
      return null;
    }
  }

  // Method to clean up old messages - conceptual, needs proper implementation
  private cleanupOldMessages(): void {
    const now = Date.now();
    // This logic needs to be adapted based on how messages are stored and what "active" means.
    // For example, if messages are in a database, this would be a query.
    this.logger.info('CleanupOldMessages: Conceptual method, needs implementation based on message persistence.');
    // Example: Iterate over a local cache if one exists and is still relevant
    // for (const [id, message] of this.activeMessages.entries()) { // Assuming activeMessages was a Map
    //   const messageTimestamp = message.metadata.timestamp.getTime();
    //   const ttl = message.metadata.ttl || this.config.defaultTtl || 3600000; // Default 1 hour
    //   if (now - messageTimestamp > ttl) {
    //     this.activeMessages.delete(id);
    //     this.logger.debug(`Cleaned up expired message ${id}`);
    //   }
    // }
  }

  // ... any other methods like getStats, etc.
}
