import type { Request } from 'express';
import { CreateManagedAccountGrantDto, ProvisionManagedAccountDto, RedeemManagedAccountGrantDto } from '../../../dto/email-custodian.dto';
import { EmailCustodianService } from '../services/email-custodian.service';
type AuthenticatedRequest = Request & {
    user?: {
        id?: string;
        roles?: string[];
        permissions?: string[];
    };
};
export declare class EmailCustodianController {
    private readonly emailCustodianService;
    constructor(emailCustodianService: EmailCustodianService);
    listAccounts(req: AuthenticatedRequest): Promise<Omit<{
        provider: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Record<string, unknown>;
        ownerUserId: string;
        accountType: string;
        loginIdentifier: string;
        encryptedSecret: string;
        secretPreview: string | null;
        createdByAgent: string | null;
    }, "encryptedSecret">[]>;
    provisionAccount(req: AuthenticatedRequest, body: ProvisionManagedAccountDto): Promise<Omit<{
        provider: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: Record<string, unknown>;
        ownerUserId: string;
        accountType: string;
        loginIdentifier: string;
        encryptedSecret: string;
        secretPreview: string | null;
        createdByAgent: string | null;
    }, "encryptedSecret">>;
    createGrant(req: AuthenticatedRequest, accountId: string, body: CreateManagedAccountGrantDto): Promise<{
        grant: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            expiresAt: Date;
            revoked: boolean;
            ownerUserId: string;
            accountId: string;
            granteeAgentId: string;
            accessTokenHash: string;
            scopes: string[];
            lastRedeemedAt: Date | null;
        };
        grantToken: string;
        account: {
            id: string;
            accountType: string;
            provider: string;
            loginIdentifier: string;
        };
    }>;
    listGrants(req: AuthenticatedRequest, accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        revoked: boolean;
        ownerUserId: string;
        accountId: string;
        granteeAgentId: string;
        accessTokenHash: string;
        scopes: string[];
        lastRedeemedAt: Date | null;
    }[]>;
    revokeGrant(req: AuthenticatedRequest, grantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
        revoked: boolean;
        ownerUserId: string;
        accountId: string;
        granteeAgentId: string;
        accessTokenHash: string;
        scopes: string[];
        lastRedeemedAt: Date | null;
    }>;
    redeemGrant(body: RedeemManagedAccountGrantDto): Promise<{
        account: {
            id: string;
            accountType: string;
            provider: string;
            loginIdentifier: string;
            secret: string;
            metadata: Record<string, unknown>;
        };
        grant: {
            id: string;
            scopes: string[];
            expiresAt: Date;
            granteeAgentId: string;
        };
    }>;
    private requireUserId;
    private assertCanManage;
}
export {};
//# sourceMappingURL=email-custodian.controller.d.ts.map