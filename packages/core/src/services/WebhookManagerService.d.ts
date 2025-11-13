import { LoggingService } from './LoggingService';
export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers: Record<string, string>;
    events: string[];
    status: 'active' | 'inactive' | 'error';
    secret?: string;
    timeout: number;
    retry_attempts: number;
    retry_delay: number;
    created_at: Date;
    updated_at: Date;
    last_triggered?: Date;
    success_count: number;
    failure_count: number;
}
export interface WebhookEvent {
    id: string;
    webhook_id: string;
    event_type: string;
    payload: any;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying';
    response_status?: number;
    response_body?: string;
    created_at: Date;
    sent_at?: Date;
    delivered_at?: Date;
    retry_count: number;
    error_message?: string;
}
export interface WebhookStats {
    total_webhooks: number;
    active_webhooks: number;
    total_events: number;
    pending_events: number;
    delivered_events: number;
    failed_events: number;
    average_response_time: number;
    success_rate: number;
}
export declare class WebhookManagerService {
    private readonly logger;
    private webhooks;
    private events;
    private processing_queue;
    private processing_interval?;
    private response_times;
    constructor(logger: LoggingService);
    createWebhook(config: {
        name: string;
        url: string;
        method?: WebhookConfig['method'];
        headers?: Record<string, string>;
        events: string[];
        secret?: string;
        timeout?: number;
        retry_attempts?: number;
        retry_delay?: number;
    }): Promise<string>;
    updateWebhook(id: string, updates: Partial<Omit<WebhookConfig, 'id' | 'created_at'>>): Promise<boolean>;
    deleteWebhook(id: string): Promise<boolean>;
    getEvent(id: string): Promise<WebhookEvent | null>;
    getEvents(filter?: {
        webhook_id?: string;
        event_type?: string;
        status?: WebhookEvent['status'];
        since?: Date;
        limit?: number;
    }): Promise<WebhookEvent[]>;
    retryEvent(id: string): Promise<boolean>;
}
//# sourceMappingURL=WebhookManagerService.d.ts.map