import { BaseService } from '../core/BaseService.js';
import { Logger } from '@the-new-fuse/core';
import { Message, MessageType } from '@the-new-fuse/types';
const Ajv = require('ajv');
type ValidateFunction = any;
type Schema = any;
import addFormats from 'ajv-formats';

const baseMessageSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    timestamp: { type: 'string', format: 'date-time' },
    type: { type: 'string', enum: Object.values(MessageType) },
    content: {},
    senderAgentId: { type: 'string', format: 'uuid', nullable: true },
  },
  required: ['id', 'timestamp', 'type', 'content'],
  additionalProperties: true,
};

const commandSchema: Schema = {
  ...baseMessageSchema,
  properties: {
      ...baseMessageSchema.properties,
      type: { const: MessageType.COMMAND },
      content: {
          type: 'object',
          properties: {
              commandType: { type: 'string' },
              parameters: { type: 'object' },
          },
          required: ['commandType'],
      },
  },
};

const taskAssignmentSchema: Schema = {
    ...baseMessageSchema,
    properties: {
        ...baseMessageSchema.properties,
        type: { const: MessageType.TASK_ASSIGNMENT },
        content: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                title: { type: 'string' },
            },
            required: ['id', 'title'],
        },
    },
};

export class MessageValidator extends BaseService {
  private logger: Logger;
  private ajv: any;
  private validators: Map<string, ValidateFunction>;

  constructor() {
    super({ name: 'MessageValidator' });
    this.logger = new Logger('MessageValidator');
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);

    this.validators = new Map();

    this.addSchema(MessageType.TEXT, baseMessageSchema);
    this.addSchema(MessageType.COMMAND, commandSchema);
    this.addSchema(MessageType.EVENT, baseMessageSchema);
    this.addSchema(MessageType.ERROR, baseMessageSchema);
    this.addSchema(MessageType.STATUS, baseMessageSchema);
    this.addSchema(MessageType.RESPONSE, baseMessageSchema);
    this.addSchema(MessageType.NOTIFICATION, baseMessageSchema);
    this.addSchema(MessageType.TASK_ASSIGNMENT, taskAssignmentSchema);

    this.logger.info('MessageValidator initialized.');
  }

  addSchema(messageType: string, schema: Schema): void {
    try {
      const validate = this.ajv.compile(schema);
      this.validators.set(messageType, validate);
      this.logger.info(`Schema added/updated for message type: ${messageType}`);
    } catch (error) {
      this.logger.error(`Failed to compile schema for type ${messageType}: ${(error as Error).message}`);
    }
  }

  validate(message: unknown): message is Message {
    if (typeof message !== 'object' || message === null || !('type' in message)) {
      this.logger.warn('Validation failed: Input is not an object or lacks a "type" property.');
      return false;
    }

    const messageType = (message as { type: MessageType | string }).type;
    let validator = this.validators.get(messageType);

    if (!validator) {
       this.logger.debug(`No specific schema found for type "${messageType}".`);
       return false;
    }

    const isValid = validator(message) as boolean;
    if (!isValid) {
      this.logger.warn(`Validation failed for message type "${messageType}": ${JSON.stringify((validator as any).errors)}`);
      this.logger.warn(`Message content: ${JSON.stringify(this.sanitizeMessageForLog(message as Message))}`);
    } else {
       this.logger.debug(`Validation successful for message type "${messageType}".`);
    }

    return isValid;
  }

  private sanitizeMessageForLog(message: Message): any {
    const sanitizedContent = { ...message.content };
    if (typeof sanitizedContent === 'object' && sanitizedContent !== null) {
        for (const key of Object.keys(sanitizedContent)) {
            if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('apikey')) {
                sanitizedContent[key] = '[REDACTED]';
            }
        }
    }
    return {
        id: message.id,
        type: message.type,
        content: sanitizedContent,
    };
  }

  getLastErrors(messageType: string): any {
     const validator = this.validators.get(messageType);
     return (validator as any)?.errors;
  }
}
