import { Integration, IntegrationType, IntegrationConfig } from '../types';
/**
 * Pabbly Connect integration configuration
 */
export interface PabblyConfig extends IntegrationConfig {
    apiKey?: string;
    email?: string;
}
/**
 * Pabbly Connect integration for workflow automation
 */
export declare class PabblyIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: PabblyConfig;
    capabilities: {
        actions: string[];
        triggers?: string[];
        supportsWebhooks: boolean;
        supportsPolling: boolean;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    private apiClient;
    constructor(config: PabblyConfig);
    /**
     * List workflows
     */
    private listWorkflows;
    /**
     * Execute a workflow
     */
    private executeWorkflow;
    /**
     * Get workflow details
     */
    private getWorkflowDetails;
    /**
     * Create a workflow
     */
    private createWorkflow;
    /**
     * List available apps/integrations
     */
    private listApps;
    /**
     * Get available actions for an app
     */
    private getAppActions;
}
//# sourceMappingURL=pabbly.d.ts.map