import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

enum MessageType {
  COMMAND = 'command',
  EVENT = 'event',
  QUERY = 'query',
  RESPONSE = 'response',
  ERROR = 'error',
  STATE_UPDATE = 'state_update',
  HEARTBEAT = 'heartbeat',
}

@Injectable()
export class MessageValidator {
  private readonly logger = new Logger(MessageValidator.name);
  private maxContentSize: number;

  constructor(private readonly configService: ConfigService) {
    this.maxContentSize = this.configService.get<number>('MAX_CONTENT_SIZE') || 1024 * 1024; // 1MB default
  }

  private readonly messageSchema = Joi.object({
    header: Joi.object({
        id: Joi.string().uuid().required(),
        type: Joi.string().valid(...Object.values(MessageType)).required(),
        timestamp: Joi.date().iso().required(),
        correlationId: Joi.string().uuid(),
        // Add other header fields as necessary
    }).required(),
    payload: Joi.object().required(),
    signature: Joi.string(),
  });

  async validate(message: any): Promise<{ valid: boolean; errors: any[] }> {
    const { error } = this.messageSchema.validate(message, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return { valid: false, errors: validationErrors };
    }

    const contentSize = Buffer.byteLength(JSON.stringify(message.payload));
    if (contentSize > this.maxContentSize) {
        return { valid: false, errors: [{ field: 'payload', message: 'Payload size exceeds limit' }] };
    }

    return { valid: true, errors: [] };
  }
}
