export interface WebhookSubscription {
    id: string;
    event: string;
    url: string;
    secret?: string;
    active: boolean;
    description?: string;
    createdAt: string;
    updatedAt: string;
    lastTriggered?: string;
    triggerCount: number;
    failCount: number;
    headers?: Record<string, string>;
    retryCount: number;
    timeout?: number;
}
export interface WebhookEvent {
    event: string;
    timestamp: string;
    payload: Record<string, any>;
    subscriptionId: string;
    deliveryId: string;
}
export declare class WebhookService {
    private readonly webhooksPath;
    constructor();
    private readWebhooks;
    private writeWebhooks;
    list(): Promise<WebhookSubscription[]>;
    add(event: string, url: string, options?: {
        secret?: string;
        description?: string;
        headers?: Record<string, string>;
        timeout?: number;
    }): Promise<WebhookSubscription>;
    remove(id: string): Promise<void>;
    get(id: string): Promise<WebhookSubscription | undefined>;
    trigger(event: string, payload?: Record<string, any>): Promise<WebhookEvent>;
    enable(id: string): Promise<WebhookSubscription>;
    disable(id: string): Promise<WebhookSubscription>;
    update(id: string, updates: Partial<Omit<WebhookSubscription, 'id'>>): Promise<WebhookSubscription>;
    private getDefaultWebhooks;
}
//# sourceMappingURL=WebhookService.d.ts.map