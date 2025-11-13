import { Integration, IntegrationType, IntegrationConfig } from './types';
/**
 * Zapier integration configuration
 */
export interface ZapierConfig extends IntegrationConfig {
    apiKey?: string;
    nlaEnabled?: boolean;
}
/**
 * Zapier integration for accessing Zapier's API
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
    /**
     * Connect to Zapier API
     */
    connect(): Promise<boolean>;
    /**
     * List Zapier apps
     */
    private listApps;
    /**
     * List user's Zaps
     */
    private listZaps;
    /**
     * Run a specific Zap
     */
    private runZap;
    /**
     * Create a webhook for a Zap
     */
    private createWebhook;
}
//# sourceMappingURL=zapier.d.ts.map