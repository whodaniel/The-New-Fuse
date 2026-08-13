import { z } from 'zod';

const UUID = z.string().uuid();
const DATE_TIME = z.string().datetime();

export const HandoffPrioritySchema = z.enum(['low', 'normal', 'high', 'critical']);
export type HandoffPriority = z.infer<typeof HandoffPrioritySchema>;

export const HandoffStatusSchema = z.enum([
  'pending',
  'received',
  'claimed',
  'completed',
  'rejected',
]);
export type HandoffStatus = z.infer<typeof HandoffStatusSchema>;

export const FederationGateDecisionSchema = z
  .object({
    gate: z.string().min(1),
    decision: z.enum(['allow', 'deny', 'quarantine']),
    reason: z.string().optional(),
    at: DATE_TIME,
  })
  .strict();
export type FederationGateDecision = z.infer<typeof FederationGateDecisionSchema>;

export const MasterCumulativeIdSchema = z
  .object({
    spec: z.literal('tnf/mcid/0.1'),
    id: UUID,
    scope: z
      .object({
        tenant_id: z.string().min(1),
        cron_namespace: z.string().nullable().optional(),
        session_key: z.string().nullable().optional(),
        workflow_id: z.string().nullable().optional(),
        channel_id: z.string().nullable().optional(),
      })
      .strict(),
    lineage: z
      .object({
        trace_id: UUID.nullable().optional(),
        correlation_id: UUID,
        causation_id: UUID.nullable(),
        handoff_packet_id: UUID.nullable().optional(),
        twid: UUID.nullable().optional(),
        task_id: z.string().nullable().optional(),
        schedule_id: z.string().nullable().optional(),
        schedule_run_id: z.string().nullable().optional(),
      })
      .strict(),
    federation: z
      .object({
        domain: z.string().min(1),
        route: z.array(z.string().min(1)).min(1),
        hop_count: z.number().int().nonnegative(),
        gate_decisions: z.array(FederationGateDecisionSchema).default([]),
      })
      .strict()
      .optional(),
    issued_at: DATE_TIME.optional(),
  })
  .strict();
export type MasterCumulativeId = z.infer<typeof MasterCumulativeIdSchema>;

export const TNFResourcePointerSchema = z
  .object({
    uri: z
      .string()
      .url()
      .or(z.string().regex(/^(pgvector|file|trp|s3|r2):\/\//)),
    integrityHash: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().int().nonnegative().optional(),
  })
  .strict();
export type TNFResourcePointer = z.infer<typeof TNFResourcePointerSchema>;

export const HandoffPayloadSchema = z
  .object({
    title: z.string().min(3),
    summary: z.string().min(10),
    prompt: z.string().min(10),
    acceptanceCriteria: z.array(z.string()).default([]),
    nextActions: z.array(z.string()).default([]),
    artifacts: z.array(z.string()).default([]),
    resourcePointers: z.record(z.string(), TNFResourcePointerSchema).optional(),
    twipRef: z
      .object({
        twid: UUID,
        correlationId: UUID.optional(),
        integrityHash: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type HandoffPayload = z.infer<typeof HandoffPayloadSchema>;

export const HandoffScopeSchema = z
  .object({
    tenantId: z.string().min(1),
    sessionKey: z.string().optional(),
    workflowId: z.string().optional(),
    channelId: z.string().optional(),
  })
  .strict();
export type HandoffScope = z.infer<typeof HandoffScopeSchema>;

export const HandoffTargetsSchema = z
  .object({
    agentIds: z.array(z.string().min(1)).min(1),
    roles: z.array(z.string().min(1)).default([]),
  })
  .strict()
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
export type HandoffTargets = z.infer<typeof HandoffTargetsSchema>;

export const HandoffPacketInputSchema = z
  .object({
    fromAgentId: z.string().min(1),
    targets: HandoffTargetsSchema,
    scope: HandoffScopeSchema,
    payload: HandoffPayloadSchema,
    cumulativeId: MasterCumulativeIdSchema,
    gateDecisions: z.array(FederationGateDecisionSchema).min(1),
    priority: HandoffPrioritySchema.default('normal'),
    expiresAt: DATE_TIME.optional(),
    tags: z.array(z.string()).default([]),
  })
  .strict();
export type HandoffPacketInput = z.infer<typeof HandoffPacketInputSchema>;

export const HandoffPacketVersionSchema = z.enum(['1.0', '1.1']);
export type HandoffPacketVersion = z.infer<typeof HandoffPacketVersionSchema>;

export const HandoffPacketSchema = HandoffPacketInputSchema.partial({
  cumulativeId: true,
  gateDecisions: true,
})
  .extend({
    id: UUID,
    version: HandoffPacketVersionSchema.default('1.0'),
    createdAt: DATE_TIME,
    expiresAt: DATE_TIME,
    status: HandoffStatusSchema.default('pending'),
  })
  .strict()
  .superRefine((packet, ctx) => {
    if (packet.version === '1.1') {
      if (!packet.cumulativeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cumulativeId'],
          message: 'cumulativeId is required for handoff packet version 1.1',
        });
      }

      if (!Array.isArray(packet.gateDecisions) || packet.gateDecisions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gateDecisions'],
          message: 'gateDecisions is required for handoff packet version 1.1',
        });
      }
    }
  });
export type HandoffPacket = z.infer<typeof HandoffPacketSchema>;

export const HandoffAckInputSchema = z
  .object({
    packetId: UUID,
    agentId: z.string().min(1),
    status: z.enum(['received', 'claimed', 'completed', 'rejected']),
    note: z.string().optional(),
    cumulativeId: MasterCumulativeIdSchema,
  })
  .strict();
export type HandoffAckInput = z.infer<typeof HandoffAckInputSchema>;

export const HandoffAckSchema = HandoffAckInputSchema.extend({
  ackedAt: DATE_TIME,
}).strict();
export type HandoffAck = z.infer<typeof HandoffAckSchema>;
