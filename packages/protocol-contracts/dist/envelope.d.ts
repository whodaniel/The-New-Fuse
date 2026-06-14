import { z } from 'zod';
/**
 * Message Types
 */
export declare const MessageTypeSchema: z.ZodEnum<{
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
export type MessageType = z.infer<typeof MessageTypeSchema>;
/**
 * Agent Identity
 */
export declare const AgentIdentitySchema: z.ZodObject<{
    agentId: z.ZodString;
    canonicalEntityId: z.ZodOptional<z.ZodString>;
    operationalHandle: z.ZodOptional<z.ZodString>;
    runtimeSessionId: z.ZodOptional<z.ZodString>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<{
        orchestrator: "orchestrator";
        worker: "worker";
        coordinator: "coordinator";
        observer: "observer";
    }>>;
    platform: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;
/**
 * Message Context
 */
export declare const MessageContextSchema: z.ZodObject<{
    workflowId: z.ZodOptional<z.ZodString>;
    stepId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    channelId: z.ZodOptional<z.ZodString>;
    sequenceId: z.ZodOptional<z.ZodNumber>;
    parentMessageId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type MessageContext = z.infer<typeof MessageContextSchema>;
/**
 * TNF Envelope - Unified Message Format
 */
export declare const TNFEnvelopeSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    traceId: z.ZodString;
    timestamp: z.ZodString;
    type: z.ZodEnum<{
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
    from: z.ZodObject<{
        agentId: z.ZodString;
        canonicalEntityId: z.ZodOptional<z.ZodString>;
        operationalHandle: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
        aliases: z.ZodOptional<z.ZodArray<z.ZodString>>;
        role: z.ZodOptional<z.ZodEnum<{
            orchestrator: "orchestrator";
            worker: "worker";
            coordinator: "coordinator";
            observer: "observer";
        }>>;
        platform: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
    to: z.ZodUnion<[z.ZodObject<{
        agentId: z.ZodString;
        canonicalEntityId: z.ZodOptional<z.ZodString>;
        operationalHandle: z.ZodOptional<z.ZodString>;
        runtimeSessionId: z.ZodOptional<z.ZodString>;
        aliases: z.ZodOptional<z.ZodArray<z.ZodString>>;
        role: z.ZodOptional<z.ZodEnum<{
            orchestrator: "orchestrator";
            worker: "worker";
            coordinator: "coordinator";
            observer: "observer";
        }>>;
        platform: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>, z.ZodObject<{
        broadcast: z.ZodBoolean;
    }, z.core.$strict>]>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    context: z.ZodOptional<z.ZodObject<{
        workflowId: z.ZodOptional<z.ZodString>;
        stepId: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        channelId: z.ZodOptional<z.ZodString>;
        sequenceId: z.ZodOptional<z.ZodNumber>;
        parentMessageId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    resource: z.ZodOptional<z.ZodObject<{
        tier: z.ZodDefault<z.ZodEnum<{
            free: "free";
            pro: "pro";
            enterprise: "enterprise";
            shared: "shared";
            anonymous: "anonymous";
        }>>;
        poolId: z.ZodOptional<z.ZodString>;
        selection: z.ZodDefault<z.ZodEnum<{
            "round-robin": "round-robin";
            "least-used": "least-used";
            sequential: "sequential";
            random: "random";
            "priority-pro": "priority-pro";
        }>>;
        onQuotaExhausted: z.ZodDefault<z.ZodEnum<{
            "switch-account": "switch-account";
            "switch-tier": "switch-tier";
            wait: "wait";
            fail: "fail";
            negotiate: "negotiate";
        }>>;
        maxRetries: z.ZodDefault<z.ZodNumber>;
        minIntelligence: z.ZodOptional<z.ZodNumber>;
        maxLatency: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type TNFEnvelope = z.infer<typeof TNFEnvelopeSchema>;
/**
 * Specific Message Payloads
 */
export declare const TaskPayloadSchema: z.ZodObject<{
    action: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
    }>>;
}, z.core.$strict>;
export type TaskPayload = z.infer<typeof TaskPayloadSchema>;
export declare const EventPayloadSchema: z.ZodObject<{
    eventType: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    source: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type EventPayload = z.infer<typeof EventPayloadSchema>;
export declare const StateSyncPayloadSchema: z.ZodObject<{
    stateKey: z.ZodString;
    stateValue: z.ZodUnknown;
    version: z.ZodNumber;
    operation: z.ZodEnum<{
        set: "set";
        update: "update";
        delete: "delete";
        get: "get";
    }>;
}, z.core.$strict>;
export type StateSyncPayload = z.infer<typeof StateSyncPayloadSchema>;
export declare const ResponsePayloadSchema: z.ZodObject<{
    success: z.ZodBoolean;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type ResponsePayload = z.infer<typeof ResponsePayloadSchema>;
export declare const AuctionPayloadSchema: z.ZodObject<{
    taskId: z.ZodString;
    taskType: z.ZodString;
    requirements: z.ZodArray<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
    }>>;
    expiresAt: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type AuctionPayload = z.infer<typeof AuctionPayloadSchema>;
export declare const BidPayloadSchema: z.ZodObject<{
    taskId: z.ZodString;
    suitability: z.ZodNumber;
    estimatedDuration: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
export type BidPayload = z.infer<typeof BidPayloadSchema>;
//# sourceMappingURL=envelope.d.ts.map