import { Integration, IntegrationType } from './types';
/**
 * Registry for managing external service integrations
 */
export declare class IntegrationRegistry {
    private integrations;
    /**
     * Register a new integration
     */
    registerIntegration(integration: Integration): void;
    /**
     * Get an integration by ID
     */
    getIntegration(id: string): Integration | undefined;
    /**
     * Get all integrations
     */
    getAllIntegrations(): Integration[];
    /**
     * Get integrations by type
     */
    getIntegrationsByType(type: IntegrationType): Integration[];
    /**
     * Check if an integration exists
     */
    hasIntegration(id: string): boolean;
    /**
     * Remove an integration
     */
    removeIntegration(id: string): boolean;
    /**
     * Get integrations count
     */
    getIntegrationsCount(): number;
}
//# sourceMappingURL=registry.d.ts.map