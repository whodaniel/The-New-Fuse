"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffAck = exports.HandoffAckInput = exports.HandoffPacket = exports.HandoffPacketInput = exports.HandoffTargets = exports.HandoffScope = exports.HandoffPayload = exports.MasterCumulativeId = exports.FederationGateDecision = exports.HandoffStatus = exports.HandoffPriority = void 0;
const zod_1 = require("zod");
const isoDateTime = zod_1.z.string().datetime();
exports.HandoffPriority = zod_1.z.enum(['low', 'normal', 'high', 'critical']);
exports.HandoffStatus = zod_1.z.enum(['pending', 'received', 'claimed', 'completed', 'rejected']);
exports.FederationGateDecision = zod_1.z.object({
    gate: zod_1.z.string().min(1),
    decision: zod_1.z.enum(['allow', 'deny', 'quarantine']),
    reason: zod_1.z.string().optional(),
    at: isoDateTime,
});
exports.MasterCumulativeId = zod_1.z.object({
    spec: zod_1.z.literal('tnf/mcid/0.1'),
    id: zod_1.z.string().uuid(),
    scope: zod_1.z.object({
        tenant_id: zod_1.z.string().min(1),
        session_key: zod_1.z.string().nullable().optional(),
        workflow_id: zod_1.z.string().nullable().optional(),
        channel_id: zod_1.z.string().nullable().optional(),
    }),
    lineage: zod_1.z.object({
        trace_id: zod_1.z.string().uuid().nullable().optional(),
        correlation_id: zod_1.z.string().uuid(),
        causation_id: zod_1.z.string().uuid().nullable(),
        handoff_packet_id: zod_1.z.string().uuid().nullable().optional(),
        twid: zod_1.z.string().uuid().nullable().optional(),
        task_id: zod_1.z.string().nullable().optional(),
    }),
    federation: zod_1.z
        .object({
        domain: zod_1.z.string().min(1),
        route: zod_1.z.array(zod_1.z.string().min(1)).min(1),
        hop_count: zod_1.z.number().int().nonnegative(),
        gate_decisions: zod_1.z.array(exports.FederationGateDecision).default([]),
    })
        .optional(),
    issued_at: isoDateTime.optional(),
});
exports.HandoffPayload = zod_1.z.object({
    title: zod_1.z.string().min(3),
    summary: zod_1.z.string().min(10),
    prompt: zod_1.z.string().min(10),
    acceptanceCriteria: zod_1.z.array(zod_1.z.string()).default([]),
    nextActions: zod_1.z.array(zod_1.z.string()).default([]),
    artifacts: zod_1.z.array(zod_1.z.string()).default([]),
    twipRef: zod_1.z
        .object({
        twid: zod_1.z.string().uuid(),
        correlationId: zod_1.z.string().uuid().optional(),
        integrityHash: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.HandoffScope = zod_1.z.object({
    tenantId: zod_1.z.string().min(1),
    sessionKey: zod_1.z.string().optional(),
    workflowId: zod_1.z.string().optional(),
    channelId: zod_1.z.string().optional(),
});
exports.HandoffTargets = zod_1.z
    .object({
    agentIds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    roles: zod_1.z.array(zod_1.z.string().min(1)).default([]),
})
    .superRefine((value, ctx) => {
    const uniq = new Set(value.agentIds);
    if (uniq.size !== value.agentIds.length) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['agentIds'],
            message: 'agentIds must be unique',
        });
    }
});
exports.HandoffPacketInput = zod_1.z.object({
    fromAgentId: zod_1.z.string().min(1),
    targets: exports.HandoffTargets,
    scope: exports.HandoffScope,
    payload: exports.HandoffPayload,
    cumulativeId: exports.MasterCumulativeId,
    gateDecisions: zod_1.z.array(exports.FederationGateDecision).min(1),
    priority: exports.HandoffPriority.default('normal'),
    expiresAt: isoDateTime.optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.HandoffPacket = exports.HandoffPacketInput.extend({
    id: zod_1.z.string().uuid(),
    version: zod_1.z.literal('1.0'),
    createdAt: isoDateTime,
    expiresAt: isoDateTime,
    status: exports.HandoffStatus.default('pending'),
});
exports.HandoffAckInput = zod_1.z.object({
    packetId: zod_1.z.string().uuid(),
    agentId: zod_1.z.string().min(1),
    status: zod_1.z.enum(['received', 'claimed', 'completed', 'rejected']),
    note: zod_1.z.string().optional(),
    cumulativeId: exports.MasterCumulativeId,
});
exports.HandoffAck = exports.HandoffAckInput.extend({
    ackedAt: isoDateTime,
});
//# sourceMappingURL=handoff-protocol.js.map