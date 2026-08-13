// @ts-nocheck
import { z } from 'zod';
/**
 * TNF Resource Primitives
 * For maximizing leverage of free-tier LLM accounts and switching between them.
 */
export declare const ResourceTier: z.ZodEnum<{
    shared: "shared";
    free: "free";
    pro: "pro";
    enterprise: "enterprise";
    anonymous: "anonymous";
}>;
export type ResourceTier = z.infer<typeof ResourceTier>;
/**
 * Strategy for selecting and switching between resources in a pool
 */
export declare const ResourceStrategy: z.ZodObject<{
    tier: z.ZodDefault<z.ZodEnum<{
        shared: "shared";
        free: "free";
        pro: "pro";
        enterprise: "enterprise";
        anonymous: "anonymous";
    }>>;
    poolId: z.ZodOptional<z.ZodString>;
    selection: z.ZodDefault<z.ZodEnum<{
        sequential: "sequential";
        "round-robin": "round-robin";
        "least-used": "least-used";
        random: "random";
        "priority-pro": "priority-pro";
    }>>;
    onQuotaExhausted: z.ZodDefault<z.ZodEnum<{
        wait: "wait";
        "switch-account": "switch-account";
        "switch-tier": "switch-tier";
        fail: "fail";
        negotiate: "negotiate";
    }>>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    minIntelligence: z.ZodOptional<z.ZodNumber>;
    maxLatency: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type ResourceStrategy = z.infer<typeof ResourceStrategy>;
/**
 * Resource Negotiation Payload
 * Used for agents to coordinate which pools they are using
 */
export declare const ResourceNegotiationPayload: z.ZodObject<{
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
}, z.core.$strip>;
export type ResourceNegotiationPayload = z.infer<typeof ResourceNegotiationPayload>;
//# sourceMappingURL=resource-protocol.d.ts.map