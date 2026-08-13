import { z } from 'zod';

/**
 * TNF Resource Primitives
 * For maximizing leverage of free-tier LLM accounts and switching between them.
 */

export const ResourceTierSchema = z.enum([
  'free', // Standard free tier (e.g., Claude 4.6 Free)
  'pro', // Paid individual account
  'enterprise', // Corporate/API-large-scale
  'shared', // Community shared/pooled account
  'anonymous', // Unauthenticated/open relay
]);

export type ResourceTier = z.infer<typeof ResourceTierSchema>;

/**
 * Strategy for selecting and switching between resources in a pool
 */
export const ResourceStrategySchema = z
  .object({
    tier: ResourceTierSchema.default('free'),

    // Specific pool identifier (e.g., "claude-free-pool-01")
    poolId: z.string().optional(),

    // Selection algorithm
    selection: z
      .enum([
        'round-robin',
        'least-used',
        'sequential',
        'random',
        'priority-pro', // Use Pro until exhausted, then jump to Free pool
      ])
      .default('least-used'),

    // What to do when the specific account or pool hits a quota/limit
    onQuotaExhausted: z
      .enum([
        'switch-account', // Rotate to next account in the same pool
        'switch-tier', // Fallback to another tier (e.g., Free -> Pro)
        'wait', // Pause until quota resets
        'fail', // Stop and return error
        'negotiate', // send a resource-negotiation request
      ])
      .default('switch-account'),

    // Max number of rotation attempts before giving up
    maxRetries: z.number().default(3),

    // Optional constraints
    minIntelligence: z.number().optional().describe('Minimum required LLM level (1-5)'),
    maxLatency: z.number().optional().describe('Max allowed response time in ms'),
  })
  .strict();

export type ResourceStrategy = z.infer<typeof ResourceStrategySchema>;

/**
 * Resource Negotiation Payload
 * Used for agents to coordinate which pools they are using
 */
export const ResourceNegotiationPayloadSchema = z
  .object({
    action: z.enum(['request-access', 'grant-access', 'release-resource', 'pool-status']),
    poolId: z.string(),
    accountId: z.string().optional(),
    remainingQuota: z.number().optional(),
    resetTime: z.string().datetime().optional(),
  })
  .strict();

export type ResourceNegotiationPayload = z.infer<typeof ResourceNegotiationPayloadSchema>;
