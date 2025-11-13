export declare class WebhookDeliveryService {
    constructor();
    deliverWebhook(webhookId: string, event: string, payload: any): Promise<{
        id: string;
        webhookId: string;
        event: string;
        payload: any;
        status: "delivered";
        attempts: number;
        maxAttempts: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDeliveries(webhookId: string): Promise<never[]>;
    redeliverWebhook(webhookId: string, deliveryId: string): Promise<{
        id: string;
        webhookId: string;
        status: "pending";
        redelivered: boolean;
    }>;
}
//# sourceMappingURL=webhook-delivery.service.d.ts.map