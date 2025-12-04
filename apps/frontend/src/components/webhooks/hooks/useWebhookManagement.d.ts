import { WebhookConfiguration, WebhookRegistrationRequest, WebhookRegistrationResponse, WebhookStatusResponse, WebhookDeliveryLog, IntegrationSource } from '@the-new-fuse/types';
export interface WebhookManagementState {
    configurations: WebhookConfiguration[];
    deliveryLogs: WebhookDeliveryLog[];
    loading: boolean;
    error: string | null;
}
export declare function useWebhookManagement(): {
    registerWebhook: (request: WebhookRegistrationRequest) => Promise<WebhookRegistrationResponse>;
    getWebhookStatus: (webhookId: string) => Promise<WebhookStatusResponse>;
    retryFailedEvent: (eventId: string) => Promise<void>;
    loadConfigurations: () => Promise<void>;
    loadDeliveryLogs: (webhookId?: string) => Promise<void>;
    deleteWebhook: (webhookId: string) => Promise<void>;
    updateWebhook: (webhookId: string, updates: Partial<WebhookConfiguration>) => Promise<void>;
    testWebhook: (webhookId: string, testPayload?: Record<string, unknown>) => Promise<{
        success: boolean;
        response?: unknown;
        error?: string;
    }>;
    getIntegrationStats: () => Promise<any>;
    getConfigurationsBySource: (source: IntegrationSource) => WebhookConfiguration[];
    getActiveConfigurations: () => WebhookConfiguration[];
    getRecentDeliveryLogs: (limit?: number) => WebhookDeliveryLog[];
    getFailedDeliveries: () => WebhookDeliveryLog[];
    configurations: WebhookConfiguration[];
    deliveryLogs: WebhookDeliveryLog[];
    loading: boolean;
    error: string | null;
};
