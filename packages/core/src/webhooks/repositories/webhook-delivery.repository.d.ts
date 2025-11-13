export declare class WebhookDeliveryRepository {
    constructor();
    create(data: any): Promise<any>;
    findByWebhookId(webhookId: string): Promise<never[]>;
    findById(id: string): Promise<{
        id: string;
        webhookId: string;
        status: "delivered";
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<any>;
    deleteOlderThan(date: Date): Promise<{
        deleted: number;
    }>;
}
//# sourceMappingURL=webhook-delivery.repository.d.ts.map