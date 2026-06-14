import { z } from 'zod';
export declare const HandoffPrioritySchema: z.ZodEnum<{
    low: "low";
    normal: "normal";
    high: "high";
    critical: "critical";
}>;
export type HandoffPriority = z.infer<typeof HandoffPrioritySchema>;
export declare const HandoffStatusSchema: z.ZodEnum<{
    pending: "pending";
    received: "received";
    claimed: "claimed";
    completed: "completed";
    rejected: "rejected";
}>;
export type HandoffStatus = z.infer<typeof HandoffStatusSchema>;
export declare const FederationGateDecisionSchema: z.ZodObject<{
    gate: z.ZodString;
    decision: z.ZodEnum<{
        allow: "allow";
        deny: "deny";
        quarantine: "quarantine";
    }>;
    reason: z.ZodOptional<z.ZodString>;
    at: z.ZodString;
}, z.core.$strict>;
export type FederationGateDecision = z.infer<typeof FederationGateDecisionSchema>;
export declare const MasterCumulativeIdSchema: z.ZodObject<{
    spec: z.ZodLiteral<"tnf/mcid/0.1">;
    id: z.ZodString;
    scope: z.ZodObject<{
        tenant_id: z.ZodString;
        cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
    lineage: z.ZodObject<{
        trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        correlation_id: z.ZodString;
        causation_id: z.ZodNullable<z.ZodString>;
        handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strict>;
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
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
    issued_at: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type MasterCumulativeId = z.infer<typeof MasterCumulativeIdSchema>;
export declare const TNFResourcePointerSchema: z.ZodObject<{
    uri: z.ZodUnion<[z.ZodString, z.ZodString]>;
    integrityHash: z.ZodOptional<z.ZodString>;
    mimeType: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type TNFResourcePointer = z.infer<typeof TNFResourcePointerSchema>;
export declare const HandoffPayloadSchema: z.ZodObject<{
    title: z.ZodString;
    summary: z.ZodString;
    prompt: z.ZodString;
    acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
    nextActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
    resourcePointers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        uri: z.ZodUnion<[z.ZodString, z.ZodString]>;
        integrityHash: z.ZodOptional<z.ZodString>;
        mimeType: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>>;
    twipRef: z.ZodOptional<z.ZodObject<{
        twid: z.ZodString;
        correlationId: z.ZodOptional<z.ZodString>;
        integrityHash: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type HandoffPayload = z.infer<typeof HandoffPayloadSchema>;
export declare const HandoffScopeSchema: z.ZodObject<{
    tenantId: z.ZodString;
    sessionKey: z.ZodOptional<z.ZodString>;
    workflowId: z.ZodOptional<z.ZodString>;
    channelId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type HandoffScope = z.infer<typeof HandoffScopeSchema>;
export declare const HandoffTargetsSchema: z.ZodObject<{
    agentIds: z.ZodArray<z.ZodString>;
    roles: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type HandoffTargets = z.infer<typeof HandoffTargetsSchema>;
export declare const HandoffPacketInputSchema: z.ZodObject<{
    fromAgentId: z.ZodString;
    targets: z.ZodObject<{
        agentIds: z.ZodArray<z.ZodString>;
        roles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
    scope: z.ZodObject<{
        tenantId: z.ZodString;
        sessionKey: z.ZodOptional<z.ZodString>;
        workflowId: z.ZodOptional<z.ZodString>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    payload: z.ZodObject<{
        title: z.ZodString;
        summary: z.ZodString;
        prompt: z.ZodString;
        acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        nextActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        resourcePointers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            uri: z.ZodUnion<[z.ZodString, z.ZodString]>;
            integrityHash: z.ZodOptional<z.ZodString>;
            mimeType: z.ZodOptional<z.ZodString>;
            size: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>>;
        twipRef: z.ZodOptional<z.ZodObject<{
            twid: z.ZodString;
            correlationId: z.ZodOptional<z.ZodString>;
            integrityHash: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    cumulativeId: z.ZodObject<{
        spec: z.ZodLiteral<"tnf/mcid/0.1">;
        id: z.ZodString;
        scope: z.ZodObject<{
            tenant_id: z.ZodString;
            cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strict>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strict>;
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
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    gateDecisions: z.ZodArray<z.ZodObject<{
        gate: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
            quarantine: "quarantine";
        }>;
        reason: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strict>>;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        normal: "normal";
        high: "high";
        critical: "critical";
    }>>;
    expiresAt: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type HandoffPacketInput = z.infer<typeof HandoffPacketInputSchema>;
export declare const HandoffPacketVersionSchema: z.ZodEnum<{
    "1.0": "1.0";
    1.1: "1.1";
}>;
export type HandoffPacketVersion = z.infer<typeof HandoffPacketVersionSchema>;
export declare const HandoffPacketSchema: z.ZodObject<{
    fromAgentId: z.ZodString;
    targets: z.ZodObject<{
        agentIds: z.ZodArray<z.ZodString>;
        roles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
    scope: z.ZodObject<{
        tenantId: z.ZodString;
        sessionKey: z.ZodOptional<z.ZodString>;
        workflowId: z.ZodOptional<z.ZodString>;
        channelId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    payload: z.ZodObject<{
        title: z.ZodString;
        summary: z.ZodString;
        prompt: z.ZodString;
        acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString>>;
        nextActions: z.ZodDefault<z.ZodArray<z.ZodString>>;
        artifacts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        resourcePointers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            uri: z.ZodUnion<[z.ZodString, z.ZodString]>;
            integrityHash: z.ZodOptional<z.ZodString>;
            mimeType: z.ZodOptional<z.ZodString>;
            size: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>>;
        twipRef: z.ZodOptional<z.ZodObject<{
            twid: z.ZodString;
            correlationId: z.ZodOptional<z.ZodString>;
            integrityHash: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    cumulativeId: z.ZodOptional<z.ZodObject<{
        spec: z.ZodLiteral<"tnf/mcid/0.1">;
        id: z.ZodString;
        scope: z.ZodObject<{
            tenant_id: z.ZodString;
            cron_namespace: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            session_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            workflow_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            channel_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strict>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strict>;
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
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    gateDecisions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        gate: z.ZodString;
        decision: z.ZodEnum<{
            allow: "allow";
            deny: "deny";
            quarantine: "quarantine";
        }>;
        reason: z.ZodOptional<z.ZodString>;
        at: z.ZodString;
    }, z.core.$strict>>>;
    priority: z.ZodDefault<z.ZodEnum<{
        low: "low";
        normal: "normal";
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
        pending: "pending";
        received: "received";
        claimed: "claimed";
        completed: "completed";
        rejected: "rejected";
    }>>;
}, z.core.$strict>;
export type HandoffPacket = z.infer<typeof HandoffPacketSchema>;
export declare const HandoffAckInputSchema: z.ZodObject<{
    packetId: z.ZodString;
    agentId: z.ZodString;
    status: z.ZodEnum<{
        received: "received";
        claimed: "claimed";
        completed: "completed";
        rejected: "rejected";
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
        }, z.core.$strict>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strict>;
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
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type HandoffAckInput = z.infer<typeof HandoffAckInputSchema>;
export declare const HandoffAckSchema: z.ZodObject<{
    packetId: z.ZodString;
    agentId: z.ZodString;
    status: z.ZodEnum<{
        received: "received";
        claimed: "claimed";
        completed: "completed";
        rejected: "rejected";
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
        }, z.core.$strict>;
        lineage: z.ZodObject<{
            trace_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            correlation_id: z.ZodString;
            causation_id: z.ZodNullable<z.ZodString>;
            handoff_packet_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            twid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            task_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            schedule_run_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strict>;
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
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
        issued_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>;
    ackedAt: z.ZodString;
}, z.core.$strict>;
export type HandoffAck = z.infer<typeof HandoffAckSchema>;
//# sourceMappingURL=handoff.d.ts.map