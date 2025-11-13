"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidator = void 0;
const BaseService_1 = require("../core/BaseService"); // Corrected import path
const common_1 = require("@nestjs/common");
const Ajv = require('ajv');
const ajv_formats_1 = __importDefault(require("ajv-formats"));
// Define basic schema for a generic message
const baseMessageSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        type: { type: 'string', enum: ['chat', 'broadcast', 'task_assignment', 'generic'] }, // Use MessageType enum values
        content: {}, // Allow any content for the base schema
        senderAgentId: { type: 'string', format: 'uuid', nullable: true }, // Optional sender
        // Add other common fields if necessary
    },
    required: ['id', 'timestamp', 'type', 'content'],
    additionalProperties: true, // Allow extra fields initially, tighten later if needed
};
// Example schema for a specific message type (e.g., 'task_assignment')
const taskAssignmentSchema = {
    type: 'object',
    properties: {
        ...baseMessageSchema.properties, // Inherit base properties
        type: { const: 'task_assignment' }, // Specific type
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
class MessageValidator extends BaseService_1.BaseService {
    logger;
    ajv;
    validators;
    constructor() {
        super({ name: 'MessageValidator' });
        this.logger = new common_1.Logger('MessageValidator');
        this.ajv = new Ajv({ allErrors: true });
        (0, ajv_formats_1.default)(this.ajv); // Add formats like date-time, uuid
        this.validators = new Map();
        // Compile standard schemas
        this.addSchema('generic', baseMessageSchema); // Register base schema for generic type
        this.addSchema('task_assignment', taskAssignmentSchema);
        // TODO: Add schemas for all other defined MessageTypes
        this.logger.log('MessageValidator initialized.');
    }
    /**
     * Adds or updates a schema for a specific message type.
     * @param messageType The type of message the schema applies to.
     * @param schema The JSON schema definition.
     */
    addSchema(messageType, schema) {
        try {
            const validate = this.ajv.compile(schema);
            this.validators.set(messageType, validate);
            this.logger.log(`Schema added/updated for message type: ${messageType});
    } catch (error) {`, this.logger.error(`Failed to compile schema for type ${messageType}`, $, {}(error).message));
        }
        finally // Decide how to handle schema compilation errors
         { }
        ;
        // Decide how to handle schema compilation errors
    }
}
exports.MessageValidator = MessageValidator;
/**
 * Validates a message object against its corresponding schema based on the 'type' property.
 * If no specific schema exists for the type, it falls back to the base message schema if available.
 * @param message The message object to validate.
 * @returns True if the message is valid, false otherwise. Errors are logged.
 */
validate(message, unknown);
message;
is;
Message;
{
    if (typeof message !== 'object' || message === null || !('type' in message)) {
        this.logger.warn('Validation failed: Input is not an object or lacks a "type" property.');
        return false;
    }
    const messageType = message.type;
    let validator = this.validators.get(messageType);
    // Fallback to generic schema if specific one not found
    if (!validator) {
        `
       this.logger.debug(`;
        No;
        specific;
        schema;
        found;
        for (type; "${messageType}`".Falling; back)
            to;
        generic;
        schema.;
        ;
        validator = this.validators.get('generic');
    }
    if (!validator) {
        this.logger.warn(Validation, skipped, No, schema, found);
        for (message; type; "${messageType}")
            and;
        no;
        generic;
        fallback;
        available.;
        ;
        // Decide if messages without schemas should be considered valid or invalid
        return true; // Or false, depending on desired strictness
    }
    const isValid = validator(message);
    if (!isValid) {
        `
      this.logger.warn(Validation failed for message type "${messageType}": ${JSON.stringify(validator.errors)}`;
        ;
    }
    else {
        this.logger.debug(Validation, successful);
        for (message; type; "${messageType}`". `);
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
  getLastErrors(messageType: string): any {
     const validator = this.validators.get(messageType);
     return (validator as any)?.errors;
  }
}
        )
            ;
    }
}
//# sourceMappingURL=MessageValidator.js.map