import { type FederationGateDecision as FederationGateDecisionType, type HandoffAckInput as HandoffAckInputT, type HandoffAck as HandoffAckT, type HandoffPacketInput as HandoffPacketInputT, type HandoffPacket as HandoffPacketT, type HandoffPacketVersion as HandoffPacketVersionT, type HandoffPayload as HandoffPayloadT, type HandoffPriority as HandoffPriorityT, type HandoffScope as HandoffScopeT, type HandoffStatus as HandoffStatusT, type HandoffTargets as HandoffTargetsT, type MasterCumulativeId as MasterCumulativeIdT, type TNFResourcePointer as TNFResourcePointerT } from '@the-new-fuse/protocol-contracts';
export declare const HandoffPriority: import("zod").ZodEnum<{
    low: "low";
    high: "high";
    critical: "critical";
    normal: "normal";
}>;
export type HandoffPriority = HandoffPriorityT;
export declare const HandoffStatus: import("zod").ZodEnum<{
    pending: "pending";
    completed: "completed";
    received: "received";
    claimed: "claimed";
    rejected: "rejected";
}>;
export type HandoffStatus = HandoffStatusT;
export declare const FederationGateDecision: import("zod").ZodObject<{
    gate: import("zod").ZodString;
    decision: import("zod").ZodEnum<{
        allow: "allow";
        deny: "deny";
        quarantine: "quarantine";
    }>;
    reason: import("zod").ZodOptional<import("zod").ZodString>;
    at: import("zod").ZodString;
}, import("zod/v4/core").$strict>;
export type FederationGateDecision = FederationGateDecisionType;
export declare const MasterCumulativeId: import("zod").ZodObject<{
    spec: import("zod").ZodLiteral<"tnf/mcid/0.1">;
    id: import("zod").ZodString;
    scope: import("zod").ZodObject<{
        tenant_id: import("zod").ZodString;
        cron_namespace: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        session_key: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        workflow_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        channel_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
    }, import("zod/v4/core").$strict>;
    lineage: import("zod").ZodObject<{
        trace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        correlation_id: import("zod").ZodString;
        causation_id: import("zod").ZodNullable<import("zod").ZodString>;
        handoff_packet_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        twid: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        task_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        schedule_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        schedule_run_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
    }, import("zod/v4/core").$strict>;
    federation: import("zod").ZodOptional<import("zod").ZodObject<{
        domain: import("zod").ZodString;
        route: import("zod").ZodArray<import("zod").ZodString>;
        hop_count: import("zod").ZodNumber;
        gate_decisions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
            gate: import("zod").ZodString;
            decision: import("zod").ZodEnum<{
                allow: "allow";
                deny: "deny";
                quarantine: "quarantine";
            }>;
            reason: import("zod").ZodOptional<import("zod").ZodString>;
            at: import("zod").ZodString;
        }, import("zod/v4/core").$strict>>>;
    }, import("zod/v4/core").$strict>>;
    issued_at: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strict>;
export type MasterCumulativeId = MasterCumulativeIdT;
export declare const TNFResourcePointer: import("zod").ZodObject<{
    uri: import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodString]>;
    integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
    mimeType: import("zod").ZodOptional<import("zod").ZodString>;
    size: import("zod").ZodOptional<import("zod").ZodNumber>;
}, import("zod/v4/core").$strict>;
export type TNFResourcePointer = TNFResourcePointerT;
export declare const HandoffPayload: import("zod").ZodObject<{
    title: import("zod").ZodString;
    summary: import("zod").ZodString;
    prompt: import("zod").ZodString;
    acceptanceCriteria: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
    nextActions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
    artifacts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
    resourcePointers: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
        uri: import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodString]>;
        integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
        mimeType: import("zod").ZodOptional<import("zod").ZodString>;
        size: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strict>>>;
    twipRef: import("zod").ZodOptional<import("zod").ZodObject<{
        twid: import("zod").ZodString;
        correlationId: import("zod").ZodOptional<import("zod").ZodString>;
        integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>>;
}, import("zod/v4/core").$strict>;
export type HandoffPayload = HandoffPayloadT;
export declare const HandoffScope: import("zod").ZodObject<{
    tenantId: import("zod").ZodString;
    sessionKey: import("zod").ZodOptional<import("zod").ZodString>;
    workflowId: import("zod").ZodOptional<import("zod").ZodString>;
    channelId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strict>;
export type HandoffScope = HandoffScopeT;
export declare const HandoffTargets: import("zod").ZodObject<{
    agentIds: import("zod").ZodArray<import("zod").ZodString>;
    roles: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
}, import("zod/v4/core").$strict>;
export type HandoffTargets = HandoffTargetsT;
export declare const HandoffPacketInput: import("zod").ZodObject<{
    fromAgentId: import("zod").ZodString;
    targets: import("zod").ZodObject<{
        agentIds: import("zod").ZodArray<import("zod").ZodString>;
        roles: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strict>;
    scope: import("zod").ZodObject<{
        tenantId: import("zod").ZodString;
        sessionKey: import("zod").ZodOptional<import("zod").ZodString>;
        workflowId: import("zod").ZodOptional<import("zod").ZodString>;
        channelId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>;
    payload: import("zod").ZodObject<{
        title: import("zod").ZodString;
        summary: import("zod").ZodString;
        prompt: import("zod").ZodString;
        acceptanceCriteria: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        nextActions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        artifacts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        resourcePointers: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
            uri: import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodString]>;
            integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
            mimeType: import("zod").ZodOptional<import("zod").ZodString>;
            size: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strict>>>;
        twipRef: import("zod").ZodOptional<import("zod").ZodObject<{
            twid: import("zod").ZodString;
            correlationId: import("zod").ZodOptional<import("zod").ZodString>;
            integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>>;
    }, import("zod/v4/core").$strict>;
    cumulativeId: import("zod").ZodObject<{
        spec: import("zod").ZodLiteral<"tnf/mcid/0.1">;
        id: import("zod").ZodString;
        scope: import("zod").ZodObject<{
            tenant_id: import("zod").ZodString;
            cron_namespace: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            session_key: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            workflow_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            channel_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        lineage: import("zod").ZodObject<{
            trace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            correlation_id: import("zod").ZodString;
            causation_id: import("zod").ZodNullable<import("zod").ZodString>;
            handoff_packet_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            twid: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            task_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_run_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        federation: import("zod").ZodOptional<import("zod").ZodObject<{
            domain: import("zod").ZodString;
            route: import("zod").ZodArray<import("zod").ZodString>;
            hop_count: import("zod").ZodNumber;
            gate_decisions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
                gate: import("zod").ZodString;
                decision: import("zod").ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                at: import("zod").ZodString;
            }, import("zod/v4/core").$strict>>>;
        }, import("zod/v4/core").$strict>>;
        issued_at: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>;
    gateDecisions: import("zod").ZodArray<import("zod").ZodObject<{
        gate: import("zod").ZodString;
        decision: import("zod").ZodEnum<{
            allow: "allow";
            deny: "deny";
            quarantine: "quarantine";
        }>;
        reason: import("zod").ZodOptional<import("zod").ZodString>;
        at: import("zod").ZodString;
    }, import("zod/v4/core").$strict>>;
    priority: import("zod").ZodDefault<import("zod").ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
    }>>;
    expiresAt: import("zod").ZodOptional<import("zod").ZodString>;
    tags: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
}, import("zod/v4/core").$strict>;
export type HandoffPacketInput = HandoffPacketInputT;
export declare const HandoffPacketVersion: import("zod").ZodEnum<{
    "1.0": "1.0";
    1.1: "1.1";
}>;
export type HandoffPacketVersion = HandoffPacketVersionT;
export declare const HandoffPacket: import("zod").ZodObject<{
    fromAgentId: import("zod").ZodString;
    targets: import("zod").ZodObject<{
        agentIds: import("zod").ZodArray<import("zod").ZodString>;
        roles: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strict>;
    scope: import("zod").ZodObject<{
        tenantId: import("zod").ZodString;
        sessionKey: import("zod").ZodOptional<import("zod").ZodString>;
        workflowId: import("zod").ZodOptional<import("zod").ZodString>;
        channelId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>;
    payload: import("zod").ZodObject<{
        title: import("zod").ZodString;
        summary: import("zod").ZodString;
        prompt: import("zod").ZodString;
        acceptanceCriteria: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        nextActions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        artifacts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
        resourcePointers: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodObject<{
            uri: import("zod").ZodUnion<[import("zod").ZodString, import("zod").ZodString]>;
            integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
            mimeType: import("zod").ZodOptional<import("zod").ZodString>;
            size: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strict>>>;
        twipRef: import("zod").ZodOptional<import("zod").ZodObject<{
            twid: import("zod").ZodString;
            correlationId: import("zod").ZodOptional<import("zod").ZodString>;
            integrityHash: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strict>>;
    }, import("zod/v4/core").$strict>;
    cumulativeId: import("zod").ZodOptional<import("zod").ZodObject<{
        spec: import("zod").ZodLiteral<"tnf/mcid/0.1">;
        id: import("zod").ZodString;
        scope: import("zod").ZodObject<{
            tenant_id: import("zod").ZodString;
            cron_namespace: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            session_key: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            workflow_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            channel_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        lineage: import("zod").ZodObject<{
            trace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            correlation_id: import("zod").ZodString;
            causation_id: import("zod").ZodNullable<import("zod").ZodString>;
            handoff_packet_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            twid: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            task_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_run_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        federation: import("zod").ZodOptional<import("zod").ZodObject<{
            domain: import("zod").ZodString;
            route: import("zod").ZodArray<import("zod").ZodString>;
            hop_count: import("zod").ZodNumber;
            gate_decisions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
                gate: import("zod").ZodString;
                decision: import("zod").ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                at: import("zod").ZodString;
            }, import("zod/v4/core").$strict>>>;
        }, import("zod/v4/core").$strict>>;
        issued_at: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>>;
    gateDecisions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        gate: import("zod").ZodString;
        decision: import("zod").ZodEnum<{
            allow: "allow";
            deny: "deny";
            quarantine: "quarantine";
        }>;
        reason: import("zod").ZodOptional<import("zod").ZodString>;
        at: import("zod").ZodString;
    }, import("zod/v4/core").$strict>>>;
    priority: import("zod").ZodDefault<import("zod").ZodEnum<{
        low: "low";
        high: "high";
        critical: "critical";
        normal: "normal";
    }>>;
    tags: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodString>>;
    id: import("zod").ZodString;
    version: import("zod").ZodDefault<import("zod").ZodEnum<{
        "1.0": "1.0";
        1.1: "1.1";
    }>>;
    createdAt: import("zod").ZodString;
    expiresAt: import("zod").ZodString;
    status: import("zod").ZodDefault<import("zod").ZodEnum<{
        pending: "pending";
        completed: "completed";
        received: "received";
        claimed: "claimed";
        rejected: "rejected";
    }>>;
}, import("zod/v4/core").$strict>;
export type HandoffPacket = HandoffPacketT;
export declare const HandoffAck: import("zod").ZodObject<{
    packetId: import("zod").ZodString;
    agentId: import("zod").ZodString;
    status: import("zod").ZodEnum<{
        completed: "completed";
        received: "received";
        claimed: "claimed";
        rejected: "rejected";
    }>;
    note: import("zod").ZodOptional<import("zod").ZodString>;
    cumulativeId: import("zod").ZodObject<{
        spec: import("zod").ZodLiteral<"tnf/mcid/0.1">;
        id: import("zod").ZodString;
        scope: import("zod").ZodObject<{
            tenant_id: import("zod").ZodString;
            cron_namespace: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            session_key: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            workflow_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            channel_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        lineage: import("zod").ZodObject<{
            trace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            correlation_id: import("zod").ZodString;
            causation_id: import("zod").ZodNullable<import("zod").ZodString>;
            handoff_packet_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            twid: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            task_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_run_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        federation: import("zod").ZodOptional<import("zod").ZodObject<{
            domain: import("zod").ZodString;
            route: import("zod").ZodArray<import("zod").ZodString>;
            hop_count: import("zod").ZodNumber;
            gate_decisions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
                gate: import("zod").ZodString;
                decision: import("zod").ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                at: import("zod").ZodString;
            }, import("zod/v4/core").$strict>>>;
        }, import("zod/v4/core").$strict>>;
        issued_at: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>;
    ackedAt: import("zod").ZodString;
}, import("zod/v4/core").$strict>;
export type HandoffAck = HandoffAckT;
export declare const HandoffAckInput: import("zod").ZodObject<{
    packetId: import("zod").ZodString;
    agentId: import("zod").ZodString;
    status: import("zod").ZodEnum<{
        completed: "completed";
        received: "received";
        claimed: "claimed";
        rejected: "rejected";
    }>;
    note: import("zod").ZodOptional<import("zod").ZodString>;
    cumulativeId: import("zod").ZodObject<{
        spec: import("zod").ZodLiteral<"tnf/mcid/0.1">;
        id: import("zod").ZodString;
        scope: import("zod").ZodObject<{
            tenant_id: import("zod").ZodString;
            cron_namespace: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            session_key: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            workflow_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            channel_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        lineage: import("zod").ZodObject<{
            trace_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            correlation_id: import("zod").ZodString;
            causation_id: import("zod").ZodNullable<import("zod").ZodString>;
            handoff_packet_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            twid: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            task_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            schedule_run_id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        }, import("zod/v4/core").$strict>;
        federation: import("zod").ZodOptional<import("zod").ZodObject<{
            domain: import("zod").ZodString;
            route: import("zod").ZodArray<import("zod").ZodString>;
            hop_count: import("zod").ZodNumber;
            gate_decisions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
                gate: import("zod").ZodString;
                decision: import("zod").ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: import("zod").ZodOptional<import("zod").ZodString>;
                at: import("zod").ZodString;
            }, import("zod/v4/core").$strict>>>;
        }, import("zod/v4/core").$strict>>;
        issued_at: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strict>;
}, import("zod/v4/core").$strict>;
export type HandoffAckInput = HandoffAckInputT;
export type HandoffPacketType = HandoffPacket;
export type HandoffAckType = HandoffAck;
//# sourceMappingURL=handoff-protocol.d.ts.map