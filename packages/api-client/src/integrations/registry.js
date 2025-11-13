/**
 * Registry for managing external service integrations
 */
export class IntegrationRegistry {
    integrations = new Map();
    /**
     * Register a new integration
     */
    registerIntegration(integration) {
        this.integrations.set(integration.id, integration);
    }
    /**
     * Get an integration by ID
     */
    getIntegration(id) {
        return this.integrations.get(id);
    }
    /**
     * Get all integrations
     */
    getAllIntegrations() {
        return Array.from(this.integrations.values());
    }
    /**
     * Get integrations by type
     */
    getIntegrationsByType(type) {
        return Array.from(this.integrations.values())
            .filter(integration => integration.type === type);
    }
    /**
     * Check if an integration exists
     */
    hasIntegration(id) {
        return this.integrations.has(id);
    }
    /**
     * Remove an integration
     */
    removeIntegration(id) {
        return this.integrations.delete(id);
    }
    /**
     * Get integrations count
     */
    getIntegrationsCount() {
        return this.integrations.size;
    }
}
//# sourceMappingURL=registry.js.map