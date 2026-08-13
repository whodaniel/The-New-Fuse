import { z } from 'zod';

const UUID = z.string().uuid();
const DATE_TIME = z.string().datetime({ offset: true });

export const TwipScopeSchema = z
  .object({
    tenant_id: z.string().min(1),
    session_key: z.string().nullable().optional(),
    workflow_id: z.string().nullable().optional(),
  })
  .strict();

export const TwipTraceSchema = z
  .object({
    correlation_id: UUID,
    causation_id: UUID.nullable(),
  })
  .strict();

export const TwipIdentityProvenanceItemSchema = z
  .object({
    key: z.string().min(1),
    value: z.unknown().optional(),
    source: z.enum(['kernel', 'process', 'env', 'multiplexer', 'gui', 'derived']),
    confidence: z.number().min(0).max(1),
    observed_at: DATE_TIME,
  })
  .strict();

export const TwipIdentitySchema = z
  .object({
    twid: UUID,
    spec: z.literal('twip/0.1'),
    created_at: DATE_TIME,
    incarnation: z.int().min(0).optional(),
    scope: z
      .object({
        tenant_id: z.string().min(1),
        host_id: z.string().min(1),
        emulator_id: z.string().min(1),
        window_id: z.string().nullable().optional(),
        tab_id: z.string().nullable().optional(),
        pane_id: z.string().nullable().optional(),
        session_key: z.string().nullable().optional(),
      })
      .strict(),
    process: z
      .object({
        shell_pid: z.int().min(1).optional(),
        pgid: z.int().min(1).optional(),
        sid: z.int().min(1).optional(),
      })
      .strict()
      .optional(),
    pty: z
      .object({
        path: z.string().optional(),
        inode: z.int().min(0).optional(),
      })
      .strict()
      .optional(),
    multiplexer: z
      .object({
        kind: z.enum(['tmux', 'screen', 'none']),
        session_id: z.string().nullable().optional(),
        window_id: z.string().nullable().optional(),
        pane_id: z.string().nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    provenance: z.array(TwipIdentityProvenanceItemSchema).min(1),
    labels: z.array(z.string()).optional(),
    context_excerpt: z
      .object({
        source: z.enum(['tmux-capture-pane', 'terminal-history']),
        captured_at: DATE_TIME,
        line_count: z.int().min(0),
        char_count: z.int().min(0),
        redaction_count: z.int().min(0),
        truncated: z.boolean(),
        text: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const TwipEnvelopeSchema = z
  .object({
    id: UUID,
    spec: z.literal('twip/0.1'),
    type: z.enum([
      'IDENTITY.PUBLISH',
      'IDENTITY.RESOLVE',
      'IDENTITY.RESOLVE.RESULT',
      'IDENTITY.REVOKE',
      'CAPABILITY.REGISTER',
      'POLICY.DECISION',
      'ERROR',
    ]),
    sent_at: DATE_TIME,
    scope: TwipScopeSchema,
    trace: TwipTraceSchema,
    policy: z
      .object({
        ttl_seconds: z.int().min(1).max(3600).optional(),
        allow_remote_propagation: z.boolean().optional(),
        redact_gui_fields: z.boolean().optional(),
      })
      .strict()
      .optional(),
    payload: z.union([
      z
        .object({
          identity: TwipIdentitySchema,
        })
        .strict(),
      z
        .object({
          twid: UUID,
        })
        .strict(),
      z
        .object({
          code: z.string(),
          message: z.string(),
          retryable: z.boolean().optional(),
        })
        .strict(),
    ]),
    sig: z.string().optional(),
  })
  .strict();

export type TwipIdentity = z.infer<typeof TwipIdentitySchema>;
export type TwipEnvelope = z.infer<typeof TwipEnvelopeSchema>;
