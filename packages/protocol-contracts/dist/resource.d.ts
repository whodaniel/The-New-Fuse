import { z } from 'zod';
/**
 * TNF Resource Primitives
 * For maximizing leverage of free-tier LLM accounts and switching between them.
 */
export declare const ResourceTierSchema: z.ZodEnum<{
    free: "free";
    pro: "pro";
    enterprise: "enterprise";
    shared: "shared";
    anonymous: "anonymous";
}>;
export type ResourceTier = z.infer<typeof ResourceTierSchema>;
/**
 * Strategy for selecting and switching between resources in a pool
 */
export declare const ResourceStrategySchema: z.ZodObject<{
    tier: z.ZodDefault<z.ZodEnum<{
        free: "free";
        pro: "pro";
        enterprise: "enterprise";
        shared: "shared";
        anonymous: "anonymous";
    }>>;
    poolId: z.ZodOptional<z.ZodString>;
    selection: z.ZodDefault<z.ZodEnum<{
        "round-robin": "round-robin";
        "least-used": "least-used";
        sequential: "sequential";
        random: "random";
        "priority-pro": "priority-pro";
    }>>;
    onQuotaExhausted: z.ZodDefault<z.ZodEnum<{
        "switch-account": "switch-account";
        "switch-tier": "switch-tier";
        wait: "wait";
        fail: "fail";
        negotiate: "negotiate";
    }>>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    minIntelligence: z.ZodOptional<z.ZodNumber>;
    maxLatency: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type ResourceStrategy = z.infer<typeof ResourceStrategySchema>;
/**
 * Resource Negotiation Payload
 * Used for agents to coordinate which pools they are using
 */
export declare const ResourceNegotiationPayloadSchema: z.ZodObject<{
    action: z.ZodEnum<{
        "request-access": "request-access";
        "grant-access": "grant-access";
        "release-resource": "release-resource";
        "pool-status": "pool-status";
    }>;
    poolId: z.ZodString;
    accountId: z.ZodOptional<z.ZodString>;
    remainingQuota: z.ZodOptional<z.ZodNumber>;
    resetTime: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type ResourceNegotiationPayload = z.infer<typeof ResourceNegotiationPayloadSchema>;
//# sourceMappingURL=resource.d.ts.map