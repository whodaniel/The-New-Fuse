import { IntegrationSource } from '@the-new-fuse/types';
export interface WebhookConfigurationFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    editingWebhook?: {
        id: string;
        source: IntegrationSource;
        endpoint_url: string;
        secret_key: string;
        configuration: Record<string, unknown>;
    };
    className?: string;
}
export declare function WebhookConfigurationForm({ onSuccess, onCancel, editingWebhook, className, }: WebhookConfigurationFormProps): import("react/jsx-runtime").JSX.Element;
