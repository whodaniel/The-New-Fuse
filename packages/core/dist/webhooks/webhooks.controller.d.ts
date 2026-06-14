import { WebhookManagerService, WebhookConfig } from './webhook-manager.service.js';
export interface CreateWebhookDto {
    url: string;
    events: string[];
    headers?: Record<string, string>;
    secret?: string;
    active?: boolean;
    retryAttempts?: number;
    timeout?: number;
}
export interface UpdateWebhookDto {
    url?: string;
    events?: string[];
    headers?: Record<string, string>;
    secret?: string;
    active?: boolean;
    retryAttempts?: number;
    timeout?: number;
}
export declare class WebhooksController {
    private readonly webhookManager;
    constructor(webhookManager: WebhookManagerService);
    registerWebhook(webhookData: CreateWebhookDto): Promise<WebhookConfig>;
    getAllWebhooks(): Promise<WebhookConfig[]>;
    getWebhook(id: string): Promise<WebhookConfig>;
    updateWebhook(id: string, updates: UpdateWebhookDto): Promise<WebhookConfig>;
    deleteWebhook(id: string): Promise<{
        success: boolean;
    }>;
    triggerWebhooks(eventData: {
        type: string;
        data: any;
    }): Promise<{
        success: boolean;
    }>;
    getWebhookEvents(id: string): Promise<any[]>;
    retryFailedWebhooks(): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=webhooks.controller.d.ts.map