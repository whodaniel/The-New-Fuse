import { Integration, IntegrationType, IntegrationConfig } from './types.js';
/**
 * Make.com integration configuration
 */
export interface MakeConfig extends IntegrationConfig {
    apiKey?: string;
    organizationId?: string;
    teamId?: string;
}
/**
 * Make.com integration for accessing Make's API
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
     * List organizations
     */
    private listOrganizations;
    /**
     * List teams in an organization
     */
    private listTeams;
    /**
     * Create a webhook for a scenario
     */
    private createWebhook;
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