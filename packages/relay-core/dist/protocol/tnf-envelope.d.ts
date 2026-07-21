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
import { type AgentIdentity as AgentIdentityType, type AuctionPayload as AuctionPayloadType, type BidPayload as BidPayloadType, type EventPayload as EventPayloadType, type MessageContext as MessageContextType, type MessageType as MessageTypeType, type ResponsePayload as ResponsePayloadType, type StateSyncPayload as StateSyncPayloadType, type TaskPayload as TaskPayloadType, type TNFEnvelope as TNFEnvelopeType } from '@the-new-fuse/protocol-contracts';
import { type TnfAuditTrace } from '../contracts/audit.js';
export declare const MessageType: import("zod").ZodEnum<{
    command: "command";
    event: "event";
    task: "task";
    handoff: "handoff";
    "handoff-ack": "handoff-ack";
    "state-sync": "state-sync";
    query: "query";
    response: "response";
    "resource-negotiate": "resource-negotiate";
    auction: "auction";
    bid: "bid";
    award: "award";
}>;
export type MessageType = MessageTypeType;
export declare const AgentIdentity: import("zod").ZodObject<{
    agentId: import("zod").ZodString;
    canonicalEntityId: import("zod").ZodOptional<import("zod").ZodString>;
    operationalHandle: import("zod").ZodOptional<import("zod").ZodString>;
    runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
    aliases: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    role: import("zod").ZodOptional<import("zod").ZodEnum<{
        orchestrator: "orchestrator";
        worker: "worker";
        coordinator: "coordinator";
        observer: "observer";
    }>>;
    platform: import("zod").ZodOptional<import("zod").ZodString>;
    capabilities: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
}, import("zod/v4/core").$strict>;
export type AgentIdentity = AgentIdentityType;
export declare const MessageContext: import("zod").ZodObject<{
    workflowId: import("zod").ZodOptional<import("zod").ZodString>;
    stepId: import("zod").ZodOptional<import("zod").ZodString>;
    sessionId: import("zod").ZodOptional<import("zod").ZodString>;
    channelId: import("zod").ZodOptional<import("zod").ZodString>;
    sequenceId: import("zod").ZodOptional<import("zod").ZodNumber>;
    parentMessageId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strict>;
export type MessageContext = MessageContextType;
export declare const TNFEnvelope: import("zod").ZodObject<{
    id: import("zod").ZodString;
    version: import("zod").ZodDefault<import("zod").ZodString>;
    traceId: import("zod").ZodString;
    timestamp: import("zod").ZodString;
    type: import("zod").ZodEnum<{
        command: "command";
        event: "event";
        task: "task";
        handoff: "handoff";
        "handoff-ack": "handoff-ack";
        "state-sync": "state-sync";
        query: "query";
        response: "response";
        "resource-negotiate": "resource-negotiate";
        auction: "auction";
        bid: "bid";
        award: "award";
    }>;
    from: import("zod").ZodObject<{
        agentId: import("zod").ZodString;
        canonicalEntityId: import("zod").ZodOptional<import("zod").ZodString>;
        operationalHandle: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
        aliases: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
        role: import("zod").ZodOptional<import("zod").ZodEnum<{
            orchestrator: "orchestrator";
            worker: "worker";
            coordinator: "coordinator";
            observer: "observer";
        }>>;
        platform: import("zod").ZodOptional<import("zod").ZodString>;
        capabilities: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strict>;
    to: import("zod").ZodUnion<[import("zod").ZodObject<{
        agentId: import("zod").ZodString;
        canonicalEntityId: import("zod").ZodOptional<import("zod").ZodString>;
        operationalHandle: import("zod").ZodOptional<import("zod").ZodString>;
        runtimeSessionId: import("zod").ZodOptional<import("zod").ZodString>;
        aliases: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
        role: import("zod").ZodOptional<import("zod").ZodEnum<{
            orchestrator: "orchestrator";
            worker: "worker";
            coordinator: "coordinator";
            observer: "observer";
        }>>;
        platform: import("zod").ZodOptional<import("zod").ZodString>;
        capabilities: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strict>, import("zod").ZodObject<{
        broadcast: import("zod").ZodBoolean;
    }, import("zod/v4/core").$strict>]>;
    payload: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>;
    context: import("zod").ZodOptional<import("zod").ZodObject<{
        workflowId: import("zod").ZodOptional<import("zod").ZodString>;
        stepId: import("zod").ZodOptional<import("zod").ZodString>;
        sessionId: import("zod").ZodOptional<import("zod").ZodString>;
        channelId: import("zod").ZodOptional<import("zod").ZodString>;
        sequenceId: import("zod").ZodOptional<import("zod").ZodNumber>;
        parentMessageId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>>;
    resource: import("zod").ZodOptional<import("zod").ZodObject<{
        tier: import("zod").ZodDefault<import("zod").ZodEnum<{
            free: "free";
            pro: "pro";
            enterprise: "enterprise";
            shared: "shared";
            anonymous: "anonymous";
        }>>;
        poolId: import("zod").ZodOptional<import("zod").ZodString>;
        selection: import("zod").ZodDefault<import("zod").ZodEnum<{
            "round-robin": "round-robin";
            "least-used": "least-used";
            sequential: "sequential";
            random: "random";
            "priority-pro": "priority-pro";
        }>>;
        onQuotaExhausted: import("zod").ZodDefault<import("zod").ZodEnum<{
            "switch-account": "switch-account";
            "switch-tier": "switch-tier";
            wait: "wait";
            fail: "fail";
            negotiate: "negotiate";
        }>>;
        maxRetries: import("zod").ZodDefault<import("zod").ZodNumber>;
        minIntelligence: import("zod").ZodOptional<import("zod").ZodNumber>;
        maxLatency: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strict>>;
    metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
}, import("zod/v4/core").$strict>;
export type TNFEnvelope = TNFEnvelopeType;
export declare const TaskPayload: import("zod").ZodObject<{
    action: import("zod").ZodString;
    parameters: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
    timeout: import("zod").ZodOptional<import("zod").ZodNumber>;
    priority: import("zod").ZodDefault<import("zod").ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
    }>>;
}, import("zod/v4/core").$strict>;
export type TaskPayload = TaskPayloadType;
export declare const EventPayload: import("zod").ZodObject<{
    eventType: import("zod").ZodString;
    data: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
    source: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strict>;
export type EventPayload = EventPayloadType;
export declare const StateSyncPayload: import("zod").ZodObject<{
    stateKey: import("zod").ZodString;
    stateValue: import("zod").ZodUnknown;
    version: import("zod").ZodNumber;
    operation: import("zod").ZodEnum<{
        set: "set";
        update: "update";
        delete: "delete";
        get: "get";
    }>;
}, import("zod/v4/core").$strict>;
export type StateSyncPayload = StateSyncPayloadType;
export declare const ResponsePayload: import("zod").ZodObject<{
    success: import("zod").ZodBoolean;
    result: import("zod").ZodOptional<import("zod").ZodUnknown>;
    error: import("zod").ZodOptional<import("zod").ZodObject<{
        code: import("zod").ZodString;
        message: import("zod").ZodString;
        details: import("zod").ZodOptional<import("zod").ZodUnknown>;
    }, import("zod/v4/core").$strict>>;
}, import("zod/v4/core").$strict>;
export type ResponsePayload = ResponsePayloadType;
export declare const AuctionPayload: import("zod").ZodObject<{
    taskId: import("zod").ZodString;
    taskType: import("zod").ZodString;
    requirements: import("zod").ZodArray<import("zod").ZodString>;
    priority: import("zod").ZodDefault<import("zod").ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
    }>>;
    expiresAt: import("zod").ZodNumber;
    metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
}, import("zod/v4/core").$strict>;
export type AuctionPayload = AuctionPayloadType;
export declare const BidPayload: import("zod").ZodObject<{
    taskId: import("zod").ZodString;
    suitability: import("zod").ZodNumber;
    estimatedDuration: import("zod").ZodOptional<import("zod").ZodNumber>;
    status: import("zod").ZodOptional<import("zod").ZodString>;
    metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
}, import("zod/v4/core").$strict>;
export type BidPayload = BidPayloadType;
export interface CreateTNFEnvelopeOptions {
    metadata?: Record<string, unknown>;
    traceId?: string;
    audit?: Partial<TnfAuditTrace>;
}
export interface ValidateTNFEnvelopeOptions {
    native?: boolean;
    requireNative?: boolean;
}
export declare function getTNFEnvelopeAuditTrace(envelope: Pick<TNFEnvelope, 'traceId' | 'from' | 'context' | 'metadata'>): TnfAuditTrace;
export declare function normalizeTNFEnvelope(envelope: TNFEnvelope): TNFEnvelope;
export declare function createTNFEnvelope(type: MessageType, from: AgentIdentity, to: AgentIdentity | {
    broadcast: boolean;
}, payload: Record<string, unknown>, context?: MessageContext, options?: CreateTNFEnvelopeOptions): TNFEnvelope;
export declare function validateTNFEnvelope(data: unknown, options?: ValidateTNFEnvelopeOptions): TNFEnvelope;
export declare function isTaskMessage(envelope: TNFEnvelope): boolean;
export declare function isEventMessage(envelope: TNFEnvelope): boolean;
export declare function requiresResponse(envelope: TNFEnvelope): boolean;
/**
 * Message Builder
 */
export declare class TNFMessageBuilder {
    private envelope;
    type(type: MessageType): this;
    from(from: AgentIdentity): this;
    to(to: AgentIdentity | {
        broadcast: boolean;
    }): this;
    payload(payload: Record<string, unknown>): this;
    context(context: MessageContext): this;
    metadata(metadata: Record<string, unknown>): this;
    traceId(traceId: string): this;
    build(): TNFEnvelope;
}
//# sourceMappingURL=tnf-envelope.d.ts.map