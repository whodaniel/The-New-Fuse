import { z } from 'zod';

/**
 * Canonical Jules (Google asynchronous coding agent) webhook contract.
 *
 * Re-homed from packages/jules-integration + apps/api-gateway during the
 * skill-consolidation (2026-08-29): provider integrations must live behind
 * universal contracts, not provider-specific packages.
 */

/** Lifecycle state reported by the Jules API for a session. */
export const JulesSessionStateSchema = z.enum([
  'STATE_UNSPECIFIED',
  'PENDING',
  'RUNNING',
  'PLANNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
]);
export type JulesSessionState = z.infer<typeof JulesSessionStateSchema>;

/** Coarse webhook notification state emitted to TNF. */
export const JulesWebhookStateSchema = z.enum([
  'IN_PROGRESS',
  'NEEDS_APPROVAL',
  'USER_INPUT_REQUIRED',
  'COMPLETED',
  'FAILED',
]);
export type JulesWebhookState = z.infer<typeof JulesWebhookStateSchema>;

/** Inbound webhook body delivered to `api/webhooks/incoming/jules/:encodedContext`. */
export const JulesWebhookPayloadSchema = z
  .object({
    sessionId: z.string().min(1),
    state: JulesWebhookStateSchema,
    status: z.string(),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
  })
  .strict();
export type JulesWebhookPayload = z.infer<typeof JulesWebhookPayloadSchema>;

/** Tenant/task routing context encoded into the webhook URL. */
export const WebhookContextSchema = z
  .object({
    tenantId: z.string().min(1),
    taskId: z.string().min(1),
    conversationId: z.string().optional(),
  })
  .strict();
export type WebhookContext = z.infer<typeof WebhookContextSchema>;
