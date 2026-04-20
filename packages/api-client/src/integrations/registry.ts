import { IntegrationConfig, Integration, IntegrationType } from './types.js';

/**
 * Registry for managing external service integrations
 */
export class IntegrationRegistry {
  private integrations: Map<string, Integration> = new Map();
  
  /**
   * Register a new integration
   */
  registerIntegration(integration: Integration): void {
    this.integrations.set(integration.id, integration);
  }
  
  /**
   * Get an integration by ID
   */
  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }
  
  /**
   * Get all integrations
   */
  getAllIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }
  
  /**
   * Get integrations by type
   */
  getIntegrationsByType(type: IntegrationType): Integration[] {
    return Array.from(this.integrations.values())
      .filter(integration => integration.type === type);
  }
  
  /**
   * Check if an integration exists
   */
  hasIntegration(id: string): boolean {
    return this.integrations.has(id);
  }
  
  /**
   * Remove an integration
   */
  removeIntegration(id: string): boolean {
    return this.integrations.delete(id);
  }
  
  /**
   * Get integrations count
   */
  getIntegrationsCount(): number {
    return this.integrations.size;
  }
}