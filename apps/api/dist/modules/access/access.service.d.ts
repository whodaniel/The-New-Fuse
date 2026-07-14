import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
import { AuthService } from '../../services/auth.service';
import { PayPalService } from '../billing/paypal.service';
type SubscriptionTier = 'STARTER' | 'PRO' | 'ENTERPRISE';
type ResolveAccessInput = {
    gameId?: string;
    userId?: string;
    email?: string;
    username?: string;
    walletAddress?: string;
    inviteCode?: string;
    agentId?: string;
};
type AccessNextAction = {
    code: string;
    label: string;
    description: string;
    href?: string;
};
export declare class AccessService {
    private readonly db;
    private readonly configService;
    private readonly authService;
    private readonly payPalService;
    constructor(db: DatabaseService, configService: ConfigService, authService: AuthService, payPalService: PayPalService);
    resolve(input: ResolveAccessInput): Promise<{
        ok: boolean;
        gameId: string;
        actor: {
            kind: string;
            agentId: string | null;
            isProgrammaticAgent: boolean;
            isAdmin: boolean;
            isSuperAdmin: boolean;
            primaryRole: string;
        };
        subject: {
            userId: string | null;
            username: string | null;
            email: string | null;
            walletAddress: string | null;
        };
        invite: {
            enabled: boolean;
            required: boolean;
            satisfied: boolean;
            source: "db" | "env" | null;
        };
        membership: {
            found: boolean;
            active: boolean;
            tier: "STARTER" | "PRO" | "ENTERPRISE";
            overrideActive: boolean;
            overrideTier: SubscriptionTier | null;
        };
        wallet: {
            linked: boolean;
            address: string | null;
        };
        game: {
            id: string;
            label: string | null;
            description: string | null;
            requiresMembership: boolean;
            requiredTier: SubscriptionTier;
            nftRequired: boolean;
            nft: {
                contractAddress: string | null;
                chainId: number | null;
                tokenId: string | null;
                traits: unknown;
                ownershipVerified: boolean;
            } | null;
            entitlement: {
                source: string;
                tierGranted: SubscriptionTier;
                expiresAt: string | null;
            } | null;
        };
        access: {
            canRegister: boolean;
            canPlay: boolean;
        };
        nextActions: AccessNextAction[];
        pathSummary: string;
    }>;
    private normalizeInput;
    private findUserByEmail;
    private getAgent;
    private validateInvite;
    private getActiveMembershipOverride;
    private getActiveEntitlement;
    private getGameRule;
    private buildNextActions;
    private buildPathSummary;
    private tierMeets;
    private primaryRole;
    private clean;
    private isTruthy;
}
export {};
//# sourceMappingURL=access.service.d.ts.map