import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
export declare class PayPalService {
    private readonly configService;
    private readonly db;
    private readonly logger;
    private readonly apiUrl;
    private accessToken;
    private tokenExpiry;
    private readonly membershipOverrideRoles;
    constructor(configService: ConfigService, db: DatabaseService);
    /**
     * Get an access token (Client Credentials Flow)
     */
    private getAccessToken;
    /**
     * Verify and Process a Webhook Event
     */
    handleWebhook(headers: any, body: any): Promise<void>;
    /**
     * Create or Update Subscription in DB
     * Call this when the frontend successfully creates a subscription
     */
    createSubscriptionRecord(userId: string, subscriptionID: string, planId: string): Promise<void>;
    private updateSubscriptionStatus;
    /**
     * Get the current tier for a user
     */
    getUserTier(userId: string): Promise<'STARTER' | 'PRO' | 'ENTERPRISE'>;
    private maxTier;
    private normalizeTier;
    private escapeSqlLiteral;
    private getActiveMembershipOverride;
    private getPayPalTier;
    private getStripeTier;
    getMembershipByIdentity(identity: string): Promise<{
        identity: string;
        found: boolean;
        active: boolean;
        tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
        user: null | {
            id: string;
            email: string;
            username: string | null;
            role: string;
            roles: string[];
        };
        source: 'email' | 'username' | 'none';
    }>;
    getMembershipForUser(userId: string): Promise<{
        found: boolean;
        active: boolean;
        tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
        userId: string;
    }>;
}
//# sourceMappingURL=paypal.service.d.ts.map