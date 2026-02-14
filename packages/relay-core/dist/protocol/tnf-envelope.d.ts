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
/**
 * Message Types
 */
export declare const MessageType: z.ZodEnum<{
    task: "task";
    command: "command";
    event: "event";
    "state-sync": "state-sync";
    query: "query";
    response: "response";
}>;
export type MessageType = z.infer<typeof MessageType>;
/**
 * Agent Identity
 */
export declare const AgentIdentity: z.ZodObject<{
    agentId: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        orchestrator: "orchestrator";
        worker: "worker";
        coordinator: "coordinator";
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
        task: "task";
        command: "command";
        event: "event";
        "state-sync": "state-sync";
        query: "query";
        response: "response";
    }>;
    from: z.ZodObject<{
        agentId: z.ZodString;
        role: z.ZodOptional<z.ZodEnum<{
            orchestrator: "orchestrator";
            worker: "worker";
            coordinator: "coordinator";
            observer: "observer";
        }>>;
        platform: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    to: z.ZodUnion<[z.ZodObject<{
        agentId: z.ZodString;
        role: z.ZodOptional<z.ZodEnum<{
            orchestrator: "orchestrator";
            worker: "worker";
            coordinator: "coordinator";
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
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type TNFEnvelope = z.infer<typeof TNFEnvelope>;
/**
 * Specific Message Payloads
 */
export declare const TaskPayload: z.ZodObject<{
    action: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<{
        critical: "critical";
        high: "high";
        low: "low";
        normal: "normal";
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
        update: "update";
        delete: "delete";
        get: "get";
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
/**
 * Helper Functions
 */
export declare function createTNFEnvelope(type: MessageType, from: AgentIdentity, to: AgentIdentity | {
    broadcast: boolean;
}, payload: Record<string, unknown>, context?: MessageContext): TNFEnvelope;
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