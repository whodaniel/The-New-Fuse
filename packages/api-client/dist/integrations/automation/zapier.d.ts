import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
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
    /**
     * Connect to Zapier API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Zapier API
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Zapier action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * List user's Zaps
     */
    private listZaps;
    /**
     * Get a specific Zap
     */
    private getZap;
    /**
     * Toggle a Zap on or off
     */
    private toggleZap;
    /**
     * List available apps
     */
    private listApps;
    /**
     * List triggers for an app
     */
    private listTriggers;
    /**
     * List actions for an app
     */
    private listActions;
    /**
     * List searches for an app
     */
    private listSearches;
    /**
     * Execute a Zap with data
     */
    private executeZap;
    /**
     * Create a webhook for a Zap
     */
    private createWebhook;
    /**
     * List webhooks for a Zap
     */
    private listWebhooks;
    /**
     * Delete a webhook
     */
    private deleteWebhook;
    /**
     * Make a Natural Language Actions (NLA) request
     */
    private nlaRequest;
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