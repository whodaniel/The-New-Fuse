import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database';
import { CreateManagedAccountGrantDto, ProvisionManagedAccountDto, RedeemManagedAccountGrantDto } from '../../../dto/email-custodian.dto';
export declare class EmailCustodianService {
    private readonly db;
    private readonly configService;
    constructor(db: DatabaseService, configService: ConfigService);
    listAccountsForOwner(ownerUserId: string): Promise<Omit<{
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
    provisionAccountForOwner(ownerUserId: string, dto: ProvisionManagedAccountDto): Promise<Omit<{
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
    createGrantForAccount(ownerUserId: string, accountId: string, dto: CreateManagedAccountGrantDto): Promise<{
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
    listAccountGrants(ownerUserId: string, accountId: string): Promise<{
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
    revokeGrant(ownerUserId: string, grantId: string): Promise<{
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
    redeemGrant(dto: RedeemManagedAccountGrantDto): Promise<{
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
    private resolveProvider;
    private resolveHostingTransport;
    private createHostedEmailAccount;
    private createHostedEmailAccountViaCpanelApi;
    private createHostedEmailAccountViaSsh;
    private executeSshCommand;
    private renderSshCommand;
    private shellQuote;
    private redactSecret;
    private resolveInteger;
    private attemptChatgptAutomation;
    private resolveMailboxAndDomain;
    private readStatus;
    private tryParseJson;
}
//# sourceMappingURL=email-custodian.service.d.ts.map