import { AgentManagedAccount, AgentManagedAccountGrant } from '../types/index.js';
export declare class DrizzleAgentManagedAccountRepository {
    listByOwner(ownerUserId: string): Promise<Omit<AgentManagedAccount, 'encryptedSecret'>[]>;
    findByIdForOwner(ownerUserId: string, accountId: string): Promise<Omit<AgentManagedAccount, 'encryptedSecret'> | null>;
    findDecryptedByIdForOwner(ownerUserId: string, accountId: string): Promise<(Omit<AgentManagedAccount, 'encryptedSecret'> & {
        secret: string;
    }) | null>;
    createAccount(ownerUserId: string, data: {
        accountType: string;
        provider: string;
        loginIdentifier: string;
        secret: string;
        metadata?: Record<string, unknown>;
        status?: string;
        createdByAgent?: string;
    }): Promise<Omit<AgentManagedAccount, 'encryptedSecret'>>;
    createGrant(input: {
        ownerUserId: string;
        accountId: string;
        granteeAgentId: string;
        scopes: string[];
        expiresAt: Date;
    }): Promise<{
        grant: AgentManagedAccountGrant;
        grantToken: string;
    }>;
    listGrantsForAccount(ownerUserId: string, accountId: string): Promise<AgentManagedAccountGrant[]>;
    revokeGrant(ownerUserId: string, grantId: string): Promise<AgentManagedAccountGrant | null>;
    redeemGrant(input: {
        grantToken: string;
        granteeAgentId: string;
    }): Promise<{
        grant: AgentManagedAccountGrant;
        account: Omit<AgentManagedAccount, 'encryptedSecret'> & {
            secret: string;
        };
    } | null>;
}
export declare const drizzleAgentManagedAccountRepository: DrizzleAgentManagedAccountRepository;
//# sourceMappingURL=agent-managed-account.repository.d.ts.map