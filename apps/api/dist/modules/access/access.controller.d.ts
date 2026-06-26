import { AccessService } from './access.service';
type ResolveAccessDto = {
    gameId?: string;
    userId?: string;
    email?: string;
    username?: string;
    walletAddress?: string;
    inviteCode?: string;
    agentId?: string;
};
export declare class AccessController {
    private readonly accessService;
    constructor(accessService: AccessService);
    resolve(body: ResolveAccessDto): Promise<{
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
            overrideTier: ("STARTER" | "PRO" | "ENTERPRISE") | null;
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
            requiredTier: "STARTER" | "PRO" | "ENTERPRISE";
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
                tierGranted: "STARTER" | "PRO" | "ENTERPRISE";
                expiresAt: string | null;
            } | null;
        };
        access: {
            canRegister: boolean;
            canPlay: boolean;
        };
        nextActions: {
            code: string;
            label: string;
            description: string;
            href?: string;
        }[];
        pathSummary: string;
    }>;
}
export {};
//# sourceMappingURL=access.controller.d.ts.map