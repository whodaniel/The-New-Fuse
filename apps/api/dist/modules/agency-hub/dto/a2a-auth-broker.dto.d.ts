export declare class RequestAgentTokenDto {
    agentId: string;
    integration: string;
    accountRef?: string;
    requestedScopes: string[];
    action: string;
    reason?: string;
    ttlSeconds?: number;
    runtimeId?: string;
    bindIp?: boolean;
}
export declare class ApproveAgentTokenRequestDto {
    requestId: string;
    mfaProof: string;
    approvedScopes?: string[];
    approvedTtlSeconds?: number;
}
export declare class RevokeAgentTokenDto {
    tokenId?: string;
    requestId?: string;
    reason?: string;
}
export declare class RevokeAllAgentTokensDto {
    agentId: string;
    integration?: string;
    reason?: string;
}
export declare class UpsertAuthBrokerPolicyDto {
    allowedScopes: string[];
    allowedActions: string[];
    stepUpActions?: string[];
    singleUseActions?: string[];
    allowedAccountRefs?: string[];
    maxTtlSeconds?: number;
    defaultTtlSeconds?: number;
    requireRuntimeBinding?: boolean;
    requireIpBinding?: boolean;
}
export declare class AuthorizeAgentTokenDto {
    agentId?: string;
    integration?: string;
    accountRef?: string;
    action?: string;
    requiredScopes?: string[];
    runtimeId?: string;
}
//# sourceMappingURL=a2a-auth-broker.dto.d.ts.map