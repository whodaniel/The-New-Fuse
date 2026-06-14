import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnifiedLedgerService } from '../../unified-ledger/unified-ledger.service';
type AuthDecision = 'approved' | 'pending' | 'denied';
type RequestContext = {
    requesterUserId?: string;
    ip?: string;
    runtimeId?: string;
};
type AuthorizeContext = {
    ip?: string;
    runtimeId?: string;
};
type AgentTokenRequestInput = {
    agentId: string;
    integration: string;
    accountRef?: string;
    requestedScopes: string[];
    action: string;
    reason?: string;
    ttlSeconds?: number;
    runtimeId?: string;
    bindIp?: boolean;
};
type ApproveRequestInput = {
    requestId: string;
    mfaProof: string;
    approvedScopes?: string[];
    approvedTtlSeconds?: number;
};
type RevokeInput = {
    tokenId?: string;
    requestId?: string;
    reason?: string;
};
type RevokeAllInput = {
    agentId: string;
    integration?: string;
    reason?: string;
};
type UpsertPolicyInput = {
    allowedScopes: string[];
    allowedActions: string[];
    stepUpActions?: string[];
    singleUseActions?: string[];
    allowedAccountRefs?: string[];
    maxTtlSeconds?: number;
    defaultTtlSeconds?: number;
    requireRuntimeBinding?: boolean;
    requireIpBinding?: boolean;
};
export type AgentTokenAuthorizationInput = {
    bearerToken: string;
    agentId?: string;
    integration?: string;
    accountRef?: string;
    action?: string;
    requiredScopes?: string[];
    runtimeId?: string;
};
export type AgentTokenAuthorizationResult = {
    tokenId: string;
    requestId: string;
    agentId: string;
    integration: string;
    accountRef?: string;
    scopes: string[];
    action: string;
    expiresAt: string;
    singleUse: boolean;
    usageCount: number;
};
export type RequestTokenResult = {
    requestId: string;
    decision: AuthDecision;
    token?: string;
    tokenId?: string;
    expiresAt?: string;
    reason?: string;
};
export type ApproveTokenResult = {
    requestId: string;
    decision: 'approved';
    token: string;
    tokenId: string;
    expiresAt: string;
};
type AuthBrokerPolicy = {
    agentId: string;
    integration: string;
    allowedScopes: string[];
    allowedActions: string[];
    stepUpActions: string[];
    singleUseActions: string[];
    allowedAccountRefs: string[];
    maxTtlSeconds: number;
    defaultTtlSeconds: number;
    requireRuntimeBinding: boolean;
    requireIpBinding: boolean;
    updatedAt: string;
    updatedBy: string;
};
export declare class A2AAuthBrokerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly eventEmitter;
    private readonly unifiedLedgerService;
    private readonly logger;
    private redis;
    private redisReady;
    private cleanupInterval;
    private readonly redisPrefix;
    private readonly authActor;
    private readonly requests;
    private readonly tokens;
    private readonly tokenHashIndex;
    private readonly agentActiveTokens;
    private readonly policies;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2, unifiedLedgerService: UnifiedLedgerService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    requestToken(input: AgentTokenRequestInput, context: RequestContext): Promise<RequestTokenResult>;
    approveTokenRequest(input: ApproveRequestInput, context: RequestContext): Promise<ApproveTokenResult>;
    revokeTokenOrRequest(input: RevokeInput, context: RequestContext): Promise<{
        revoked: boolean;
        revokedAt: string;
        tokenId?: string;
    }>;
    revokeAllForAgent(input: RevokeAllInput, context: RequestContext): Promise<{
        revokedCount: number;
        revokedAt: string;
    }>;
    upsertPolicy(agentIdRaw: string, integrationRaw: string, input: UpsertPolicyInput, actor?: string): Promise<AuthBrokerPolicy>;
    getPolicy(agentIdRaw: string, integrationRaw: string): Promise<AuthBrokerPolicy | null>;
    authorizeAgentToken(input: AgentTokenAuthorizationInput, context: AuthorizeContext): Promise<AgentTokenAuthorizationResult>;
    private normalizeRequestInput;
    private evaluateRequest;
    private issueToken;
    private revokeTokenById;
    private initializeRedis;
    private emitAuditEvent;
    private isMfaProofValid;
    private actionAllowed;
    private containsAllScopes;
    private intersectScopes;
    private intersectScopesWithWildcard;
    private normalizeScopes;
    private normalizeActions;
    private normalizeValues;
    private clampTtlSeconds;
    private normalizeIdentifier;
    private buildId;
    private isExpired;
    private hashToken;
    private extractBearerToken;
    private requestKey;
    private tokenKey;
    private tokenHashKey;
    private agentActiveTokensKey;
    private policyKey;
    private auditStreamKey;
    private policyIndexKey;
    private saveRequest;
    private getRequest;
    private saveToken;
    private getToken;
    private lookupTokenIdByHash;
    private listActiveTokenIds;
    private removeActiveToken;
    private savePolicy;
    private resolvePolicy;
    private computeRequestTtlMs;
    private cleanupExpiredMemoryRecords;
}
export {};
//# sourceMappingURL=a2a-auth-broker.service.d.ts.map