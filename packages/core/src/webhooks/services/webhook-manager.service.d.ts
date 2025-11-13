export declare class WebhookManagerService {
    constructor();
    createWebhook(data: any): Promise<any>;
    findAllWebhooks(): Promise<never[]>;
    findWebhookById(id: string): Promise<{
        id: string;
        name: string;
    }>;
    updateWebhook(id: string, data: any): Promise<any>;
    deleteWebhook(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    testWebhook(id: string): Promise<{
        id: string;
        tested: boolean;
    }>;
}
//# sourceMappingURL=webhook-manager.service.d.ts.map