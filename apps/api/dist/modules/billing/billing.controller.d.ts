import { PayPalService } from './paypal.service';
export declare class BillingController {
    private readonly payPalService;
    constructor(payPalService: PayPalService);
    getMembershipByIdentity(identity: string): Promise<{
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
    getMyMembership(req: any): Promise<{
        found: boolean;
        active: boolean;
        tier: "STARTER" | "PRO" | "ENTERPRISE";
        userId: string;
    }>;
}
//# sourceMappingURL=billing.controller.d.ts.map