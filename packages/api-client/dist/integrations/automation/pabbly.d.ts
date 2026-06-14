import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
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
     * Connect to Pabbly Connect API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Pabbly Connect
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Pabbly Connect action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
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
     * Get workflow execution history
     */
    private getWorkflowExecutionHistory;
    /**
     * Get available actions for an app
     */
    private getAppActions;
    /**
     * Get available triggers for an app
     */
    private getAppTriggers;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Pabbly Connect integration
 */
export declare function createPabblyIntegration(config?: Partial<PabblyConfig>): PabblyIntegration;
//# sourceMappingURL=pabbly.d.ts.map