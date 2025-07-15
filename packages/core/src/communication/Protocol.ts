import { EventEmitter } from 'events';
import crypto from 'crypto';
import { z } from 'zod';
import { Logger } from 'winston';

// Message schemas
const MessageHeaderSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['request', 'response', 'event', 'error']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: z.date(),
  source: z.object({
    id: z.string(),
    type: z.string(),
  }),
  target: z.object({
    id: z.string(),
    type: z.string(),
  }).optional(),
  correlationId: z.string().uuid().optional(),
  ttl: z.number().positive().optional(),
});

const MessagePayloadSchema = z.object({
  action: z.string(),
  data: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

const MessageSchema = z.object({
  header: MessageHeaderSchema,
  payload: MessagePayloadSchema,
  signature: z.string().optional(),
});

// Types
export type MessageHeader = z.infer<typeof MessageHeaderSchema>;
export type MessagePayload = z.infer<typeof MessagePayloadSchema>;
export type Message = z.infer<typeof MessageSchema>;

export enum MessagePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  ERROR = 'error',
}

export interface ProtocolOptions {
  version: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export class Protocol extends EventEmitter {
  private version: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;
  private logger: Logger;

  constructor(logger: Logger, options: Partial<ProtocolOptions> = {}) {
    super();
    this.version = options.version || '1.0.0';
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 30000;
    this.logger = logger;
  }

  createMessage(
    type: MessageType,
    action: string,
    data?: any,
    options: {
      source?: { id: string; type: string };
      target?: { id: string; type: string };
      priority?: MessagePriority;
      correlationId?: string;
      ttl?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Message {
    try {
      const message: Message = {
        header: {
          id: crypto.randomUUID(),
          type,
          priority: options.priority || MessagePriority.MEDIUM,
          timestamp: new Date(),
          source: options.source || { id: 'system', type: 'system' },
          target: options.target,
          correlationId: options.correlationId,
          ttl: options.ttl,
        },
        payload: {
          action,
          data,
          metadata: options.metadata,
        },
      };

      const validatedMessage = MessageSchema.parse(message);
      this.emit('messageCreated', validatedMessage);
      return validatedMessage;
    } catch (error) {
      this.logger.error('Message validation failed:', error);
      throw new Error(
        `Message validation failed: ${error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : 'error'}`
      );
    }
  }

  createRequest(
    action: string,
    data?: any,
    options: {
      source?: { id: string; type: string };
      target?: { id: string; type: string };
      priority?: MessagePriority;
      correlationId?: string;
      ttl?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Message {
    return this.createMessage(MessageType.REQUEST, action, data, options);
  }

  createResponse(
    originalMessage: Message,
    data?: any,
    options: {
      metadata?: Record<string, any>;
    } = {}
  ): Message {
    if (!originalMessage.header.target) {
      throw new Error('Cannot create a response for a message with no source.');
    }

    return this.createMessage(
      MessageType.RESPONSE,
      originalMessage.payload.action,
      data,
      {
        source: originalMessage.header.target,
        target: originalMessage.header.source,
        correlationId: originalMessage.header.id,
        metadata: options.metadata,
      }
    );
  }

  createEvent(
    action: string,
    data?: any,
    options: {
      source?: { id: string; type: string };
      target?: { id: string; type: string };
      priority?: MessagePriority;
      metadata?: Record<string, any>;
    } = {}
  ): Message {
    return this.createMessage(MessageType.EVENT, action, data, options);
  }

  createError(
    originalMessage: Message,
    error: Error,
    options: {
      metadata?: Record<string, any>;
    } = {}
  ): Message {
    if (!originalMessage.header.target) {
      throw new Error('Cannot create an error response for a message with no source.');
    }

    return this.createMessage(
      MessageType.ERROR,
      originalMessage.payload.action,
      {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        source: originalMessage.header.target,
        target: originalMessage.header.source,
        correlationId: originalMessage.header.id,
        metadata: options.metadata,
      }
    );
  }

  validateMessage(message: unknown): message is Message {
    try {
      MessageSchema.parse(message);
      return true;
    } catch (error) {
      this.logger.error('Message validation failed:', error);
      return false;
    }
  }

  isExpired(message: Message): boolean {
    if (!message.header.ttl) {
      return false;
    }
    const age = Date.now() - message.header.timestamp.getTime();
    return age > message.header.ttl;
  }

  async sendWithRetry(
    message: Message,
    sendFn: (message: Message) => Promise<void>
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await sendFn(message);
        this.emit('messageSent', message);
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Send attempt ${attempt + 1} failed:`, error);

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        }
      }
    }

    this.emit('messageFailed', message, lastError);
    throw lastError;
  }

  async handleMessage(
    message: Message,
    handlers: Record<string, (payload: any) => Promise<any>>
  ): Promise<void> {
    try {
      if (!this.validateMessage(message)) {
        throw new Error('Invalid message format');
      }

      if (this.isExpired(message)) {
        this.logger.warn('Expired message received:', message.header.id);
        return;
      }

      const handler = handlers[message.payload.action];
      if (!handler) {
        throw new Error(`No handler found for action: ${message.payload.action}`);
      }

      const result = await handler(message.payload.data);

      if (message.header.type === MessageType.REQUEST) {
        const response = this.createResponse(message, result);
        this.emit('responseReady', response);
      }

      this.emit('messageHandled', message);
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.emit('messageError', message, error);

      if (message.header.type === MessageType.REQUEST) {
        const errorResponse = this.createError(message, error as Error);
        this.emit('responseReady', errorResponse);
      }
    }
  }

  async signMessage(message: Message, privateKey: string): Promise<Message> {
    try {
      const messageString = JSON.stringify(message);
      const signature = crypto
        .createSign('RSA-SHA256')
        .update(messageString)
        .sign(privateKey, 'base64');

      return {
        ...message,
        signature,
      };
    } catch (error) {
      this.logger.error('Failed to sign message:', error);
      throw error;
    }
  }

  async verifyMessage(message: Message, publicKey: string): Promise<boolean> {
    try {
      if (!message.signature) {
        return false;
      }

      const { signature, ...messageWithoutSignature } = message;
      const messageString = JSON.stringify(messageWithoutSignature);

      return crypto
        .createVerify('RSA-SHA256')
        .update(messageString)
        .verify(publicKey, signature, 'base64');
    } catch (error) {
      this.logger.error('Failed to verify message signature:', error);
      return false;
    }
  }

  getMessageId(): string {
    return crypto.randomUUID();
  }

  getCorrelationId(): string {
    return crypto.randomUUID();
  }
}