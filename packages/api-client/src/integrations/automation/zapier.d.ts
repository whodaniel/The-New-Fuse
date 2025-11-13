import { Integration, IntegrationType, IntegrationConfig } from '../types';
/**
 * Zapier integration configuration
 */
export interface ZapierConfig extends IntegrationConfig {
    apiKey?: string;
    nlaEnabled?: boolean;
}
/**
 * Zapier integration for workflow automation
 */
export declare class ZapierIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: ZapierConfig;
    capabilities: {
        actions: string[];
        triggers: string[];
        supportsWebhooks: boolean;
        supportsPolling: boolean;
        supportsCustomFields: boolean;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: ZapierConfig);
}
//# sourceMappingURL=zapier.d.ts.map