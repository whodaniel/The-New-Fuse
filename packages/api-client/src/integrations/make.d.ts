import { Integration, IntegrationType, IntegrationConfig } from './types';
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
     * List scenarios in a team
     */
    private listScenarios;
}
/**
 * Create a new Make integration
 */
export declare function createMakeIntegration(config?: Partial<MakeConfig>): MakeIntegration;
//# sourceMappingURL=make.d.ts.map