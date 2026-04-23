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
exports.TNFMessageBuilder = exports.BidPayload = exports.AuctionPayload = exports.ResponsePayload = exports.StateSyncPayload = exports.EventPayload = exports.TaskPayload = exports.TNFEnvelope = exports.MessageContext = exports.AgentIdentity = exports.MessageType = void 0;
exports.getTNFEnvelopeAuditTrace = getTNFEnvelopeAuditTrace;
exports.normalizeTNFEnvelope = normalizeTNFEnvelope;
exports.createTNFEnvelope = createTNFEnvelope;
exports.validateTNFEnvelope = validateTNFEnvelope;
exports.isTaskMessage = isTaskMessage;
exports.isEventMessage = isEventMessage;
exports.requiresResponse = requiresResponse;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const audit_js_1 = require("../contracts/audit.js");
const identity_js_1 = require("../contracts/identity.js");
const resource_protocol_js_1 = require("./resource-protocol.js");
/**
 * Message Types
 */
exports.MessageType = zod_1.z.enum([
    'command', // Direct action request
    'event', // Fire-and-forget notification
    'task', // Requires ACK/result
    'handoff', // Targeted prompt/state transfer between agents
    'handoff-ack', // Acknowledgement for a handoff packet
    'state-sync', // State synchronization
    'query', // Information request
    'response', // Response to query/task
    'resource-negotiate', // Resource/Quota management
    'auction', // Broadcast for task bidding
    'bid', // Agent bid for a task
    'award', // Selection of an agent for a task
]);
/**
 * Agent Identity
 */
exports.AgentIdentity = zod_1.z.object({
    agentId: zod_1.z.string().describe('Unique agent identifier'),
    canonicalEntityId: zod_1.z.string().optional().describe('Canonical TNF identity for this agent'),
    operationalHandle: zod_1.z.string().optional().describe('Operational routing handle for this agent'),
    runtimeSessionId: zod_1.z.string().optional().describe('Runtime session identifier for this agent'),
    aliases: zod_1.z.array(zod_1.z.string()).optional().describe('Known aliases for this agent'),
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
    traceId: zod_1.z.string().min(1).describe('Correlation ID for debugging/tracing'),
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
    // Resource Control (NEW PRIMITIVE)
    resource: resource_protocol_js_1.ResourceStrategy.optional().describe('Strategic resource/account handling instructions'),
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
    error: zod_1.z
        .object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.unknown().optional(),
    })
        .optional(),
});
// Auction payload
exports.AuctionPayload = zod_1.z.object({
    taskId: zod_1.z.string().describe('ID of the task up for auction'),
    taskType: zod_1.z.string().describe('Type of task (e.g. "code-generation")'),
    requirements: zod_1.z.array(zod_1.z.string()).describe('Required capabilities'),
    priority: zod_1.z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    expiresAt: zod_1.z.number().describe('Timestamp when the auction ends'),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
// Bid payload
exports.BidPayload = zod_1.z.object({
    taskId: zod_1.z.string().describe('ID of the task being bid on'),
    suitability: zod_1.z.number().min(0).max(1).describe('Score from 0-1 on how well the agent fits'),
    estimatedDuration: zod_1.z.number().optional().describe('Estimated time to complete in ms'),
    status: zod_1.z.string().optional().describe('Current agent status/load info'),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
/**
 * Helper Functions
 */
function normalizeAgentIdentity(identity) {
    const aliases = Array.isArray(identity.aliases) ? identity.aliases : [];
    try {
        const record = (0, identity_js_1.createAgentIdentityRecord)({
            canonicalEntityId: identity.canonicalEntityId,
            operationalHandle: identity.operationalHandle || identity.agentId,
            runtimeSessionId: identity.runtimeSessionId || identity.agentId,
            aliases: [...aliases, identity.agentId],
        });
        return {
            ...identity,
            canonicalEntityId: record.canonicalEntityId || undefined,
            operationalHandle: record.operationalHandle,
            runtimeSessionId: record.runtimeSessionId || undefined,
            aliases: record.aliases,
        };
    }
    catch {
        return {
            ...identity,
            aliases: [...new Set([identity.agentId, ...aliases].map((alias) => alias.trim()).filter(Boolean))],
        };
    }
}
function normalizeRecipient(recipient) {
    if ('broadcast' in recipient) {
        return recipient;
    }
    return normalizeAgentIdentity(recipient);
}
function resolveEnvelopeAuditTrace(traceId, from, context, metadata, auditOverrides) {
    const actor = auditOverrides?.actor || from.operationalHandle || from.agentId;
    const source = auditOverrides?.source || from.platform || 'relay-core';
    const existing = (0, audit_js_1.extractAuditTrace)(metadata?.audit);
    return ((0, audit_js_1.mergeAuditTrace)(existing, auditOverrides, {
        traceId,
        source,
        actor,
        workflowId: context?.workflowId,
        channelId: context?.channelId,
        sessionId: context?.sessionId,
        parentId: context?.parentMessageId,
        canonicalEntityId: from.canonicalEntityId,
        operationalHandle: from.operationalHandle || from.agentId,
        runtimeSessionId: from.runtimeSessionId,
    }) ||
        (0, audit_js_1.createAuditTrace)({
            traceId,
            source,
            actor,
            workflowId: context?.workflowId,
            channelId: context?.channelId,
            sessionId: context?.sessionId,
            parentId: context?.parentMessageId,
            canonicalEntityId: from.canonicalEntityId,
            operationalHandle: from.operationalHandle || from.agentId,
            runtimeSessionId: from.runtimeSessionId,
        }));
}
function getTNFEnvelopeAuditTrace(envelope) {
    return resolveEnvelopeAuditTrace(envelope.traceId, normalizeAgentIdentity(envelope.from), envelope.context, envelope.metadata);
}
function normalizeTNFEnvelope(envelope) {
    const from = normalizeAgentIdentity(envelope.from);
    const to = normalizeRecipient(envelope.to);
    const metadata = (0, audit_js_1.attachAuditTrace)(envelope.metadata, getTNFEnvelopeAuditTrace({
        traceId: envelope.traceId,
        from,
        context: envelope.context,
        metadata: envelope.metadata,
    }));
    return exports.TNFEnvelope.parse({
        ...envelope,
        from,
        to,
        metadata,
    });
}
function createTNFEnvelope(type, from, to, payload, context, options) {
    const normalizedFrom = normalizeAgentIdentity(from);
    const normalizedTo = normalizeRecipient(to);
    const traceId = options?.traceId ||
        options?.audit?.traceId ||
        (0, audit_js_1.extractAuditTrace)(options?.metadata?.audit)?.traceId ||
        crypto_1.default.randomUUID();
    return {
        id: crypto_1.default.randomUUID(),
        version: '1.0',
        traceId,
        timestamp: new Date().toISOString(),
        type,
        from: normalizedFrom,
        to: normalizedTo,
        payload,
        context,
        metadata: (0, audit_js_1.attachAuditTrace)(options?.metadata, resolveEnvelopeAuditTrace(traceId, normalizedFrom, context, options?.metadata, options?.audit)),
    };
}
function validateTNFEnvelope(data) {
    return normalizeTNFEnvelope(exports.TNFEnvelope.parse(data));
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
    constructor() {
        this.envelope = {
            version: '1.0',
            id: crypto_1.default.randomUUID(),
            traceId: crypto_1.default.randomUUID(),
            timestamp: new Date().toISOString(),
        };
    }
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
        return validateTNFEnvelope(this.envelope);
    }
}
exports.TNFMessageBuilder = TNFMessageBuilder;
//# sourceMappingURL=tnf-envelope.js.map