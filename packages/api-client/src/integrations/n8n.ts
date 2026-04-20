import { ApiClient } from '../core/ApiClient.js';
import { ApiConfig } from '../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from './types.js';

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
export class N8nIntegration implements Integration {
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
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  
  private apiClient: ApiClient;
  
  constructor(config: N8nConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default n8n capabilities
    this.capabilities = {
      actions: [
        'list_workflows',
        'get_workflow',
        'activate_workflow',
        'deactivate_workflow',
        'execute_workflow',
        'get_executions',
        'list_credentials'
      ],
      triggers: [
        'workflow_started',
        'workflow_completed',
        'workflow_failed'
      ],
      supportsWebhooks: true,
      supportsPolling: true,
      supportsCustomFields: true
    };
    
    // Create API client for n8n
    const apiConfig: ApiConfig = {
      baseURL: config.instanceUrl.endsWith('/') ? config.instanceUrl : `${config.instanceUrl}/`,
      headers: {
        ...config.defaultHeaders,
        'Content-Type': 'application/json'
      }
    };
    
    // Add API key if provided
    if (config.apiKey) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'X-N8N-API-KEY': config.apiKey
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to n8n API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify API key by making a test request
      const result = await this.apiClient.get('api/v1/workflows');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to n8n: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from n8n
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a n8n action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to n8n. Call connect() first.');
    }
    
    switch (action) {
      case 'list_workflows':
        return this.listWorkflows();
      case 'get_workflow':
        return this.getWorkflow(params.workflowId);
      case 'activate_workflow':
        return this.activateWorkflow(params.workflowId);
      case 'deactivate_workflow':
        return this.deactivateWorkflow(params.workflowId);
      case 'execute_workflow':
        return this.executeWorkflow(params.workflowId, params.data);
      case 'get_executions':
        return this.getExecutions(params.workflowId);
      case 'list_credentials':
        return this.listCredentials();
      default:
        throw new Error(`Unsupported n8n action: ${action}`);
    }
  }
  
  /**
   * List workflows
   */
  private async listWorkflows(): Promise<any> {
    try {
      return await this.apiClient.get('api/v1/workflows');
    } catch (error) {
      throw new Error(`Failed to list workflows: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a specific workflow
   */
  private async getWorkflow(workflowId: string): Promise<any> {
    try {
      return await this.apiClient.get(`api/v1/workflows/${workflowId}`);
    } catch (error) {
      throw new Error(`Failed to get workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Activate a workflow
   */
  private async activateWorkflow(workflowId: string): Promise<any> {
    try {
      return await this.apiClient.post(`api/v1/workflows/${workflowId}/activate`);
    } catch (error) {
      throw new Error(`Failed to activate workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Deactivate a workflow
   */
  private async deactivateWorkflow(workflowId: string): Promise<any> {
    try {
      return await this.apiClient.post(`api/v1/workflows/${workflowId}/deactivate`);
    } catch (error) {
      throw new Error(`Failed to deactivate workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a workflow
   */
  private async executeWorkflow(workflowId: string, data?: any): Promise<any> {
    try {
      return await this.apiClient.post(`api/v1/workflows/${workflowId}/execute`, data || {});
    } catch (error) {
      throw new Error(`Failed to execute workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get workflow executions
   */
  private async getExecutions(workflowId: string): Promise<any> {
    try {
      return await this.apiClient.get(`api/v1/executions?workflowId=${workflowId}`);
    } catch (error) {
      throw new Error(`Failed to get executions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List credentials
   */
  private async listCredentials(): Promise<any> {
    try {
      return await this.apiClient.get('api/v1/credentials');
    } catch (error) {
      throw new Error(`Failed to list credentials: ${error instanceof Error ? error.message : String(error)}`);
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
 * Create a new n8n integration
 */
export function createN8nIntegration(config: Partial<N8nConfig> = {}): N8nIntegration {
  const defaultConfig: N8nConfig = {
    id: 'n8n',
    name: 'n8n',
    type: IntegrationType.AUTOMATION,
    description: 'Open-source workflow automation tool with fair-code distribution',
    baseUrl: config.instanceUrl || 'http://localhost:5678',
    instanceUrl: config.instanceUrl || 'http://localhost:5678',
    authType: AuthType.API_KEY,
    webhookSupport: true,
    apiVersion: 'v1',
    docUrl: 'https://docs.n8n.io/api/',
    logoUrl: 'https://n8n.io/favicon.ico'
  };
  
  return new N8nIntegration({
    ...defaultConfig,
    ...config
  });
}