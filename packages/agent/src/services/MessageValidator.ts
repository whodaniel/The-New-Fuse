import { BaseService } from '../core/BaseService.js'; // Corrected import path
import { Logger } from '@packages/utils'; // Assuming Logger is available
import { Message, MessageType } from '@packages/types'; // Assuming types are available
import Ajv, { Schema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

// Define basic schema for a generic message
const baseMessageSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    timestamp: { type: 'string', format: 'date-time' },
    type: { type: 'string', enum: Object.values(MessageType) }, // Use MessageType enum values
    content: {}, // Allow any content for the base schema
    senderAgentId: { type: 'string', format: 'uuid', nullable: true }, // Optional sender
    // Add other common fields if necessary
  },
  required: ['id', 'timestamp', 'type', 'content'],
  additionalProperties: true, // Allow extra fields initially, tighten later if needed
};

// Example schema for a specific message type (e.g., 'task_assignment')
const taskAssignmentSchema: Schema = {
  type: 'object',
  properties: {
    ...baseMessageSchema.properties, // Inherit base properties
    type: { const: MessageType.TASK_ASSIGNMENT }, // Specific type
    content: {
      type: 'object',
      properties: {
        taskId: { type: 'string', format: 'uuid' },
        agentId: { type: 'string', format: 'uuid' },
        taskDetails: { type: 'object' }, // Placeholder for task details structure
      },
      required: ['taskId', 'agentId'],
      additionalProperties: true,
    },
  },
  required: [...(baseMessageSchema.required ?? []), 'content'],
};


/**
 * Service responsible for validating incoming and outgoing messages against predefined schemas.
 */
export class MessageValidator extends BaseService {
  private logger: Logger;
  private ajv: Ajv;
  private validators: Map<MessageType | string, ValidateFunction>;

  constructor() {
    super();
    this.logger = new Logger('MessageValidator');
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv); // Add formats like date-time, uuid

    this.validators = new Map();

    // Compile standard schemas
    this.addSchema(MessageType.GENERIC, baseMessageSchema); // Register base schema for generic type
    this.addSchema(MessageType.TASK_ASSIGNMENT, taskAssignmentSchema);
    // TODO: Add schemas for all other defined MessageTypes

    this.logger.info('MessageValidator initialized.');
  }

  /**
   * Adds or updates a schema for a specific message type.
   * @param messageType The type of message the schema applies to.
   * @param schema The JSON schema definition.
   */
  addSchema(messageType: MessageType | string, schema: Schema): void {
    try {
      const validate = this.ajv.compile(schema);
      this.validators.set(messageType, validate);
      this.logger.info(`Schema added/updated for message type: ${messageType}`);
    } catch (error) {
      this.logger.error(`Failed to compile schema for type ${messageType}: ${error.message}`, { schema, error });
      // Decide how to handle schema compilation errors
    }
  }

  /**
   * Validates a message object against its corresponding schema based on the 'type' property.
   * If no specific schema exists for the type, it falls back to the base message schema if available.
   * @param message The message object to validate.
   * @returns True if the message is valid, false otherwise. Errors are logged.
   */
  validate(message: unknown): message is Message {
    if (typeof message !== 'object' || message === null || !('type' in message)) {
      this.logger.warn('Validation failed: Input is not an object or lacks a "type" property.', { message });
      return false;
    }

    const messageType = (message as { type: MessageType | string }).type;
    let validator = this.validators.get(messageType);

    // Fallback to generic schema if specific one not found
    if (!validator) {
       this.logger.debug(`No specific schema found for type "${messageType}". Falling back to generic schema.`);
       validator = this.validators.get(MessageType.GENERIC);
    }

    if (!validator) {
      this.logger.warn(`Validation skipped: No schema found for message type "${messageType}" and no generic fallback available.`);
      // Decide if messages without schemas should be considered valid or invalid
      return true; // Or false, depending on desired strictness
    }

    const isValid = validator(message);
    if (!isValid) {
      this.logger.warn(`Validation failed for message type "${messageType}":`, {
        errors: validator.errors,
        message: this.sanitizeMessageForLog(message), // Avoid logging sensitive data
      });
    } else {
       this.logger.debug(`Validation successful for message type "${messageType}".`);
    }

    return isValid;
  }

  /**
   * Sanitizes a message object for logging purposes, potentially removing sensitive fields.
   * @param message The message object.
   * @returns A sanitized version of the message.
   */
  private sanitizeMessageForLog(message: any): any {
    // Basic sanitization: return only type and id, or implement more complex logic
    if (typeof message === 'object' && message !== null) {
      return { id: message.id, type: message.type, contentKeys: Object.keys(message.content || {}) };
    }
    return message;
    // TODO: Implement more robust sanitization based on message type and content structure
    // e.g., remove passwords, API keys, PII from content before logging errors.
  }

  /**
   * Retrieves the validation errors from the last validation attempt for a specific validator.
   * Note: This relies on Ajv's state and might not be reliable in highly concurrent scenarios
   * unless separate Ajv instances or validators are used per validation context.
   * @param messageType The message type whose last errors are requested.
   * @returns An array of validation errors, or null if no validator exists or no errors occurred.
   */
  getLastErrors(messageType: MessageType | string): Ajv['errors'] | null | undefined {
     const validator = this.validators.get(messageType);
     return validator?.errors;
  }
}
