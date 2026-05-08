// Import required API client and types
import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';

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
        'get_scenario',
        'run_scenario',
        'create_scenario',
        'update_scenario',
        'delete_scenario',
        'list_connections',
        'get_connection',
        'create_connection',
        'update_connection',
        'delete_connection',
        'get_scenario_execution_history',
        'list_organizations',
        'list_teams',
        'list_data_stores',
        'get_data_store',
        'list_data_store_records',
        'create_data_store_record',
        'update_data_store_record',
        'delete_data_store_record',
        'create_webhook',
        'list_webhooks',
        'delete_webhook'
      ],
      triggers: [
        'scenario_started',
        'scenario_completed',
        'scenario_error',
        'data_store_updated',
        'webhook_received'
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
      case 'get_scenario':
        return this.getScenario(params.scenarioId);
      case 'run_scenario':
        return this.runScenario(params.scenarioId, params.data);
      case 'create_scenario':
        return this.createScenario(params.teamId || this.config.teamId, params.name, params.blueprint);
      case 'update_scenario':
        return this.updateScenario(params.scenarioId, params.data);
      case 'delete_scenario':
        return this.deleteScenario(params.scenarioId);
      case 'list_connections':
        return this.listConnections(params.teamId || this.config.teamId);
      case 'get_connection':
        return this.getConnection(params.connectionId);
      case 'create_connection':
        return this.createConnection(params.teamId || this.config.teamId, params.appId, params.name, params.data);
      case 'update_connection':
        return this.updateConnection(params.connectionId, params.data);
      case 'delete_connection':
        return this.deleteConnection(params.connectionId);
      case 'get_scenario_execution_history':
        return this.getScenarioExecutionHistory(params.scenarioId, params.options);
      case 'list_organizations':
        return this.listOrganizations();
      case 'list_teams':
        return this.listTeams(params.organizationId || this.config.organizationId);
      case 'list_data_stores':
        return this.listDataStores(params.teamId || this.config.teamId);
      case 'get_data_store':
        return this.getDataStore(params.dataStoreId);
      case 'list_data_store_records':
        return this.listDataStoreRecords(params.dataStoreId, params.options);
      case 'create_data_store_record':
        return this.createDataStoreRecord(params.dataStoreId, params.data);
      case 'update_data_store_record':
        return this.updateDataStoreRecord(params.dataStoreId, params.recordId, params.data);
      case 'delete_data_store_record':
        return this.deleteDataStoreRecord(params.dataStoreId, params.recordId);
      case 'create_webhook':
        return this.createWebhook(params.scenarioId, params.hookUrl);
      case 'list_webhooks':
        return this.listWebhooks(params.scenarioId);
      case 'delete_webhook':
        return this.deleteWebhook(params.webhookId);
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
   * Create a new scenario
   */
  private async createScenario(teamId: string, name: string, blueprint?: any): Promise<any> {
    try {
      const payload: any = {
        name,
        teamId
      };
      
      if (blueprint) {
        payload.blueprint = blueprint;
      }
      
      return await this.apiClient.post('/api/v2/scenarios', payload);
    } catch (error) {
      throw new Error(`Failed to create scenario: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update a scenario
   */
  private async updateScenario(scenarioId: string, data: any): Promise<any> {
    try {
      return await this.apiClient.patch(`/api/v2/scenarios/${scenarioId}`, data);
    } catch (error) {
      throw new Error(`Failed to update scenario: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a scenario
   */
  private async deleteScenario(scenarioId: string): Promise<any> {
    try {
      return await this.apiClient.delete(`/api/v2/scenarios/${scenarioId}`);
    } catch (error) {
      throw new Error(`Failed to delete scenario: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List connections in a team
   */
  private async listConnections(teamId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/v2/connections?teamId=${teamId}`);
    } catch (error) {
      throw new Error(`Failed to list connections: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a specific connection
   */
  private async getConnection(connectionId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/v2/connections/${connectionId}`);
    } catch (error) {
      throw new Error(`Failed to get connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a new connection
   */
  private async createConnection(teamId: string, appId: string, name: string, data: any): Promise<any> {
    try {
      return await this.apiClient.post('/api/v2/connections', {
        teamId,
        appId,
        name,
        ...data
      });
    } catch (error) {
      throw new Error(`Failed to create connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update a connection
   */
  private async updateConnection(connectionId: string, data: any): Promise<any> {
    try {
      return await this.apiClient.patch(`/api/v2/connections/${connectionId}`, data);
    } catch (error) {
      throw new Error(`Failed to update connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a connection
   */
  private async deleteConnection(connectionId: string): Promise<any> {
    try {
      return await this.apiClient.delete(`/api/v2/connections/${connectionId}`);
    } catch (error) {
      throw new Error(`Failed to delete connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get scenario execution history
   */
  private async getScenarioExecutionHistory(scenarioId: string, options: any = {}): Promise<any> {
    try {
      let url = `/api/v2/scenarios/${scenarioId}/executions`;
      
      // Add query parameters
      if (options) {
        const params = new URLSearchParams();
        
        if (options.limit) {
          params.append('limit', options.limit.toString());
        }
        
        if (options.offset) {
          params.append('offset', options.offset.toString());
        }
        
        if (options.sort) {
          params.append('sort', options.sort);
        }
        
        if (options.filter) {
          params.append('filter', JSON.stringify(options.filter));
        }
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      return await this.apiClient.get(url);
    } catch (error) {
      throw new Error(`Failed to get scenario execution history: ${error instanceof Error ? error.message : String(error)}`);
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
   * List data stores in a team
   */
  private async listDataStores(teamId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/v2/data-stores?teamId=${teamId}`);
    } catch (error) {
      throw new Error(`Failed to list data stores: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a specific data store
   */
  private async getDataStore(dataStoreId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/v2/data-stores/${dataStoreId}`);
    } catch (error) {
      throw new Error(`Failed to get data store: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List records in a data store
   */
  private async listDataStoreRecords(dataStoreId: string, options: any = {}): Promise<any> {
    try {
      let url = `/api/v2/data-stores/${dataStoreId}/records`;
      
      // Add query parameters
      if (options) {
        const params = new URLSearchParams();
        
        if (options.limit) {
          params.append('limit', options.limit.toString());
        }
        
        if (options.offset) {
          params.append('offset', options.offset.toString());
        }
        
        if (options.sort) {
          params.append('sort', options.sort);
        }
        
        if (options.filter) {
          params.append('filter', JSON.stringify(options.filter));
        }
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      return await this.apiClient.get(url);
    } catch (error) {
      throw new Error(`Failed to list data store records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a record in a data store
   */
  private async createDataStoreRecord(dataStoreId: string, data: any): Promise<any> {
    try {
      return await this.apiClient.post(`/api/v2/data-stores/${dataStoreId}/records`, data);
    } catch (error) {
      throw new Error(`Failed to create data store record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update a record in a data store
   */
  private async updateDataStoreRecord(dataStoreId: string, recordId: string, data: any): Promise<any> {
    try {
      return await this.apiClient.patch(`/api/v2/data-stores/${dataStoreId}/records/${recordId}`, data);
    } catch (error) {
      throw new Error(`Failed to update data store record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a record from a data store
   */
  private async deleteDataStoreRecord(dataStoreId: string, recordId: string): Promise<any> {
    try {
      return await this.apiClient.delete(`/api/v2/data-stores/${dataStoreId}/records/${recordId}`);
    } catch (error) {
      throw new Error(`Failed to delete data store record: ${error instanceof Error ? error.message : String(error)}`);
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
   * List webhooks for a scenario
   */
  private async listWebhooks(scenarioId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/v2/hooks?scenarioId=${scenarioId}`);
    } catch (error) {
      throw new Error(`Failed to list webhooks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a webhook
   */
  private async deleteWebhook(webhookId: string): Promise<any> {
    try {
      return await this.apiClient.delete(`/api/v2/hooks/${webhookId}`);
    } catch (error) {
      throw new Error(`Failed to delete webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get metadata about this integration
   */
  async getMetadata(): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {
      id: this.id,
      name: this.name,
      type: this.type,
      capabilities: this.capabilities,
      isConnected: this.isConnected,
      isEnabled: this.isEnabled,
      lastUpdated: this.updatedAt
    };
    
    if (this.isConnected) {
      try {
        if (this.config.teamId) {
          metadata.scenarios = await this.listScenarios(this.config.teamId);
        }
        
        if (this.config.organizationId) {
          metadata.teams = await this.listTeams(this.config.organizationId);
        }
        
        metadata.organizations = await this.listOrganizations();
      } catch (error) {
        metadata.error = error instanceof Error ? error.message : String(error);
      }
    }
    
    return metadata;
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