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
const protocol_contracts_1 = require("@the-new-fuse/protocol-contracts");
const audit_js_1 = require("../contracts/audit.js");
const identity_js_1 = require("../contracts/identity.js");
const native_envelope_validator_js_1 = require("./native-envelope-validator.js");
// Re-export values and types with unified names for back-compat
exports.MessageType = protocol_contracts_1.MessageTypeSchema;
exports.AgentIdentity = protocol_contracts_1.AgentIdentitySchema;
exports.MessageContext = protocol_contracts_1.MessageContextSchema;
exports.TNFEnvelope = protocol_contracts_1.TNFEnvelopeSchema;
exports.TaskPayload = protocol_contracts_1.TaskPayloadSchema;
exports.EventPayload = protocol_contracts_1.EventPayloadSchema;
exports.StateSyncPayload = protocol_contracts_1.StateSyncPayloadSchema;
exports.ResponsePayload = protocol_contracts_1.ResponsePayloadSchema;
exports.AuctionPayload = protocol_contracts_1.AuctionPayloadSchema;
exports.BidPayload = protocol_contracts_1.BidPayloadSchema;
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
            aliases: [
                ...new Set([identity.agentId, ...aliases].map((alias) => alias.trim()).filter(Boolean)),
            ],
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
    return protocol_contracts_1.TNFEnvelopeSchema.parse({
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
function validateTNFEnvelope(data, options = {}) {
    const envelope = normalizeTNFEnvelope(protocol_contracts_1.TNFEnvelopeSchema.parse(data));
    if (options.native !== false) {
        (0, native_envelope_validator_js_1.assertNativeEnvelopeValid)(envelope, { required: options.requireNative });
    }
    return envelope;
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