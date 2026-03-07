import { z } from 'zod';

const isoDateTime = z.string().datetime();

export const HandoffPriority = z.enum(['low', 'normal', 'high', 'critical']);
export type HandoffPriority = z.infer<typeof HandoffPriority>;

export const HandoffStatus = z.enum(['pending', 'received', 'claimed', 'completed', 'rejected']);
export type HandoffStatus = z.infer<typeof HandoffStatus>;

export const HandoffPayload = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  prompt: z.string().min(10),
  acceptanceCriteria: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
  artifacts: z.array(z.string()).default([]),
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
});
export type HandoffAckInput = z.infer<typeof HandoffAckInput>;

export const HandoffAck = HandoffAckInput.extend({
  ackedAt: isoDateTime,
});
export type HandoffAck = z.infer<typeof HandoffAck>;
