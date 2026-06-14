import { Integration, IntegrationType, IntegrationConfig } from '../types.js';
/**
 * Make.com integration configuration
 */
export interface MakeConfig extends IntegrationConfig {
    apiKey?: string;
    organizationId?: string;
    teamId?: string;
    workspaceId?: string;
}
/**
 * Make.com integration for workflow automation
 */
export declare class MakeIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: MakeConfig;
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
    constructor(config: MakeConfig);
    /**
     * Connect to Make API
     */
    connect(): Promise<boolean>;
    /**
     * Disconnect from Make
     */
    disconnect(): Promise<boolean>;
    /**
     * Execute a Make action
     */
    execute(action: string, params: Record<string, any>): Promise<any>;
    /**
     * List scenarios in a team
     */
    private listScenarios;
    /**
     * Get a specific scenario
     */
    private getScenario;
    /**
     * Run a specific scenario
     */
    private runScenario;
    /**
     * Create a new scenario
     */
    private createScenario;
    /**
     * Update a scenario
     */
    private updateScenario;
    /**
     * Delete a scenario
     */
    private deleteScenario;
    /**
     * List connections in a team
     */
    private listConnections;
    /**
     * Get a specific connection
     */
    private getConnection;
    /**
     * Create a new connection
     */
    private createConnection;
    /**
     * Update a connection
     */
    private updateConnection;
    /**
     * Delete a connection
     */
    private deleteConnection;
    /**
     * Get scenario execution history
     */
    private getScenarioExecutionHistory;
    /**
     * List organizations
     */
    private listOrganizations;
    /**
     * List teams in an organization
     */
    private listTeams;
    /**
     * List data stores in a team
     */
    private listDataStores;
    /**
     * Get a specific data store
     */
    private getDataStore;
    /**
     * List records in a data store
     */
    private listDataStoreRecords;
    /**
     * Create a record in a data store
     */
    private createDataStoreRecord;
    /**
     * Update a record in a data store
     */
    private updateDataStoreRecord;
    /**
     * Delete a record from a data store
     */
    private deleteDataStoreRecord;
    /**
     * Create a webhook for a scenario
     */
    private createWebhook;
    /**
     * List webhooks for a scenario
     */
    private listWebhooks;
    /**
     * Delete a webhook
     */
    private deleteWebhook;
    /**
     * Get metadata about this integration
     */
    getMetadata(): Promise<Record<string, any>>;
}
/**
 * Create a new Make integration
 */
export declare function createMakeIntegration(config?: Partial<MakeConfig>): MakeIntegration;
//# sourceMappingURL=make.d.ts.map