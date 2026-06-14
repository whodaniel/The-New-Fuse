import { PayPalService } from './paypal.service';
export declare class PayPalController {
    private readonly paypalService;
    private readonly logger;
    private readonly trustedPayPalCertHosts;
    constructor(paypalService: PayPalService);
    verifyCommunityMembership(identity: string): Promise<{
        identity: string;
        found: boolean;
        active: boolean;
        tier: "STARTER" | "PRO" | "ENTERPRISE";
        user: null | {
            id: string;
            email: string;
            username: string | null;
            role: string;
            roles: string[];
        };
        source: "email" | "username" | "none";
    }>;
    handleWebhook(headers: any, body: any): Promise<{
        received: boolean;
    }>;
    recordSubscription(body: {
        subscriptionID: string;
        planID: string;
    }, req: any): Promise<{
        success: boolean;
    }>;
    /**
     * Verify PayPal webhook signature
     * https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
     */
    private verifyPayPalWebhookSignature;
    private extractPublicKeyFromCert;
    private isTrustedPayPalCertUrl;
}
//# sourceMappingURL=paypal.controller.d.ts.map