import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
export declare class StripeService {
    private readonly db;
    private readonly configService;
    private readonly logger;
    constructor(db: DatabaseService, configService: ConfigService);
    recordSubscription(userId: string, payload: {
        subscriptionId: string;
        customerId?: string;
        priceId?: string;
        status?: string;
        currentPeriodStart?: number | string | Date;
        currentPeriodEnd?: number | string | Date;
        cancelAtPeriodEnd?: boolean;
        tier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
    }): Promise<void>;
    updateSubscriptionByStripeId(subscriptionId: string, status: string): Promise<void>;
    handleWebhookEvent(event: any): Promise<void>;
    createCheckoutSession(input: {
        userId: string;
        userEmail?: string;
        priceId?: string;
        successUrl?: string;
        cancelUrl?: string;
        mode?: 'subscription' | 'payment';
    }): Promise<{
        id: string;
        url: string;
        provider: 'stripe';
    }>;
    private resolveUserId;
    private mapStripeStatus;
    private toDate;
}
//# sourceMappingURL=stripe.service.d.ts.map