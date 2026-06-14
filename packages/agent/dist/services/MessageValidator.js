"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidator = void 0;
const types_1 = require("@the-new-fuse/types");
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const BaseService_js_1 = require("../core/BaseService.js");
const core_js_1 = require("../types/core.js");
const Ajv = require('ajv');
const baseMessageSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
        type: { type: 'string', enum: Object.values(types_1.MessageType) },
        content: {},
        senderAgentId: { type: 'string', format: 'uuid', nullable: true },
    },
    required: ['id', 'timestamp', 'type', 'content'],
    additionalProperties: true,
};
const commandSchema = {
    ...baseMessageSchema,
    properties: {
        ...baseMessageSchema.properties,
        type: { const: types_1.MessageType.COMMAND },
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
const taskAssignmentSchema = {
    ...baseMessageSchema,
    properties: {
        ...baseMessageSchema.properties,
        type: { const: types_1.MessageType.TASK_ASSIGNMENT },
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
class MessageValidator extends BaseService_js_1.BaseService {
    constructor() {
        super({ name: 'MessageValidator' });
        this.logger = new core_js_1.Logger('MessageValidator');
        this.ajv = new Ajv({ allErrors: true });
        (0, ajv_formats_1.default)(this.ajv);
        this.validators = new Map();
        this.addSchema(types_1.MessageType.TEXT, baseMessageSchema);
        this.addSchema(types_1.MessageType.COMMAND, commandSchema);
        this.addSchema(types_1.MessageType.EVENT, baseMessageSchema);
        this.addSchema(types_1.MessageType.ERROR, baseMessageSchema);
        this.addSchema(types_1.MessageType.STATUS, baseMessageSchema);
        this.addSchema(types_1.MessageType.RESPONSE, baseMessageSchema);
        this.addSchema(types_1.MessageType.NOTIFICATION, baseMessageSchema);
        this.addSchema(types_1.MessageType.TASK_ASSIGNMENT, taskAssignmentSchema);
        this.logger.info('MessageValidator initialized.');
    }
    addSchema(messageType, schema) {
        try {
            const validate = this.ajv.compile(schema);
            this.validators.set(messageType, validate);
            this.logger.info(`Schema added/updated for message type: ${messageType}`);
        }
        catch (error) {
            this.logger.error(`Failed to compile schema for type ${messageType}: ${error.message}`);
        }
    }
    validate(message) {
        if (typeof message !== 'object' || message === null || !('type' in message)) {
            this.logger.warn('Validation failed: Input is not an object or lacks a "type" property.');
            return false;
        }
        const messageType = message.type;
        let validator = this.validators.get(messageType);
        if (!validator) {
            this.logger.debug(`No specific schema found for type "${messageType}".`);
            return false;
        }
        const isValid = validator(message);
        if (!isValid) {
            this.logger.warn(`Validation failed for message type "${messageType}": ${JSON.stringify(validator.errors)}`);
            this.logger.warn(`Message content: ${JSON.stringify(this.sanitizeMessageForLog(message))}`);
        }
        else {
            this.logger.debug(`Validation successful for message type "${messageType}".`);
        }
        return isValid;
    }
    sanitizeMessageForLog(message) {
        const sanitizedContent = typeof message.content === 'object' && message.content !== null
            ? { ...message.content }
            : { value: message.content };
        if (typeof sanitizedContent === 'object' && sanitizedContent !== null) {
            for (const key of Object.keys(sanitizedContent)) {
                if (key.toLowerCase().includes('password') ||
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('apikey')) {
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
    getLastErrors(messageType) {
        const validator = this.validators.get(messageType);
        return validator?.errors;
    }
}
exports.MessageValidator = MessageValidator;
//# sourceMappingURL=MessageValidator.js.map