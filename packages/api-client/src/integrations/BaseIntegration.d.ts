import { Integration, IntegrationType, IntegrationConfig } from "./types";
/**
 * Base integration class that implements common functionality
 */
export declare abstract class BaseIntegration implements Integration {
    id: string;
    name: string;
    type: IntegrationType;
    description?: string;
    config: IntegrationConfig;
    capabilities: {
        actions: string[];
        triggers?: string[];
        [key: string]: any;
    };
    isConnected: boolean;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    constructor(id: string, name: string, type: IntegrationType, config: IntegrationConfig, description?: string, capabilities?: Partial<{
        actions: string[];
        triggers?: string[];
        [key: string]: any;
    }>);
    /**
     * Connect to the integration
     */
    abstract connect(): Promise<boolean>;
    /**
     * Disconnect from the integration
     */
    abstract disconnect(): Promise<boolean>;
    /**
     * Execute an action
     */
    abstract execute(action: string, params?: Record<string, any>): Promise<any>;
    /**
     * Get metadata
     */
    abstract getMetadata(): Promise<Record<string, any>>;
    /**
     * Update the last modified timestamp
     */
    protected updateTimestamp(): void;
}
export { IntegrationType } from "./types";
//# sourceMappingURL=BaseIntegration.d.ts.map