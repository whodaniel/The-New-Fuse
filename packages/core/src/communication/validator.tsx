import { Injectable } from '@nestjs/common';
import { Message, MessageType, MessageValidationError } from './types.js';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Injectable()
export class MessageValidator {
  private readonly schemas: Map<MessageType, Joi.ObjectSchema>;
  private readonly maxContentSize: number;

  constructor(private readonly configService: ConfigService) {
    this.maxContentSize = this.configService.get<number>('MAX_MESSAGE_SIZE', 1024 * 1024); // Added type argument
    this.schemas = new Map<MessageType, Joi.ObjectSchema>(); // Initialize schemas map
    // Base message schema
    const baseSchema = Joi.object({
      id: Joi.string().required(),
      type: Joi.string()
        .valid(...Object.values(MessageType))
        .required(),
      source: Joi.string().required(),
      target: Joi.string().required(),
      metadata: Joi.object({
        timestamp: Joi.date().required(), // .iso() removed, Date object is fine
        priority: Joi.number().min(0).max(3).required(),
        ttl: Joi.number().optional(),
        retries: Joi.number().min(0).optional(),
        maxRetries: Joi.number().min(0).optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        correlationId: Joi.string().optional(),
        sessionId: Joi.string().optional(),
        userId: Joi.string().optional(),
        agentId: Joi.string().optional(),
        version: Joi.string().optional(),
        signature: Joi.string().optional(),
      }).required(),
      status: Joi.string().required(),
      error: Joi.object( {
        code: Joi.string().required(),
        details: Joi.any().optional(),
      }).optional(),
    });

    // Command message schema
    this.schemas.set(
      MessageType.COMMAND,
      baseSchema.keys({
        content: Joi.object({
          command: Joi.string().required(), // .required() added
          args: Joi.array().items(Joi.any()).optional(),
          options: Joi.object().optional(),
        }).required(),
      }),
    );

    // Event message schema
    this.schemas.set(
      MessageType.EVENT,
      baseSchema.keys({
        content: Joi.object({
          event: Joi.string().required(), // .required() added
          payload: Joi.any().required(),
          timestamp: Joi.date().required(), // .iso() removed
        }).required(),
      }),
    );

    // Query message schema
    this.schemas.set(
      MessageType.QUERY,
      baseSchema.keys({
        content: Joi.object({
          query: Joi.string().required(), // .required() added
          params: Joi.object().optional(),
          timeout: Joi.number().optional(),
        }).required(),
      }),
    );

    // Response message schema
    this.schemas.set(
      MessageType.RESPONSE,
      baseSchema.keys({
        content: Joi.object({
          data: Joi.any().required(), // .required() added
          status: Joi.number().required(),
          metadata: Joi.object().optional(),
        }).required(),
      }),
    );

    // Error message schema
    this.schemas.set(
      MessageType.ERROR,
      baseSchema.keys({
        content: Joi.object({
          code: Joi.string().required(), // .required() added
          message: Joi.string().required(),
          details: Joi.any().optional(),
          stack: Joi.string().optional(),
        }).required(),
      }),
    );

    // State update message schema
    this.schemas.set(
      MessageType.STATE_UPDATE,
      baseSchema.keys({
        content: Joi.object({
          path: Joi.string().required(), // .required() added
          value: Joi.any().required(),
          previousValue: Joi.any().optional(),
          timestamp: Joi.date().required(), // .iso() removed
        }).required(),
      }),
    );

    // Heartbeat message schema
    this.schemas.set(
      MessageType.HEARTBEAT,
      baseSchema.keys({
        content: Joi.object({
          timestamp: Joi.date().required(), // .iso() removed
          status: Joi.string().required(), // .required() added
          metrics: Joi.object().optional(),
        }).required(),
      }),
    );
  }

  async validate(message: Message): Promise<MessageValidationError[]> {
    const errors: MessageValidationError[] = [];

    // Check message size
    const messageSize = Buffer.from(JSON.stringify(message)).length;
    if (messageSize > this.maxContentSize) {
      errors.push({
        field: 'message',
        code: 'SIZE_EXCEEDED',
        message: `Message size (${messageSize} bytes) exceeds maximum allowed size (${this.maxContentSize} bytes)`,
      });
    }

    // Validate against schema
    const schema = this.schemas.get(message.type);
    if (!schema) {
      errors.push({
        field: 'type',
        code: 'INVALID_TYPE',
        message: `Unknown message type: ${message.type}`,
      });
    } else {
      const validationResult = schema.validate(message, { abortEarly: false });
      if (validationResult.error) {
        validationResult.error.details.forEach((detail) => {
          errors.push({
            field: detail.path.join('.'),
            code: 'SCHEMA_VALIDATION_ERROR', // Generic code for schema issues
            message: detail.message,
          });
        });
      }
    }

    // Custom validations
    await this.validateCustomRules(message, errors);

    return errors;
  }

  private async validateCustomRules(
    message: Message,
    errors: MessageValidationError[],
  ): Promise<void> {
    // Validate timestamp is not in the future
    const now = new Date().getTime();
    if (message.metadata.timestamp.getTime() > now + 1000) { // Allow 1 second clock skew
      errors.push({
        field: 'metadata.timestamp',
        code: 'FUTURE_TIMESTAMP',
        message: 'Message timestamp cannot be in the future',
      });
    }

    // Validate TTL if present
    if (message.metadata.ttl !== undefined && message.metadata.ttl <= 0) {
      errors.push({
        field: 'metadata.ttl',
        code: 'INVALID_TTL',
        message: 'TTL must be greater than 0',
      });
    }

    // Validate retries and maxRetries
    if (message.metadata.retries !== undefined && message.metadata.maxRetries !== undefined) {
      if (message.metadata.retries > message.metadata.maxRetries) {
        errors.push({
          field: 'metadata.retries',
          code: 'MAX_RETRIES_EXCEEDED', // Corrected error code
          message: 'Retries cannot exceed maxRetries',
        });
      }
    }

    // Validate correlationId depth (example)
    if (message.metadata.correlationId) {
      const depth = await this.getCorrelationChainDepth(message.metadata.correlationId);
      const maxDepth = this.configService.get<number>('MAX_CORRELATION_DEPTH', 10);
      if (depth > maxDepth) {
        errors.push({
          field: 'metadata.correlationId',
          code: 'CORRELATION_DEPTH_EXCEEDED',
          message: `Correlation chain depth (${depth}) exceeds maximum allowed depth (${maxDepth})`,
        });
      }
    }

    // Validate message signature if required
    if (this.configService.get<boolean>('REQUIRE_MESSAGE_SIGNATURE', false)) {
      if (!message.metadata.signature) {
        errors.push({
          field: 'metadata.signature',
          code: 'MISSING_SIGNATURE',
          message: 'Message signature is required',
        });
      } else {
        const isValid = await this.verifySignature(message);
        if (!isValid) {
          errors.push({
            field: 'metadata.signature',
            code: 'INVALID_SIGNATURE',
            message: 'Invalid message signature',
          });
        }
      }
    }
  }

  // Placeholder for actual implementation
  private async getCorrelationChainDepth(correlationId: string): Promise<number> {
    // Example: query a database or cache to determine depth
    this.logger.log(`Checking correlation depth for: ${correlationId}`);
    return Promise.resolve(correlationId.split('->').length); // Simplified example
  }

  // Placeholder for actual implementation
  private async verifySignature(message: Message): Promise<boolean> {
    // Example: use a crypto library to verify the signature
    this.logger.log(`Verifying signature for message: ${message.id}`);
    // Replace with actual signature verification logic
    return Promise.resolve(true); // Simplified for now
  }
  private logger = { log: console.log, warn: console.warn, error: console.error }; // Basic logger
}
