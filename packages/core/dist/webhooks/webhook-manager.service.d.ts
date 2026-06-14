import { EventEmitter2 } from '@nestjs/event-emitter';
export interface WebhookConfig {
    id: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    secret?: string;
    active: boolean;
    retryAttempts: number;
    timeout: number;
}
export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    timestamp: Date;
    webhookId: string;
    status: 'pending' | 'sent' | 'failed' | 'retrying';
    attempts: number;
    lastAttempt?: Date;
    error?: string;
}
export declare class WebhookManagerService {
    private eventEmitter;
    private readonly logger;
    private webhooks;
    private events;
    constructor(eventEmitter: EventEmitter2);
    registerWebhook(config: Omit<WebhookConfig, 'id'>): Promise<WebhookConfig>;
    unregisterWebhook(webhookId: string): Promise<boolean>;
    updateWebhook(webhookId: string, updates: Partial<Omit<WebhookConfig, 'id'>>): Promise<WebhookConfig | null>;
    getWebhook(webhookId: string): Promise<WebhookConfig | null>;
    getAllWebhooks(): Promise<WebhookConfig[]>;
    triggerWebhook(eventType: string, data: any): Promise<void>;
    private sendWebhook;
    getWebhookEvents(webhookId?: string): Promise<WebhookEvent[]>;
    retryFailedWebhooks(): Promise<void>;
    private generateId;
}
//# sourceMappingURL=webhook-manager.service.d.ts.map