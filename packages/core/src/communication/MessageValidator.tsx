import { Injectable } from '@nestjs/common';
import {
  Message,
  MessageType,
  MessagePriority,
  MessageStatus,
  MessageMetadata,
  MessageValidationError,
  MessageValidationErrorCode,
} from './types.js';
import { Logger } from '@the-new-fuse/utils';
import { ConfigService } from '@nestjs/config';
import Joi from 'joi';

// Define Joi schema for Message for basic structure validation
const messageSchema = Joi.object<Message>({
  id: Joi.string().uuid().required(),
  type: Joi.string().valid(...Object.values(MessageType)).required(),
  source: Joi.string().required(),
  target: Joi.string().required(),
  content: Joi.any().required(), 
  metadata: Joi.object<MessageMetadata>({
    timestamp: Joi.date().iso().required(), // Changed from string to date().iso()
    priority: Joi.number().valid(...Object.values(MessagePriority).filter(v => typeof v === 'number')).required(),
    ttl: Joi.number().integer().min(0).optional(),
    retries: Joi.number().integer().min(0).optional(),
    maxRetries: Joi.number().integer().min(0).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    correlationId: Joi.string().optional(),
    sessionId: Joi.string().optional(),
    userId: Joi.string().optional(),
    agentId: Joi.string().optional(),
    version: Joi.string().optional(),
    signature: Joi.string().optional(),
    // Fields like 'participants' and 'description' belong to ChannelMetadata, not MessageMetadata as per types.d.tsx
    // If they are needed on MessageMetadata, types.d.tsx should be updated first.
  }).required(),
  status: Joi.string().valid(...Object.values(MessageStatus)).required(),
  error: Joi.object({
    code: Joi.string().required(), // Consider using Joi.string().valid(...Object.values(MessageValidationErrorCode)) if error codes are strictly from the enum
    message: Joi.string().required(),
    details: Joi.any().optional(),
  }).allow(null).optional(),
});

@Injectable()
export class MessageValidator {
  private logger: Logger;
  private readonly maxContentSizeBytes: number;
  private readonly defaultMaxRetries: number;
  private readonly defaultMaxTTLSeconds: number;

  constructor(private configService: ConfigService) {
    this.logger = new Logger(MessageValidator.name);
    this.maxContentSizeBytes = this.configService.get<number>('communication.maxContentSizeBytes', 1024 * 1024); // 1MB
    this.defaultMaxRetries = this.configService.get<number>('communication.defaultMaxRetries', 5);
    this.defaultMaxTTLSeconds = this.configService.get<number>('communication.defaultMaxTTLSeconds', 3600); // 1 hour
  }

  async validate(message: Message): Promise<MessageValidationError[]> {
    const errors: MessageValidationError[] = [];

    try {
      // Joi validation now uses validate, not validateAsync, if not doing async work inside schema
      const { error: joiError } = messageSchema.validate(message, { abortEarly: false });
      if (joiError) {
        joiError.details.forEach(detail => {
          errors.push({
            field: detail.path.join('.'),
            code: 'SCHEMA_VALIDATION_ERROR',
            message: detail.message,
          });
        });
      }
    } catch (err:unknown) { // Catch any unexpected error during Joi validation itself
        this.logger.error('Unexpected error during Joi schema validation:', err);
        errors.push({
            field: 'message',
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred during schema validation process.',
        });
    }

    // Content Size Validation
    const contentSize = this.calculateContentSizeBytes(message.content);
    if (contentSize > this.maxContentSizeBytes) {
      errors.push({
        field: 'content',
        code: 'SIZE_EXCEEDED',
        message: `Message content size ${contentSize} bytes exceeds maximum ${this.maxContentSizeBytes} bytes.`,
      });
    }

    // Custom Rules
    errors.push(...this.validateCustomRules(message));
    
    if (errors.length > 0) {
        this.logger.warn(`Validation failed for message ${message.id}: ${errors.map(e => e.message).join('; ')}`);
    }
    return errors;
  }

  private validateCustomRules(message: Message): MessageValidationError[] {
    const customErrors: MessageValidationError[] = [];
    const { metadata, type, content, source, target, status } = message;

    // Ensure metadata is present (Joi should catch this, but good for direct access)
    if (!metadata) {
        customErrors.push({
            field: 'metadata',
            code: 'SCHEMA_VALIDATION_ERROR', // Or a more specific code like 'MISSING_METADATA'
            message: 'Message metadata is required.',
        });
        return customErrors; // Stop further metadata checks if metadata is missing
    }

    if (new Date(metadata.timestamp) > new Date(Date.now() + 5000)) { // Allow a small 5s clock skew
      customErrors.push({
        field: 'metadata.timestamp',
        code: 'FUTURE_TIMESTAMP',
        message: 'Message timestamp cannot be significantly in the future.',
      });
    }

    const effectiveMaxTTL = this.configService.get<number>('communication.maxTtlSeconds', this.defaultMaxTTLSeconds);
    if (metadata.ttl !== undefined) {
      if (metadata.ttl <= 0 || metadata.ttl > effectiveMaxTTL) {
        customErrors.push({
          field: 'metadata.ttl',
          code: 'INVALID_TTL',
          message: `Invalid TTL: must be between 1 and ${effectiveMaxTTL} seconds.`,
        });
      }
    }

    const systemMaxRetries = this.configService.get<number>('communication.systemMaxRetries', this.defaultMaxRetries * 2);
    const effectiveMaxRetries = metadata.maxRetries ?? this.configService.get<number>('communication.defaultMaxRetries', this.defaultMaxRetries);
    
    if (metadata.retries !== undefined) {
        if (metadata.retries < 0 ){
            customErrors.push({
                field: 'metadata.retries',
                code: 'INVALID_RETRIES',
                message: 'Retry count cannot be negative.',
            });
        }
        if (metadata.retries > effectiveMaxRetries) {
            customErrors.push({
                field: 'metadata.retries',
                code: 'MAX_RETRIES_EXCEEDED',
                message: `Retry count ${metadata.retries} exceeds maximum allowed ${effectiveMaxRetries}.`,
            });
        }
    }
    
    if (metadata.maxRetries !== undefined && (metadata.maxRetries < 0 || metadata.maxRetries > systemMaxRetries)) {
        customErrors.push({
            field: 'metadata.maxRetries',
            code: 'INVALID_RETRIES', // Or a more specific code for maxRetries limit itself
            message: `Maximum retries ${metadata.maxRetries} is invalid or exceeds system limit ${systemMaxRetries}.`,
        });
    }

    // Business Logic Validations
    if (source === target) {
      customErrors.push({
        field: 'target',
        code: 'INVALID_TARGET' as MessageValidationErrorCode, // Ensure INVALID_TARGET is in MessageValidationErrorCode
        message: 'Message source and target cannot be the same.',
      });
    }

    // Type-specific content validation (examples)
    switch (type) {
      case MessageType.COMMAND:
        if (typeof content !== 'object' || content === null || !(content as any).commandName) {
          customErrors.push({
            field: 'content.commandName',
            code: 'INVALID_CONTENT' as MessageValidationErrorCode, // Ensure INVALID_CONTENT is in MessageValidationErrorCode
            message: 'Command messages must have a commandName property in content.',
          });
        }
        break;
      case MessageType.QUERY:
        if (typeof content !== 'object' || content === null || !(content as any).queryDetails) {
          customErrors.push({
            field: 'content.queryDetails',
            code: 'INVALID_CONTENT' as MessageValidationErrorCode,
            message: 'Query messages must have a queryDetails property in content.',
          });
        }
        break;
      case MessageType.RESPONSE:
      case MessageType.ERROR:
        if (!metadata.correlationId) {
          customErrors.push({
            field: 'metadata.correlationId',
            code: 'MISSING_CORRELATION_ID' as MessageValidationErrorCode, // Ensure MISSING_CORRELATION_ID is in MessageValidationErrorCode
            message: `${type} messages must have a correlationId in metadata.`,
          });
        }
        break;
      case MessageType.EVENT:
         if (typeof content !== 'object' || content === null || !(content as any).eventName) {
          customErrors.push({
            field: 'content.eventName',
            code: 'INVALID_CONTENT' as MessageValidationErrorCode,
            message: 'Event messages must have an eventName property in content.',
          });
        }
        break;
    }
    
    // Status specific validations
    if (status === MessageStatus.DELIVERED || status === MessageStatus.READ || status === MessageStatus.PROCESSED) {
        if (!metadata.correlationId && (type === MessageType.COMMAND || type === MessageType.QUERY)) {
            // This rule might be too strict or depend on specific flows.
            // Consider if all commands/queries that reach these statuses must have been correlated.
            // customErrors.push({
            //   field: 'metadata.correlationId',
            //   code: 'MISSING_CORRELATION_ID',
            //   message: `Messages with status ${status} for type ${type} usually require a correlationId.`,
            // });
        }
    }

    return customErrors;
  }

  private calculateContentSizeBytes(content: unknown): number {
    try {
      const stringifiedContent = JSON.stringify(content);
      return Buffer.from(stringifiedContent, 'utf-8').length;
    } catch (e) {
      this.logger.warn('Failed to calculate content size (content may not be JSON-serializable):', e);
      // Push a validation error directly or return a marker that leads to one
      // For now, returning Infinity is handled by the caller.
      return Infinity; 
    }
  }
}
