import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { MessageBroker } from './MessageBroker.js';
import { Message, MessageType, MessagePriority } from './Protocol.js';
import { EventEmitter } from 'events';

interface SendOptions {
  priority?: MessagePriority;
  ttl?: number;
  persist?: boolean;
  retries?: number;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

interface SubscribeOptions {
  pattern: string;
  priority?: MessagePriority;
  handler: (message: Message) => Promise<void>;
}

@Injectable()
export class CommunicationService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private readonly pendingRequests: Map<string, {
    resolve: (value: Message | PromiseLike<Message>) => void; // Adjusted for PromiseLike
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>;

  constructor(
    private readonly messageBroker: MessageBroker
  ) {
    super();
    this.logger = new Logger({ name: 'CommunicationService', level: 'info' }); // Initialize logger
    this.pendingRequests = new Map();
  }

  async onModuleInit(): Promise<void> {
    // Subscribe to response messages
    await this.messageBroker.subscribe({
      pattern: '*.responses', // Assuming a pattern for all responses
      priority: MessagePriority.HIGH,
      handler: async (message: Message) => {
        await this.handleResponse(message);
      },
    });
    this.logger.info('CommunicationService initialized and subscribed to responses.');
  }

  async sendMessage(
    target: { id: string; type: string },
    action: string,
    data: unknown,
    options: SendOptions = {}
  ): Promise<void> {
    try {
      const message = await this.messageBroker.createMessage(
        action, // Assuming createMessage takes action first
        data,
        target,
        MessageType.COMMAND, // Example: default to COMMAND, or make it a param
        {
          priority: options.priority,
          ttl: options.ttl,
          metadata: options.metadata,
        }
      );

      await this.messageBroker.publish(message, {
        channel: `${target.type}.${target.id}`,
        priority: options.priority,
        ttl: options.ttl,
        persist: options.persist,
      });
      this.logger.debug(`Message sent to ${target.type}.${target.id}: ${action}`, message);
    } catch (error: unknown) {
      this.logger.error('Error sending message:', error);
      throw error; // Re-throw or handle as per application needs
    }
  }

  async sendRequest(
    target: { id: string; type: string },
    action: string,
    data: unknown,
    options: SendOptions = {}
  ): Promise<Message> {
    let message: Message | undefined = undefined; // Define message here to access its ID
    try {
      message = await this.messageBroker.createRequest(
        action,
        data,
        target,
        {
          priority: options.priority,
          ttl: options.ttl,
          metadata: options.metadata,
        }
      );

      const messageId = (message as any).header?.id || message.id; // Adapt to actual message structure
      if (!messageId) {
        throw new Error('Message ID is undefined after creation.');
      }

      return new Promise((resolve, reject) => {
        const timeoutDuration = options.timeout || 30000;
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(messageId);
          reject(new Error(`Request timeout after ${timeoutDuration}ms for action: ${action}`));
        }, timeoutDuration);

        this.pendingRequests.set(messageId, { resolve, reject, timeout });

        this.messageBroker.publish(message!, { // message is guaranteed to be defined here
          channel: `${target.type}.${target.id}.requests`, // Example: specific channel for requests
          priority: options.priority,
          ttl: options.ttl,
          persist: options.persist,
        }).catch(error => {
          clearTimeout(timeout);
          this.pendingRequests.delete(messageId);
          reject(error);
        });
        this.logger.debug(`Request sent to ${target.type}.${target.id}: ${action}`, message);
      });
    } catch (error: unknown) {
      this.logger.error('Error sending request:', error);
      if (message) {
        const messageId = (message as any).header?.id || message.id;
        if (messageId) {
          const pending = this.pendingRequests.get(messageId);
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(messageId);
          }
        }
      }
      throw error; // Re-throw or handle
    }
  }

  async broadcastMessage(
    action: string,
    data: unknown,
    options: SendOptions = {}
  ): Promise<void> {
    try {
      const message = await this.messageBroker.createEvent(
        action,
        data,
        {
          priority: options.priority,
          ttl: options.ttl,
          metadata: options.metadata,
        }
      );

      await this.messageBroker.publish(message, {
        channel: 'broadcast', // General broadcast channel
        priority: options.priority,
        ttl: options.ttl,
        persist: options.persist,
      });
      this.logger.debug(`Message broadcasted: ${action}`, message);
    } catch (error: unknown) {
      this.logger.error('Error broadcasting message:', error);
      throw error;
    }
  }

  async subscribe(options: SubscribeOptions): Promise<void> {
    try {
      await this.messageBroker.subscribe(options);
      this.logger.info(`Subscribed to pattern: ${options.pattern}`);
    } catch (error: unknown) {
      this.logger.error(`Error subscribing to pattern: ${options.pattern}`, error);
      throw error;
    }
  }

  async unsubscribe(pattern: string, handler: (message: Message) => Promise<void>): Promise<void> {
    try {
      await this.messageBroker.unsubscribe(pattern, handler);
      this.logger.info(`Unsubscribed from pattern: ${pattern}`);
    } catch (error: unknown) {
      this.logger.error(`Error unsubscribing from pattern: ${pattern}`, error);
      throw error;
    }
  }

  private async handleResponse(message: Message): Promise<void> {
    const messageId = (message as any).header?.correlationId || message.correlationId || (message as any).header?.id || message.id;
    if (!messageId) {
      this.logger.warn('Received response without a clear correlationId or id', message);
      return;
    }

    const pendingRequest = this.pendingRequests.get(messageId);
    if (!pendingRequest) {
      this.logger.warn(`Received response for unknown request ID: ${messageId}`, message);
      return;
    }

    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(messageId);

    if (message.type === MessageType.ERROR || (message as any).payload?.error || (message as any).error) {
      const errorPayload = (message as any).payload?.error || (message as any).error || { message: 'Unknown error in response' };
      const error = new Error(typeof errorPayload === 'string' ? errorPayload : errorPayload.message || 'Unknown error');
      if (typeof errorPayload === 'object' && errorPayload !== null) {
        Object.assign(error, errorPayload);
      }
      pendingRequest.reject(error);
      this.logger.debug(`Response (error) received for request ${messageId}`, message);
    } else {
      // Assuming the actual content is in message.content or message.payload.data
      const responseData = message.content !== undefined ? message : (message as any).payload?.data !== undefined ? (message as any).payload : message;
      pendingRequest.resolve(responseData as Message); // Cast as Message, adjust if only payload is needed
      this.logger.debug(`Response (success) received for request ${messageId}`, message);
    }
  }

  // Retry logic might be better placed within the message broker or a dedicated retry service
  // If kept here, it needs to be invoked appropriately, e.g., from catch blocks of send methods.
  private async retryMessage(
    message: Message,
    options: { maxRetries?: number; backoff?: number; channel: string; persist?: boolean }
  ): Promise<void> {
    let retries = (message.metadata as any)?.retries || 0;
    const maxRetries = options.maxRetries || this.messageBroker.defaultMaxRetries || 3;
    const backoff = options.backoff || this.messageBroker.defaultBackoff || 1000;

    if (retries >= maxRetries) {
      this.logger.error(`Max retries reached for message ${message.id}. Giving up.`);
      // Optionally, move to a dead-letter queue or emit a final failure event
      this.emit('messageFailed', { messageId: message.id, error: 'Max retries reached', final: true });
      return;
    }

    retries++;
    if (!message.metadata) message.metadata = {} as any;
    (message.metadata as any).retries = retries;

    const delay = backoff * Math.pow(2, retries - 1); // Exponential backoff
    this.logger.info(`Retrying message ${message.id} (attempt ${retries}/${maxRetries}) in ${delay}ms...`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.messageBroker.publish(message, {
        channel: options.channel,
        priority: (message.metadata as any)?.priority || MessagePriority.NORMAL,
        ttl: (message.metadata as any)?.ttl,
        persist: options.persist
      });
      this.logger.info(`Message ${message.id} re-published successfully (attempt ${retries}).`);
    } catch (error: unknown) {
      this.logger.error(`Error re-publishing message ${message.id} (attempt ${retries}):`, error);
      // Potentially try retrying the retry, or give up
      if (retries < maxRetries) {
        // Consider if another retry attempt should be made here, or if it should fail straight away
        // For simplicity, we'll let the next attempt happen if the overall retry count is not exceeded.
        // However, this could lead to rapid retries if publish fails immediately.
        // A more robust solution might involve a separate retry queue or more sophisticated error handling here.
        this.logger.warn(`Re-publish failed for ${message.id}, will rely on next scheduled retry if applicable or manual intervention.`);
      }
      this.emit('messageFailed', { messageId: message.id, error, attempt: retries, final: retries >= maxRetries });
      if (retries >= maxRetries) {
        this.logger.error(`Max retries reached for message ${message.id} after re-publish failure.`);
      }
    }
  }
}
