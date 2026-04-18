import { ApiClient } from '../core/ApiClient.js';
import { ApiConfig } from '../config/ApiConfig.js';
import { Integration, IntegrationType, IntegrationConfig, AuthType } from './types.js';

/**
 * Zapier integration configuration
 */
export interface ZapierConfig extends IntegrationConfig {
  apiKey?: string;
  nlaEnabled?: boolean;
}

/**
 * Zapier integration for accessing Zapier's API
 */
export class ZapierIntegration implements Integration {
  id: string;
  name: string;
  type: IntegrationType;
  description?: string;
  config: ZapierConfig;
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
  
  constructor(config: ZapierConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.description = config.description;
    this.config = config;
    
    // Default Zapier capabilities
    this.capabilities = {
      actions: [
        'create_zap',
        'run_zap',
        'toggle_zap',
        'get_zap_history',
        'list_apps',
        'list_triggers',
        'list_actions'
      ],
      triggers: [
        'zap_ran',
        'zap_succeeded',
        'zap_failed'
      ],
      supportsWebhooks: true,
      supportsPolling: true,
      supportsCustomFields: true
    };
    
    // Create API client for Zapier
    const apiConfig: ApiConfig = {
      baseURL: config.baseUrl || '',
      headers: {
        ...config.defaultHeaders
      }
    };
    
    // Add API key if provided
    if (config.apiKey) {
      apiConfig.headers = {
        ...apiConfig.headers,
        'X-API-Key': config.apiKey
      };
    }
    
    this.apiClient = new ApiClient(apiConfig);
  }
  
  /**
   * Connect to Zapier API
   */
  async connect(): Promise<boolean> {
    try {
      // Verify API key by making a test request
      const result = await this.apiClient.get('/api/v1/apps');
      this.isConnected = true;
      this.updatedAt = new Date();
      return true;
    } catch (error) {
      throw new Error(`Failed to connect to Zapier: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Disconnect from Zapier
   */
  async disconnect(): Promise<boolean> {
    this.isConnected = false;
    this.updatedAt = new Date();
    return true;
  }
  
  /**
   * Execute a Zapier action
   */
  async execute(action: string, params: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Zapier. Call connect() first.');
    }
    
    switch (action) {
      case 'list_apps':
        return this.listApps();
      case 'list_zaps':
        return this.listZaps();
      case 'run_zap':
        return this.runZap(params.zapId, params.inputData);
      case 'create_webhook':
        return this.createWebhook(params.zapId, params.targetUrl);
      case 'nla_action':
        return this.executeNLAAction(params.actionId, params.instructions, params.inputData);
      default:
        throw new Error(`Unsupported Zapier action: ${action}`);
    }
  }
  
  /**
   * List Zapier apps
   */
  private async listApps(): Promise<any> {
    try {
      return await this.apiClient.get('/api/v1/apps');
    } catch (error) {
      throw new Error(`Failed to list Zapier apps: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List user's Zaps
   */
  private async listZaps(): Promise<any> {
    try {
      return await this.apiClient.get('/api/v1/zaps');
    } catch (error) {
      throw new Error(`Failed to list Zaps: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Run a specific Zap
   */
  private async runZap(zapId: string, inputData?: any): Promise<any> {
    try {
      return await this.apiClient.post(`/api/v1/zaps/${zapId}/run`, inputData);
    } catch (error) {
      throw new Error(`Failed to run Zap: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a webhook for a Zap
   */
  private async createWebhook(zapId: string, targetUrl: string): Promise<any> {
    try {
      return await this.apiClient.post(`/api/v1/zaps/${zapId}/webhooks`, {
        targetUrl
      });
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a Natural Language Actions (NLA) action
   * This is available if the integration has NLA enabled
   */
  private async executeNLAAction(actionId: string, instructions: string, inputData?: any): Promise<any> {
    if (!this.config.nlaEnabled) {
      throw new Error('Zapier NLA is not enabled for this integration');
    }
    
    try {
      return await this.apiClient.post(`/v1/nla/actions/${actionId}/execute`, {
        instructions,
        data: inputData
      });
    } catch (error) {
      throw new Error(`Failed to execute NLA action: ${error instanceof Error ? error.message : String(error)}`);
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
 * Create a new Zapier integration
 */
export function createZapierIntegration(config: Partial<ZapierConfig> = {}): ZapierIntegration {
  const defaultConfig: ZapierConfig = {
    id: 'zapier',
    name: 'Zapier',
    type: IntegrationType.AUTOMATION,
    description: 'Connect and automate with 5,000+ apps using Zapier',
    baseUrl: 'https://api.zapier.com',
    authType: AuthType.API_KEY,
    webhookSupport: true,
    apiVersion: 'v1',
    docUrl: 'https://platform.zapier.com/docs/api',
    logoUrl: 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.png',
    nlaEnabled: false
  };
  
  return new ZapierIntegration({
    ...defaultConfig,
    ...config
  });
}