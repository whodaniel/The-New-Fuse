import { type ResourceNegotiationPayload as ResourceNegotiationPayloadType, type ResourceStrategy as ResourceStrategyType, type ResourceTier as ResourceTierType } from '@the-new-fuse/protocol-contracts';
export declare const ResourceTier: import("zod").ZodEnum<{
    free: "free";
    pro: "pro";
    enterprise: "enterprise";
    shared: "shared";
    anonymous: "anonymous";
}>;
export type ResourceTier = ResourceTierType;
export declare const ResourceStrategy: import("zod").ZodObject<{
    tier: import("zod").ZodDefault<import("zod").ZodEnum<{
        free: "free";
        pro: "pro";
        enterprise: "enterprise";
        shared: "shared";
        anonymous: "anonymous";
    }>>;
    poolId: import("zod").ZodOptional<import("zod").ZodString>;
    selection: import("zod").ZodDefault<import("zod").ZodEnum<{
        "round-robin": "round-robin";
        "least-used": "least-used";
        sequential: "sequential";
        random: "random";
        "priority-pro": "priority-pro";
    }>>;
    onQuotaExhausted: import("zod").ZodDefault<import("zod").ZodEnum<{
        "switch-account": "switch-account";
        "switch-tier": "switch-tier";
        wait: "wait";
        fail: "fail";
        negotiate: "negotiate";
    }>>;
    maxRetries: import("zod").ZodDefault<import("zod").ZodNumber>;
    minIntelligence: import("zod").ZodOptional<import("zod").ZodNumber>;
    maxLatency: import("zod").ZodOptional<import("zod").ZodNumber>;
}, import("zod/v4/core").$strict>;
export type ResourceStrategy = ResourceStrategyType;
export declare const ResourceNegotiationPayload: import("zod").ZodObject<{
    action: import("zod").ZodEnum<{
        "request-access": "request-access";
        "grant-access": "grant-access";
        "release-resource": "release-resource";
        "pool-status": "pool-status";
    }>;
    poolId: import("zod").ZodString;
    accountId: import("zod").ZodOptional<import("zod").ZodString>;
    remainingQuota: import("zod").ZodOptional<import("zod").ZodNumber>;
    resetTime: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strict>;
export type ResourceNegotiationPayload = ResourceNegotiationPayloadType;
//# sourceMappingURL=resource-protocol.d.ts.map