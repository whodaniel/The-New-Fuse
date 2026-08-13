// @ts-nocheck
import { z } from 'zod';
export declare const HandoffPriority: z.ZodEnum<{
    normal: "normal";
    low: "low";
    high: "high";
    critical: "critical";
}>;
export type HandoffPriority = z.infer<typeof HandoffPriority>;
export declare const HandoffStatus: z.ZodEnum<{
    completed: "completed";
    rejected: "rejected";
    pending: "pending";
    received: "received";
    claimed: "claimed";
}>;
export type HandoffStatus = z.infer<typeof HandoffStatus>;
export declare const FederationGateDecision: z.ZodObject<{
    gate: z.ZodString;
    decision: z.ZodEnum<{
        allow: "allow";
        deny: "deny";
        quarantine: "quarantine";
    }>;
    reason: z.ZodOptional<z.ZodString>;
    at: z.ZodString;
}, z.core.$strip>;
export type FederationGateDecision = z.infer<typeof FederationGateDecision>;
export declare const MasterCumulativeId: z.ZodObject<{
    spec: z.ZodLiteral<"tnf/mcid/0.1">;
    id: z.ZodString;
    scope: z.ZodObject<{
        tenant_id: z.ZodString;
        cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    lineage: z.ZodObject<{
        trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
        handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    federation: z.ZodOptional<z.ZodObject<{
        domain: z.ZodString;
        route: z.ZodArray<z.ZodString>;
        hop_count: z.ZodNumber;
        gate_decisions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            gate: z.ZodString;
            decision: z.ZodEnum<{
                allow: "allow";
                deny: "deny";
                quarantine: "quarantine";
            }>;
            reason: z.ZodOptional<z.ZodString>;
            at: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    issued_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type MasterCumulativeId = z.infer<typeof MasterCumulativeId>;
export declare const HandoffPayload: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    prompt: z.ZodString;
    acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
    nextActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
    twipRef: z.ZodOptional<z.ZodObject<{
        twid: z.ZodString;
        correlationId: z.ZodOptional<z.ZodString>;
        integrityHash: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type HandoffPayload = z.infer<typeof HandoffPayload>;
export declare const HandoffScope: z.ZodObject<{
    tenantId: z.ZodString;
    sessionKey: z.ZodOptional<z.ZodString>;
    workflowId: z.ZodOptional<z.ZodString>;
    channelId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type HandoffScope = z.infer<typeof HandoffScope>;
export declare const HandoffTargets: z.ZodObject<{
    agentIds: z.ZodArray<z.ZodString>;
    roles: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type HandoffTargets = z.infer<typeof HandoffTargets>;
export declare const HandoffPacketInput: z.ZodObject<{
    fromAgentId: z.ZodString;
    targets: z.ZodObject<{
        agentIds: z.ZodArray<z.ZodString>;
        roles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    scope: z.ZodObject<{
        tenantId: z.ZodString;
        sessionKey: z.ZodOptional<z.ZodString>;
        workflowId: z.ZodOptional<z.ZodString>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    payload: z.ZodObject<{
        title: z.ZodString;
        summary: z.ZodString;
        prompt: z.ZodString;
        acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        nextActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        twipRef: z.ZodOptional<z.ZodObject<{
            twid: z.ZodString;
            correlationId: z.ZodOptional<z.ZodString>;
            integrityHash: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    cumulativeId: z.ZodObject<{
        spec: z.ZodLiteral<"tnf/mcid/0.1">;
        id: z.ZodString;
        scope: z.ZodObject<{
            tenant_id: z.ZodString;
            cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        federation: z.ZodOptional<z.ZodObject<{
            domain: z.ZodString;
            route: z.ZodArray<z.ZodString>;
            hop_count: z.ZodNumber;
            gate_decisions: z.ZodDefault<z.ZodArray<z.ZodObject<{
                gate: z.ZodString;
                decision: z.ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: z.ZodOptional<z.ZodString>;
                at: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    gateDecisions: z.ZodArray<z.ZodObject<{
        gate: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
            quarantine: "quarantine";
        }>;
        reason: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strip>>;
    priority: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        low: "low";
        high: "high";
        critical: "critical";
    }>>;
    expiresAt: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type HandoffPacketInput = z.infer<typeof HandoffPacketInput>;
export declare const HandoffPacketVersion: z.ZodEnum<{
    "1.0": "1.0";
    1.1: "1.1";
}>;
export type HandoffPacketVersion = z.infer<typeof HandoffPacketVersion>;
export declare const HandoffPacket: z.ZodObject<{
    fromAgentId: z.ZodString;
    targets: z.ZodObject<{
        agentIds: z.ZodArray<z.ZodString>;
        roles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    scope: z.ZodObject<{
        tenantId: z.ZodString;
        sessionKey: z.ZodOptional<z.ZodString>;
        workflowId: z.ZodOptional<z.ZodString>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    payload: z.ZodObject<{
        title: z.ZodString;
        summary: z.ZodString;
        prompt: z.ZodString;
        acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        nextActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        twipRef: z.ZodOptional<z.ZodObject<{
            twid: z.ZodString;
            correlationId: z.ZodOptional<z.ZodString>;
            integrityHash: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    cumulativeId: z.ZodOptional<z.ZodObject<{
        spec: z.ZodLiteral<"tnf/mcid/0.1">;
        id: z.ZodString;
        scope: z.ZodObject<{
            tenant_id: z.ZodString;
            cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        federation: z.ZodOptional<z.ZodObject<{
            domain: z.ZodString;
            route: z.ZodArray<z.ZodString>;
            hop_count: z.ZodNumber;
            gate_decisions: z.ZodDefault<z.ZodArray<z.ZodObject<{
                gate: z.ZodString;
                decision: z.ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: z.ZodOptional<z.ZodString>;
                at: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    gateDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        gate: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
            quarantine: "quarantine";
        }>;
        reason: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strip>>>;
    priority: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        low: "low";
        high: "high";
        critical: "critical";
    }>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    id: z.ZodString;
    version: z.ZodDefault<z.ZodEnum<{
        "1.0": "1.0";
        1.1: "1.1";
    }>>;
    createdAt: z.ZodString;
    expiresAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<{
        completed: "completed";
        rejected: "rejected";
        pending: "pending";
        received: "received";
        claimed: "claimed";
    }>>;
}, z.core.$strip>;
export type HandoffPacket = z.infer<typeof HandoffPacket>;
export declare const HandoffAckInput: z.ZodObject<{
    packetId: z.ZodString;
    agentId: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        rejected: "rejected";
        received: "received";
        claimed: "claimed";
    }>;
    note: z.ZodOptional<z.ZodString>;
    cumulativeId: z.ZodObject<{
        spec: z.ZodLiteral<"tnf/mcid/0.1">;
        id: z.ZodString;
        scope: z.ZodObject<{
            tenant_id: z.ZodString;
            cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        federation: z.ZodOptional<z.ZodObject<{
            domain: z.ZodString;
            route: z.ZodArray<z.ZodString>;
            hop_count: z.ZodNumber;
            gate_decisions: z.ZodDefault<z.ZodArray<z.ZodObject<{
                gate: z.ZodString;
                decision: z.ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: z.ZodOptional<z.ZodString>;
                at: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type HandoffAckInput = z.infer<typeof HandoffAckInput>;
export declare const HandoffAck: z.ZodObject<{
    packetId: z.ZodString;
    agentId: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        rejected: "rejected";
        received: "received";
        claimed: "claimed";
    }>;
    note: z.ZodOptional<z.ZodString>;
    cumulativeId: z.ZodObject<{
        spec: z.ZodLiteral<"tnf/mcid/0.1">;
        id: z.ZodString;
        scope: z.ZodObject<{
            tenant_id: z.ZodString;
            cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        federation: z.ZodOptional<z.ZodObject<{
            domain: z.ZodString;
            route: z.ZodArray<z.ZodString>;
            hop_count: z.ZodNumber;
            gate_decisions: z.ZodDefault<z.ZodArray<z.ZodObject<{
                gate: z.ZodString;
                decision: z.ZodEnum<{
                    allow: "allow";
                    deny: "deny";
                    quarantine: "quarantine";
                }>;
                reason: z.ZodOptional<z.ZodString>;
                at: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    ackedAt: z.ZodString;
}, z.core.$strip>;
export type HandoffAck = z.infer<typeof HandoffAck>;
//# sourceMappingURL=handoff-protocol.d.ts.map