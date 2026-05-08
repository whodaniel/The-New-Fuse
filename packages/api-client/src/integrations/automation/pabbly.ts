import { ApiClient } from '../../core/ApiClient.js';
import { ApiConfig } from '../../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from '../types.js';

/**
 * Pabbly Connect integration configuration
 */
export interface PabblyConfig extends IntegrationConfig {
  apiKey?: string;
  email?: string;
}

/**
 * Pabbly Connect integration for workflow automation
 */
export class PabblyIntegration implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: PabblyConfig;
  capabilities: {
    actions: string[];
    triggers?: string[];
    supportsWebhooks: boolean;
    supportsPolling: boolean;
  };
  isConnected: boolean = false;
  isEnabled: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
  
  private apiClient: ApiClient;
  
  constructor(config: PabblyConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default Pabbly capabilities
    this.capabilities = {
      actions: [
        'list_workflows',
        'execute_workflow',
        'get_workflow_details',
        'create_workflow',
        'list_apps',
        'get_workflow_execution_history',
        'get_app_actions',
        'get_app_triggers'
      ],
      triggers: [
        'workflow_started',
        'workflow_completed',
        'workflow_error'
      ],
      supportsWebhooks: true,
      supportsPolling: true
    };
    
    // Create API client for Pabbly Connect
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
        'Authorization': `Bearer ${config.apiKey}`
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to Pabbly Connect API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify credentials by making a test request
      const result = await this.apiClient.get('/api/workflows');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to Pabbly Connect: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from Pabbly Connect
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a Pabbly Connect action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Pabbly Connect. Call connect() first.');
    }
    
    switch (action) {
      case 'list_workflows':
        return this.listWorkflows();
      case 'execute_workflow':
        return this.executeWorkflow(params.workflowId, params.data);
      case 'get_workflow_details':
        return this.getWorkflowDetails(params.workflowId);
      case 'create_workflow':
        return this.createWorkflow(params.workflow);
      case 'list_apps':
        return this.listApps();
      case 'get_workflow_execution_history':
        return this.getWorkflowExecutionHistory(params.workflowId);
      case 'get_app_actions':
        return this.getAppActions(params.appId);
      case 'get_app_triggers':
        return this.getAppTriggers(params.appId);
      default:
        throw new Error(`Unsupported Pabbly Connect action: ${action}`);
    }
  }
  
  /**
   * List workflows
   */
  private async listWorkflows(): Promise<any> {
    try {
      return await this.apiClient.get('/api/workflows');
    } catch (error) {
      throw new Error(`Failed to list workflows: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a workflow
   */
  private async executeWorkflow(workflowId: string, data?: any): Promise<any> {
    try {
      return await this.apiClient.post(`/api/workflows/${workflowId}/execute`, data || {});
    } catch (error) {
      throw new Error(`Failed to execute workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get workflow details
   */
  private async getWorkflowDetails(workflowId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/workflows/${workflowId}`);
    } catch (error) {
      throw new Error(`Failed to get workflow details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a workflow
   */
  private async createWorkflow(workflow: any): Promise<any> {
    try {
      return await this.apiClient.post('/api/workflows', workflow);
    } catch (error) {
      throw new Error(`Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List available apps/integrations
   */
  private async listApps(): Promise<any> {
    try {
      return await this.apiClient.get('/api/apps');
    } catch (error) {
      throw new Error(`Failed to list apps: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get workflow execution history
   */
  private async getWorkflowExecutionHistory(workflowId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/workflows/${workflowId}/executions`);
    } catch (error) {
      throw new Error(`Failed to get workflow execution history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get available actions for an app
   */
  private async getAppActions(appId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/apps/${appId}/actions`);
    } catch (error) {
      throw new Error(`Failed to get app actions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get available triggers for an app
   */
  private async getAppTriggers(appId: string): Promise<any> {
    try {
      return await this.apiClient.get(`/api/apps/${appId}/triggers`);
    } catch (error) {
      throw new Error(`Failed to get app triggers: ${error instanceof Error ? error.message : String(error)}`);
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
 * Create a new Pabbly Connect integration
 */
export function createPabblyIntegration(config: Partial<PabblyConfig> = {}): PabblyIntegration {
  const defaultConfig: PabblyConfig = {
    id: 'pabbly',
    name: 'Pabbly Connect',
    type: IntegrationType.AUTOMATION,
    description: 'Affordable workflow automation platform connecting various applications',
    baseUrl: 'https://connect.pabbly.com',
    authType: AuthType.API_KEY,
    webhookSupport: true,
    apiVersion: 'v1',
    docUrl: 'https://connect.pabbly.com/api-docs',
    logoUrl: 'https://pabbly.com/wp-content/uploads/2022/12/connect_blue_square_icon.svg'
  };
  
  return new PabblyIntegration({
    ...defaultConfig,
    ...config
  });
}