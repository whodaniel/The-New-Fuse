import { WebhookConfiguration } from '@the-new-fuse/types';
export interface IntegrationStatusGridProps {
    configurations: WebhookConfiguration[];
    loading?: boolean;
    showActions?: boolean;
    showDetails?: boolean;
    onEdit?: (config: WebhookConfiguration) => void;
    className?: string;
}
export declare function IntegrationStatusGrid({ configurations, loading, showActions, showDetails, onEdit, className, }: IntegrationStatusGridProps): import("react/jsx-runtime").JSX.Element;
