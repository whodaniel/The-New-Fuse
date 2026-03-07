"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceNegotiationPayload = exports.ResourceStrategy = exports.ResourceTier = void 0;
const zod_1 = require("zod");
/**
 * TNF Resource Primitives
 * For maximizing leverage of free-tier LLM accounts and switching between them.
 */
exports.ResourceTier = zod_1.z.enum([
    'free', // Standard free tier (e.g., Claude 4.6 Free)
    'pro', // Paid individual account
    'enterprise', // Corporate/API-large-scale
    'shared', // Community shared/pooled account
    'anonymous' // Unauthenticated/open relay
]);
/**
 * Strategy for selecting and switching between resources in a pool
 */
exports.ResourceStrategy = zod_1.z.object({
    tier: exports.ResourceTier.default('free'),
    // Specific pool identifier (e.g., "claude-free-pool-01")
    poolId: zod_1.z.string().optional(),
    // Selection algorithm
    selection: zod_1.z.enum([
        'round-robin',
        'least-used',
        'sequential',
        'random',
        'priority-pro' // Use Pro until exhausted, then jump to Free pool
    ]).default('least-used'),
    // What to do when the specific account or pool hits a quota/limit
    onQuotaExhausted: zod_1.z.enum([
        'switch-account', // Rotate to next account in the same pool
        'switch-tier', // Fallback to another tier (e.g., Free -> Pro)
        'wait', // Pause until quota resets
        'fail', // Stop and return error
        'negotiate' // send a resource-negotiation request
    ]).default('switch-account'),
    // Max number of rotation attempts before giving up
    maxRetries: zod_1.z.number().default(3),
    // Optional constraints
    minIntelligence: zod_1.z.number().optional().describe('Minimum required LLM level (1-5)'),
    maxLatency: zod_1.z.number().optional().describe('Max allowed response time in ms'),
});
/**
 * Resource Negotiation Payload
 * Used for agents to coordinate which pools they are using
 */
exports.ResourceNegotiationPayload = zod_1.z.object({
    action: zod_1.z.enum(['request-access', 'grant-access', 'release-resource', 'pool-status']),
    poolId: zod_1.z.string(),
    accountId: zod_1.z.string().optional(),
    remainingQuota: zod_1.z.number().optional(),
    resetTime: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=resource-protocol.js.map