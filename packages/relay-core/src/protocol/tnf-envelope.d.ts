// @ts-nocheck
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
import { z } from 'zod';
import { type TnfAuditTrace } from '../contracts/audit.js';
/**
 * Message Types
 */
export declare const MessageType: z.ZodEnum<{
    query: "query";
    task: "task";
    "state-sync": "state-sync";
    response: "response";
    command: "command";
    handoff: "handoff";
    event: "event";
    "handoff-ack": "handoff-ack";
    "resource-negotiate": "resource-negotiate";
    auction: "auction";
    bid: "bid";
    award: "award";
}>;
export type MessageType = z.infer<typeof MessageType>;
/**
 * Agent Identity
 */
export declare const AgentIdentity: z.ZodObject<{
    agentId: z.ZodString;
    canonicalEntityId: z.ZodOptional<z.ZodString>;
    operationalHandle: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<{
        coordinator: "coordinator";
        worker: "worker";
        orchestrator: "orchestrator";
        observer: "observer";
    }>>;
    platform: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type AgentIdentity = z.infer<typeof AgentIdentity>;
/**
 * Message Context
 */
export declare const MessageContext: z.ZodObject<{
    workflowId: z.ZodOptional<z.ZodString>;
    stepId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    channelId: z.ZodOptional<z.ZodString>;
    sequenceId: z.ZodOptional<z.ZodNumber>;
    parentMessageId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type MessageContext = z.infer<typeof MessageContext>;
/**
 * TNF Envelope - Unified Message Format
 */
export declare const TNFEnvelope: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    traceId: z.ZodString;
    timestamp: z.ZodString;
    type: z.ZodEnum<{
        query: "query";
        task: "task";
        "state-sync": "state-sync";
        response: "response";
        command: "command";
        handoff: "handoff";
        event: "event";
        "handoff-ack": "handoff-ack";
        "resource-negotiate": "resource-negotiate";
        auction: "auction";
        bid: "bid";
        award: "award";
    }>;
    from: z.ZodObject<{
        agentId: z.ZodString;
        canonicalEntityId: z.ZodOptional<z.ZodString>;
        operationalHandle: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
        aliases: z.ZodOptional<z.ZodArray<z.ZodString>>;
        role: z.ZodOptional<z.ZodEnum<{
            coordinator: "coordinator";
            worker: "worker";
            orchestrator: "orchestrator";
            observer: "observer";
        }>>;
        platform: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    to: z.ZodUnion<[z.ZodObject<{
        agentId: z.ZodString;
        canonicalEntityId: z.ZodOptional<z.ZodString>;
        operationalHandle: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
        aliases: z.ZodOptional<z.ZodArray<z.ZodString>>;
        role: z.ZodOptional<z.ZodEnum<{
            coordinator: "coordinator";
            worker: "worker";
            orchestrator: "orchestrator";
            observer: "observer";
        }>>;
        platform: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        broadcast: z.ZodBoolean;
    }, z.core.$strip>]>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    context: z.ZodOptional<z.ZodObject<{
        workflowId: z.ZodOptional<z.ZodString>;
        stepId: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        channelId: z.ZodOptional<z.ZodString>;
        sequenceId: z.ZodOptional<z.ZodNumber>;
        parentMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    resource: z.ZodOptional<z.ZodObject<{
        tier: z.ZodDefault<z.ZodEnum<{
            shared: "shared";
            free: "free";
            pro: "pro";
            enterprise: "enterprise";
            anonymous: "anonymous";
        }>>;
        poolId: z.ZodOptional<z.ZodString>;
        selection: z.ZodDefault<z.ZodEnum<{
            sequential: "sequential";
            "round-robin": "round-robin";
            "least-used": "least-used";
            random: "random";
            "priority-pro": "priority-pro";
        }>>;
        onQuotaExhausted: z.ZodDefault<z.ZodEnum<{
            wait: "wait";
            "switch-account": "switch-account";
            "switch-tier": "switch-tier";
            fail: "fail";
            negotiate: "negotiate";
        }>>;
        maxRetries: z.ZodDefault<z.ZodNumber>;
        minIntelligence: z.ZodOptional<z.ZodNumber>;
        maxLatency: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type TNFEnvelope = z.infer<typeof TNFEnvelope>;
export interface CreateTNFEnvelopeOptions {
    metadata?: Record<string, unknown>;
    traceId?: string;
    audit?: Partial<TnfAuditTrace>;
}
/**
 * Specific Message Payloads
 */
export declare const TaskPayload: z.ZodObject<{
    action: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        low: "low";
        high: "high";
        critical: "critical";
    }>>;
}, z.core.$strip>;
export type TaskPayload = z.infer<typeof TaskPayload>;
export declare const EventPayload: z.ZodObject<{
    eventType: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    source: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EventPayload = z.infer<typeof EventPayload>;
export declare const StateSyncPayload: z.ZodObject<{
    stateKey: z.ZodString;
    stateValue: z.ZodUnknown;
    version: z.ZodNumber;
    operation: z.ZodEnum<{
        set: "set";
        get: "get";
        update: "update";
        delete: "delete";
    }>;
}, z.core.$strip>;
export type StateSyncPayload = z.infer<typeof StateSyncPayload>;
export declare const ResponsePayload: z.ZodObject<{
    success: z.ZodBoolean;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ResponsePayload = z.infer<typeof ResponsePayload>;
export declare const AuctionPayload: z.ZodObject<{
    taskId: z.ZodString;
    taskType: z.ZodString;
    requirements: z.ZodArray<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        low: "low";
        high: "high";
        critical: "critical";
    }>>;
    expiresAt: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type AuctionPayload = z.infer<typeof AuctionPayload>;
export declare const BidPayload: z.ZodObject<{
    taskId: z.ZodString;
    suitability: z.ZodNumber;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type BidPayload = z.infer<typeof BidPayload>;
export declare function getTNFEnvelopeAuditTrace(envelope: Pick<TNFEnvelope, 'traceId' | 'from' | 'context' | 'metadata'>): TnfAuditTrace;
export declare function normalizeTNFEnvelope(envelope: TNFEnvelope): TNFEnvelope;
export declare function createTNFEnvelope(type: MessageType, from: AgentIdentity, to: AgentIdentity | {
    broadcast: boolean;
}, payload: Record<string, unknown>, context?: MessageContext, options?: CreateTNFEnvelopeOptions): TNFEnvelope;
export declare function validateTNFEnvelope(data: unknown): TNFEnvelope;
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