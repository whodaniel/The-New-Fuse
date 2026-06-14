import type { Request } from 'express';
import { ApproveAgentTokenRequestDto, AuthorizeAgentTokenDto, RequestAgentTokenDto, RevokeAgentTokenDto, RevokeAllAgentTokensDto, UpsertAuthBrokerPolicyDto } from '../dto/a2a-auth-broker.dto';
import { A2AAuthBrokerService } from '../services/a2a-auth-broker.service';
type AuthenticatedRequest = Request & {
    user?: {
        id?: string;
        roles?: string[];
        permissions?: string[];
    };
};
export declare class A2AAuthBrokerController {
    private readonly authBrokerService;
    constructor(authBrokerService: A2AAuthBrokerService);
    requestToken(body: RequestAgentTokenDto, req: AuthenticatedRequest): Promise<import("../services/a2a-auth-broker.service").RequestTokenResult>;
    approve(body: ApproveAgentTokenRequestDto, req: AuthenticatedRequest): Promise<import("../services/a2a-auth-broker.service").ApproveTokenResult>;
    revoke(body: RevokeAgentTokenDto, req: AuthenticatedRequest): Promise<{
        revoked: boolean;
        revokedAt: string;
        tokenId?: string;
    }>;
    revokeAll(body: RevokeAllAgentTokensDto, req: AuthenticatedRequest): Promise<{
        revokedCount: number;
        revokedAt: string;
    }>;
    upsertPolicy(agentId: string, integration: string, body: UpsertAuthBrokerPolicyDto, req: AuthenticatedRequest): Promise<{
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
    }>;
    getPolicy(agentId: string, integration: string): Promise<{
        found: boolean;
        policy: {
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
        } | null;
    }>;
    authorizeToken(authorization: string | undefined, body: AuthorizeAgentTokenDto, req: AuthenticatedRequest): Promise<import("../services/a2a-auth-broker.service").AgentTokenAuthorizationResult>;
    private assertCanApprove;
    private assertCanManageRevocation;
    private assertCanManagePolicies;
    private getClientIp;
}
export {};
//# sourceMappingURL=a2a-auth-broker.controller.d.ts.map