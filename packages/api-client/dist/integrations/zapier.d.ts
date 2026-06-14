import { Integration, IntegrationType, IntegrationConfig } from './types.js';
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
     * Disconnect from Zapier
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Zapier action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
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
    /**
     * Execute a Natural Language Actions (NLA) action
     * This is available if the integration has NLA enabled
     */
    private executeNLAAction;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Zapier integration
 */
export declare function createZapierIntegration(config?: Partial<ZapierConfig>): ZapierIntegration;
//# sourceMappingURL=zapier.d.ts.map