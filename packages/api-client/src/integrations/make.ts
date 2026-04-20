import { ApiClient } from '../core/ApiClient.js';
import { ApiConfig } from '../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from './types.js';

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
export class MakeIntegration implements Integration {
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
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  
  private apiClient: ApiClient;
  
  constructor(config: MakeConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default Make capabilities
    this.capabilities = {
      actions: [
        'list_scenarios',
        'run_scenario',
        'create_scenario',
        'list_connections',
        'get_scenario_execution_history',
        'list_organizations',
        'list_teams'
      ],
      triggers: [
        'scenario_started',
        'scenario_completed',
        'scenario_error',
        'data_store_updated'
      ],
      supportsWebhooks: true,
      supportsPolling: true,
      supportsCustomFields: true
    };
    
    // Create API client for Make
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || '',
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json'
      }
    };
    
    // Add API key if provided
    if (config.apiKey) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'Authorization': `Token ${config.apiKey}`
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to Make API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify API key by making a test request
      const result = await this.apiClient.get('/api/v2/users/me');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to Make: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from Make
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a Make action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Make. Call connect() first.');
    }
    
    switch (action) {
      case 'list_scenarios':
        return this.listScenarios(params.teamId || this.config.teamId);
      case 'run_scenario':
        return this.runScenario(params.scenarioId, params.data);
      case 'get_scenario':
        return this.getScenario(params.scenarioId);
      case 'list_organizations':
        return this.listOrganizations();
      case 'list_teams':
        return this.listTeams(params.organizationId || this.config.organizationId);
      case 'create_webhook':
        return this.createWebhook(params.scenarioId, params.hookUrl);
      default:
        throw new Error(`Unsupported Make action: ${action}`);
    }
  }
  
  /**
   * List scenarios in a team
   */
  private async listScenarios(teamId?: string): Promise<any> {
    if (!teamId) {
      throw new Error('Team ID is required for listing scenarios');
    }
    
    try {
      return await this.apiClient.get(`/api/v2/scenarios?teamId=${teamId}`);
    } catch (error) {
      throw new Error(`Failed to list scenarios: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a specific scenario
   */
  private async getScenario(scenarioId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/v2/scenarios/${scenarioId}`);
    } catch (error) {
      throw new Error(`Failed to get scenario: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Run a specific scenario
   */
  private async runScenario(scenarioId: string, data?: any): Promise<any> {
    try {
      return await this.apiClient.post(`/api/v2/scenarios/${scenarioId}/run`, data || {});
    } catch (error) {
      throw new Error(`Failed to run scenario: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List organizations
   */
  private async listOrganizations(): Promise<any> {
    try {
      return await this.apiClient.get('/api/v2/organizations');
    } catch (error) {
      throw new Error(`Failed to list organizations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List teams in an organization
   */
  private async listTeams(organizationId?: string): Promise<any> {
    if (!organizationId) {
      throw new Error('Organization ID is required for listing teams');
    }
    
    try {
      return await this.apiClient.get(`/api/v2/teams?organizationId=${organizationId}`);
    } catch (error) {
      throw new Error(`Failed to list teams: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a webhook for a scenario
   */
  private async createWebhook(scenarioId: string, hookUrl: string): Promise<any> {
    try {
      return await this.apiClient.post(`/api/v2/hooks`, {
        scenarioId,
        url: hookUrl
      });
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get metadata about this integration
   */
  async getMetadata(): Promise<Record<string, any>> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt
    };
  }
}

/**
 * Create a new Make integration
 */
export function createMakeIntegration(config: Partial<MakeConfig> = {}): MakeIntegration {
  const defaultConfig: MakeConfig = {
    id: 'make',
    name: 'Make',
    type: IntegrationType.AUTOMATION,
    description: 'Connect and automate apps with Make (formerly Integromat)',
    baseUrl: 'https://api.make.com',
    authType: AuthType.API_KEY,
    webhookSupport: true,
    apiVersion: 'v2',
    docUrl: 'https://www.make.com/en/api-documentation',
    logoUrl: 'https://images.ctfassets.net/qqlj6g4ee76j/687aa1dtTqo7cAPKFGOXi/549c8c65ab14f3dd266c3a4c8b5a9300/Make-Logo-RGB-Dark.svg'
  };
  
  return new MakeIntegration({
    ...defaultConfig,
    ...config
  });
}