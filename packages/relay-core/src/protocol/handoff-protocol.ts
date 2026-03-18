import { z } from 'zod';

const isoDateTime = z.string().datetime();

export const HandoffPriority = z.enum(['low', 'normal', 'high', 'critical']);
export type HandoffPriority = z.infer<typeof HandoffPriority>;

export const HandoffStatus = z.enum(['pending', 'received', 'claimed', 'completed', 'rejected']);
export type HandoffStatus = z.infer<typeof HandoffStatus>;

export const FederationGateDecision = z.object({
  gate: z.string().min(1),
  decision: z.enum(['allow', 'deny', 'quarantine']),
  reason: z.string().optional(),
  at: isoDateTime,
});
export type FederationGateDecision = z.infer<typeof FederationGateDecision>;

export const MasterCumulativeId = z.object({
  spec: z.literal('tnf/mcid/0.1'),
  id: z.string().uuid(),
  scope: z.object({
    tenant_id: z.string().min(1),
    session_key: z.string().nullable().optional(),
    workflow_id: z.string().nullable().optional(),
    channel_id: z.string().nullable().optional(),
  }),
  lineage: z.object({
    trace_id: z.string().uuid().nullable().optional(),
    correlation_id: z.string().uuid(),
    causation_id: z.string().uuid().nullable(),
    handoff_packet_id: z.string().uuid().nullable().optional(),
    twid: z.string().uuid().nullable().optional(),
    task_id: z.string().nullable().optional(),
  }),
  federation: z
    .object({
      domain: z.string().min(1),
      route: z.array(z.string().min(1)).min(1),
      hop_count: z.number().int().nonnegative(),
      gate_decisions: z.array(FederationGateDecision).default([]),
    })
    .optional(),
  issued_at: isoDateTime.optional(),
});
export type MasterCumulativeId = z.infer<typeof MasterCumulativeId>;

export const HandoffPayload = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  prompt: z.string().min(10),
  acceptanceCriteria: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
  artifacts: z.array(z.string()).default([]),
  twipRef: z
    .object({
      twid: z.string().uuid(),
      correlationId: z.string().uuid().optional(),
      integrityHash: z.string().optional(),
    })
    .optional(),
});
export type HandoffPayload = z.infer<typeof HandoffPayload>;

export const HandoffScope = z.object({
  tenantId: z.string().min(1),
  sessionKey: z.string().optional(),
  workflowId: z.string().optional(),
  channelId: z.string().optional(),
});
export type HandoffScope = z.infer<typeof HandoffScope>;

export const HandoffTargets = z
  .object({
    agentIds: z.array(z.string().min(1)).min(1),
    roles: z.array(z.string().min(1)).default([]),
  })
  .superRefine((value, ctx) => {
    const uniq = new Set(value.agentIds);
    if (uniq.size !== value.agentIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['agentIds'],
        message: 'agentIds must be unique',
      });
    }
  });
export type HandoffTargets = z.infer<typeof HandoffTargets>;

export const HandoffPacketInput = z.object({
  fromAgentId: z.string().min(1),
  targets: HandoffTargets,
  scope: HandoffScope,
  payload: HandoffPayload,
  cumulativeId: MasterCumulativeId,
  gateDecisions: z.array(FederationGateDecision).min(1),
  priority: HandoffPriority.default('normal'),
  expiresAt: isoDateTime.optional(),
  tags: z.array(z.string()).default([]),
});
export type HandoffPacketInput = z.infer<typeof HandoffPacketInput>;

export const HandoffPacket = HandoffPacketInput.extend({
  id: z.string().uuid(),
  version: z.literal('1.0'),
  createdAt: isoDateTime,
  expiresAt: isoDateTime,
  status: HandoffStatus.default('pending'),
});
export type HandoffPacket = z.infer<typeof HandoffPacket>;

export const HandoffAckInput = z.object({
  packetId: z.string().uuid(),
  agentId: z.string().min(1),
  status: z.enum(['received', 'claimed', 'completed', 'rejected']),
  note: z.string().optional(),
  cumulativeId: MasterCumulativeId,
});
export type HandoffAckInput = z.infer<typeof HandoffAckInput>;

export const HandoffAck = HandoffAckInput.extend({
  ackedAt: isoDateTime,
});
export type HandoffAck = z.infer<typeof HandoffAck>;
