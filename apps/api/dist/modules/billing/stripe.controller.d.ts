import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
export declare class StripeController {
    private readonly stripeService;
    private readonly configService;
    private readonly logger;
    constructor(stripeService: StripeService, configService: ConfigService);
    handleWebhook(headers: any, body: any, req: any): Promise<{
        received: boolean;
    }>;
    recordSubscription(body: {
        subscriptionId: string;
        customerId?: string;
        priceId?: string;
        status?: string;
        currentPeriodStart?: number | string | Date;
        currentPeriodEnd?: number | string | Date;
        cancelAtPeriodEnd?: boolean;
    }, req: any): Promise<{
        success: boolean;
    }>;
    createCheckoutSession(body: {
        priceId?: string;
        successUrl?: string;
        cancelUrl?: string;
        mode?: 'subscription' | 'payment';
    }, req: any): Promise<{
        id: string;
        url: string;
        provider: "stripe";
    }>;
    private verifyStripeSignature;
}
//# sourceMappingURL=stripe.controller.d.ts.map