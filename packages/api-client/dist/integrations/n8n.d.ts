import { Integration, IntegrationType, IntegrationConfig } from './types.js';
/**
 * n8n integration configuration
 */
export interface N8nConfig extends IntegrationConfig {
    apiKey?: string;
    instanceUrl: string;
}
/**
 * n8n integration for accessing n8n's API
 */
export declare class N8nIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: N8nConfig;
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
    constructor(config: N8nConfig);
    /**
     * Connect to n8n API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from n8n
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a n8n action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * List workflows
     */
    private listWorkflows;
    /**
     * Get a specific workflow
     */
    private getWorkflow;
    /**
     * Activate a workflow
     */
    private activateWorkflow;
    /**
     * Deactivate a workflow
     */
    private deactivateWorkflow;
    /**
     * Execute a workflow
     */
    private executeWorkflow;
    /**
     * Get workflow executions
     */
    private getExecutions;
    /**
     * List credentials
     */
    private listCredentials;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new n8n integration
 */
export declare function createN8nIntegration(config?: Partial<N8nConfig>): N8nIntegration;
//# sourceMappingURL=n8n.d.ts.map