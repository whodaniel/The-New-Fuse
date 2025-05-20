import { z } from 'zod';
import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/utils';
import crypto from 'crypto'; // Import crypto for UUID

// Message Schema Definitions (Corrected Zod syntax)
export const MessageHeaderSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  version: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.enum(['request', 'response', 'event', 'error']),
  source: z.object({
    id: z.string(),
    type: z.string(), // Added type for source/target
    version: z.string().optional(),
  }),
  target: z.object({
    id: z.string(),
    type: z.string(), // Added type for source/target
    version: z.string().optional(),
  }).optional(),
  correlationId: z.string().optional(),
  sessionId: z.string().optional(),
  ttl: z.number().optional(),
});

export const MessagePayloadSchema = z.object({
  action: z.string(),
  data: z.any(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const MessageSchema = z.object({
  header: MessageHeaderSchema,
  payload: MessagePayloadSchema,
  signature: z.string().optional(),
});

// Type definitions
export type MessageHeader = z.infer<typeof MessageHeaderSchema>;
export type MessagePayload = z.infer<typeof MessagePayloadSchema>;
export type Message = z.infer<typeof MessageSchema>;

export enum MessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  ERROR = 'error'
}

// Protocol Implementation
export class CommunicationProtocol extends EventEmitter {
  private logger: Logger;
  private version: string = '1.0.0'; // Example version
  private handlers: Map<string, Set<(message: Message) => Promise<void>>> = new Map();

  constructor() {
    super();
    this.logger = new Logger('CommunicationProtocol');
  }

  async validateMessage(message: unknown): Promise<Message> {
    try {
      return MessageSchema.parse(message);
    } catch (error) {
      this.logger.error('Message validation failed:', error);
      // Re-throw or handle specific validation errors as needed
      throw new Error(`Message validation failed: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : error}`);
    }
  }

  createMessage(
    type: MessageType,
    action: string,
    data: unknown,
    options: {
      priority?: MessagePriority;
      source: { id: string; type: string; version?: string };
      target?: { id: string; type: string; version?: string };
      correlationId?: string;
      sessionId?: string;
      ttl?: number;
      metadata?: Record<string, unknown>;
    }
  ): Message {
    const message: Message = {
      header: {
        id: crypto.randomUUID(), // Use crypto for UUID
        timestamp: new Date(),
        version: this.version,
        priority: options.priority || MessagePriority.MEDIUM,
        type,
        source: options.source,
        target: options.target,
        correlationId: options.correlationId,
        sessionId: options.sessionId,
        ttl: options.ttl,
      },
      payload: {
        action,
        data,
        metadata: options.metadata,
      },
    };

    // Validate the created message before returning
    try {
      this.validateMessage(message);
    } catch (validationError) {
      this.logger.error('Failed to create valid message:', validationError);
      // Decide how to handle this - throw, return null, etc.
      throw validationError;
    }
    return message;
  }

  // ... (rest of the class methods: signMessage, verifyMessage, registerHandler, unregisterHandler, handleMessage, createErrorResponse, createResponse) ...

  // Ensure handleMessage uses validated message type
  async handleMessage(message: unknown): Promise<any> {
    let validatedMessage: Message;
    try {
      validatedMessage = await this.validateMessage(message);

      // Check TTL
      if (validatedMessage.header.ttl) {
        const expiryTime = validatedMessage.header.timestamp.getTime() + validatedMessage.header.ttl * 1000;
        if (Date.now() > expiryTime) {
          throw new Error('Message TTL expired');
        }
      }

      const action = validatedMessage.payload.action;
      const handlers = this.handlers.get(action);

      if (!handlers || handlers.size === 0) {
        throw new Error(`No handlers registered for action: ${action}`);
      }

      // Execute handlers
      const results = await Promise.allSettled(
        Array.from(handlers).map(handler => handler(validatedMessage))
      );

      // Log any handler errors
      results.forEach(result => {
        if (result.status === 'rejected') {
          this.logger.error(`Handler failed for action ${action}:`, result.reason);
        }
      });

      // Depending on protocol needs, might return first result, all results, etc.
      // For now, just indicate completion or throw if all failed?
      const firstSuccess = results.find(r => r.status === 'fulfilled');
      if (firstSuccess) {
        return (firstSuccess as PromiseFulfilledResult<any>).value;
      } else {
        // If all handlers failed, throw the first error encountered
        const firstError = results.find(r => r.status === 'rejected');
        if (firstError) {
          throw (firstError as PromiseRejectedResult).reason;
        }
      }

    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.emit('messageError', { message, error });
      // If validation failed or other error occurred, potentially create an error response
      if (validatedMessage!) { // Only if validation succeeded before error
         return this.createErrorResponse(validatedMessage, error instanceof Error ? error : new Error(String(error)));
      }
      // Rethrow if validation failed or no original message context
      throw error;
    }
  }

  // Ensure createErrorResponse and createResponse use correct types
  createErrorResponse(originalMessage: Message, error: Error): Message {
    return this.createMessage(
      MessageType.ERROR,
      'error',
      {
        message: error.message,
        // Optionally include stack in dev mode
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        originalAction: originalMessage.payload.action
      },
      {
        priority: MessagePriority.HIGH,
        source: originalMessage.header.target || { id: 'system', type: 'system' }, // Respond from target or system
        target: originalMessage.header.source,
        correlationId: originalMessage.header.correlationId,
        sessionId: originalMessage.header.sessionId,
      }
    );
  }

  createResponse(originalMessage: Message, data: unknown): Message {
    return this.createMessage(
      MessageType.RESPONSE,
      `${originalMessage.payload.action}_response`,
      data,
      {
        priority: originalMessage.header.priority,
        source: originalMessage.header.target || { id: 'system', type: 'system' }, // Respond from target or system
        target: originalMessage.header.source,
        correlationId: originalMessage.header.correlationId,
        sessionId: originalMessage.header.sessionId,
      }
    );
  }

  // Placeholder implementations for sign/verify/register/unregister
  async signMessage(message: Message, privateKey: string): Promise<Message> {
    this.logger.warn('signMessage not implemented');
    message.signature = `signed-with-${privateKey.substring(0, 4)}`; // Placeholder
    return message;
  }

  async verifyMessage(message: Message, publicKey: string): Promise<boolean> {
    this.logger.warn('verifyMessage not implemented');
    return typeof message.signature === 'string'; // Placeholder
  }

  registerHandler(action: string, handler: (message: Message) => Promise<void>): void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);
    this.logger.debug(`Registered handler for action: ${action}`);
  }

  unregisterHandler(action: string, handler: (message: Message) => Promise<void>): void {
    const handlers = this.handlers.get(action);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(action);
      }
      this.logger.debug(`Unregistered handler for action: ${action}`);
    }
  }
}
