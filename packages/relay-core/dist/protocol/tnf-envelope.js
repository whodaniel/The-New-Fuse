"use strict";
/**
 * TNF Unified Message Protocol
 * Based on Gemini's architectural recommendations
 *
 * This protocol works across:
 * - WebSocket Relay
 * - Redis Pub/Sub
 * - Orchestrator task delegation
 * - Workflow execution
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFMessageBuilder = exports.ResponsePayload = exports.StateSyncPayload = exports.EventPayload = exports.TaskPayload = exports.TNFEnvelope = exports.MessageContext = exports.AgentIdentity = exports.MessageType = void 0;
exports.createTNFEnvelope = createTNFEnvelope;
exports.validateTNFEnvelope = validateTNFEnvelope;
exports.isTaskMessage = isTaskMessage;
exports.isEventMessage = isEventMessage;
exports.requiresResponse = requiresResponse;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
/**
 * Message Types
 */
exports.MessageType = zod_1.z.enum([
    'command', // Direct action request
    'event', // Fire-and-forget notification
    'task', // Requires ACK/result
    'state-sync', // State synchronization
    'query', // Information request
    'response', // Response to query/task
]);
/**
 * Agent Identity
 */
exports.AgentIdentity = zod_1.z.object({
    agentId: zod_1.z.string().describe('Unique agent identifier'),
    role: zod_1.z.enum(['orchestrator', 'worker', 'coordinator', 'observer']).optional(),
    platform: zod_1.z.string().optional().describe('Platform (e.g., "gemini", "claude", "terminal")'),
    capabilities: zod_1.z.array(zod_1.z.string()).optional().describe('Agent capabilities'),
});
/**
 * Message Context
 */
exports.MessageContext = zod_1.z.object({
    workflowId: zod_1.z.string().optional().describe('Parent workflow ID'),
    stepId: zod_1.z.string().optional().describe('Workflow step ID'),
    sessionId: zod_1.z.string().optional().describe('Conversation session ID'),
    channelId: zod_1.z.string().optional().describe('Relay channel ID'),
    sequenceId: zod_1.z.number().optional().describe('Message sequence number for ordering'),
    parentMessageId: zod_1.z.string().optional().describe('ID of message this is responding to'),
});
/**
 * TNF Envelope - Unified Message Format
 */
exports.TNFEnvelope = zod_1.z.object({
    // Core metadata
    id: zod_1.z.string().uuid().describe('Unique message ID'),
    version: zod_1.z.string().default('1.0').describe('Protocol version'),
    traceId: zod_1.z.string().uuid().describe('Correlation ID for debugging/tracing'),
    timestamp: zod_1.z.string().datetime().describe('ISO-8601 timestamp'),
    // Message classification
    type: exports.MessageType,
    // Routing
    from: exports.AgentIdentity,
    to: exports.AgentIdentity.or(zod_1.z.object({ broadcast: zod_1.z.boolean() })),
    // Content
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).describe('Message-specific data'),
    // Context
    context: exports.MessageContext.optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().describe('Additional metadata'),
});
/**
 * Specific Message Payloads
 */
// Task payload
exports.TaskPayload = zod_1.z.object({
    action: zod_1.z.string().describe('Action to perform'),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    timeout: zod_1.z.number().optional().describe('Timeout in milliseconds'),
    priority: zod_1.z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
});
// Event payload
exports.EventPayload = zod_1.z.object({
    eventType: zod_1.z.string().describe('Type of event'),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    source: zod_1.z.string().optional().describe('Event source'),
});
// State sync payload
exports.StateSyncPayload = zod_1.z.object({
    stateKey: zod_1.z.string().describe('Redis key for state'),
    stateValue: zod_1.z.unknown(),
    version: zod_1.z.number().describe('State version for optimistic locking'),
    operation: zod_1.z.enum(['set', 'update', 'delete', 'get']),
});
// Response payload
exports.ResponsePayload = zod_1.z.object({
    success: zod_1.z.boolean(),
    result: zod_1.z.unknown().optional(),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.unknown().optional(),
    }).optional(),
});
/**
 * Helper Functions
 */
function createTNFEnvelope(type, from, to, payload, context) {
    return {
        id: crypto_1.default.randomUUID(),
        version: '1.0',
        traceId: crypto_1.default.randomUUID(),
        timestamp: new Date().toISOString(),
        type,
        from,
        to,
        payload,
        context,
    };
}
function validateTNFEnvelope(data) {
    return exports.TNFEnvelope.parse(data);
}
function isTaskMessage(envelope) {
    return envelope.type === 'task';
}
function isEventMessage(envelope) {
    return envelope.type === 'event';
}
function requiresResponse(envelope) {
    return envelope.type === 'task' || envelope.type === 'query';
}
/**
 * Message Builder
 */
class TNFMessageBuilder {
    envelope = {
        version: '1.0',
        id: crypto_1.default.randomUUID(),
        traceId: crypto_1.default.randomUUID(),
        timestamp: new Date().toISOString(),
    };
    type(type) {
        this.envelope.type = type;
        return this;
    }
    from(from) {
        this.envelope.from = from;
        return this;
    }
    to(to) {
        this.envelope.to = to;
        return this;
    }
    payload(payload) {
        this.envelope.payload = payload;
        return this;
    }
    context(context) {
        this.envelope.context = context;
        return this;
    }
    metadata(metadata) {
        this.envelope.metadata = metadata;
        return this;
    }
    traceId(traceId) {
        this.envelope.traceId = traceId;
        return this;
    }
    build() {
        return exports.TNFEnvelope.parse(this.envelope);
    }
}
exports.TNFMessageBuilder = TNFMessageBuilder;
//# sourceMappingURL=tnf-envelope.js.map