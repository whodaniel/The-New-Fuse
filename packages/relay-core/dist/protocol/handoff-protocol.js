"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffAck = exports.HandoffAckInput = exports.HandoffPacket = exports.HandoffPacketInput = exports.HandoffTargets = exports.HandoffScope = exports.HandoffPayload = exports.HandoffStatus = exports.HandoffPriority = void 0;
const zod_1 = require("zod");
const isoDateTime = zod_1.z.string().datetime();
exports.HandoffPriority = zod_1.z.enum(['low', 'normal', 'high', 'critical']);
exports.HandoffStatus = zod_1.z.enum(['pending', 'received', 'claimed', 'completed', 'rejected']);
exports.HandoffPayload = zod_1.z.object({
    title: zod_1.z.string().min(3),
    summary: zod_1.z.string().min(10),
    prompt: zod_1.z.string().min(10),
    acceptanceCriteria: zod_1.z.array(zod_1.z.string()).default([]),
    nextActions: zod_1.z.array(zod_1.z.string()).default([]),
    artifacts: zod_1.z.array(zod_1.z.string()).default([]),
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
});
exports.HandoffAck = exports.HandoffAckInput.extend({
    ackedAt: isoDateTime,
});
//# sourceMappingURL=handoff-protocol.js.map