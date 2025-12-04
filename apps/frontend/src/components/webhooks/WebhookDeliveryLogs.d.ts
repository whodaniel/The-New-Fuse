import { DeliveryStatus, IntegrationSource } from '@the-new-fuse/types';
export interface WebhookDeliveryLog {
    id: string;
    webhook_config_id: string;
    event_id: string;
    delivery_url: string;
    http_status: number;
    status: DeliveryStatus;
    attempt_number: number;
    response_time_ms: number;
    error_message?: string;
    request_headers: Record<string, string>;
    request_body: Record<string, unknown>;
    response_headers: Record<string, string>;
    response_body: Record<string, unknown>;
    created_at: string;
    next_retry_at?: string;
    source: IntegrationSource;
    event_type: string;
}
export interface WebhookDeliveryLogsProps {
    webhookConfigId?: string;
    className?: string;
}
export declare function WebhookDeliveryLogs({ webhookConfigId, className, }: WebhookDeliveryLogsProps): import("react/jsx-runtime").JSX.Element;
