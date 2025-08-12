/**
 * Pabbly integration for The New Fuse
 * Provides connection to Pabbly Connect and other Pabbly services
 */
import { Injectable, Logger } from '@nestjs/common';
import { ExternalApiService } from '../ExternalApiService';

export interface PabblyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface PabblyWorkflow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  triggers: any[];
  actions: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PabblyConnection {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  lastUsed?: string;
}

@Injectable()
export class PabblyIntegration {
  private readonly logger = new Logger(PabblyIntegration.name);
  private apiService: ExternalApiService;
  private config: PabblyConfig;
  private readonly baseUrl = 'https://connect.pabbly.com/api/v1';

  constructor(config: PabblyConfig) {
    this.config = config;
    this.apiService = new ExternalApiService({
      baseURL: config.baseUrl || this.baseUrl,
      timeout: config.timeout || 30000,
      headers: unknown;
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getWorkflows(): Promise<PabblyWorkflow[]> {
    try {
      this.logger.debug('Fetching Pabbly workflows');
      const response = await this.apiService.get('/workflows');
      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch workflows', error);
      throw error;
    }
  }

  async getWorkflow(workflowId: string): Promise<PabblyWorkflow> {
    try {
      this.logger.debug(`Fetching workflow: ${workflowId}`);
      const response = await this.apiService.get(`/workflows/${workflowId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch workflow ${workflowId}`, error);
      throw error;
    }
  }

  async createWorkflow(workflow: Partial<PabblyWorkflow>): Promise<PabblyWorkflow> {
    try {
      this.logger.debug('Creating new workflow');
      const response = await this.apiService.post('/workflows', workflow);
      return response;
    } catch (error) {
      this.logger.error('Failed to create workflow', error);
      throw error;
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<PabblyWorkflow>): Promise<PabblyWorkflow> {
    try {
      this.logger.debug(`Updating workflow: ${workflowId}`);
      const response = await this.apiService.put(`/workflows/${workflowId}`, updates);
      return response;
    } catch (error) {
      this.logger.error(`Failed to update workflow ${workflowId}`, error);
      throw error;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting workflow: ${workflowId}`);
      await this.apiService.delete(`/workflows/${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to delete workflow ${workflowId}`, error);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string, data?: any): Promise<any> {
    try {
      this.logger.debug(`Executing workflow: ${workflowId}`);
      const response = await this.apiService.post(`/workflows/${workflowId}/execute`, data || {});
      return response;
    } catch (error) {
      this.logger.error(`Failed to execute workflow ${workflowId}`, error);
      throw error;
    }
  }

  async getConnections(): Promise<PabblyConnection[]> {
    try {
      this.logger.debug('Fetching Pabbly connections');
      const response = await this.apiService.get('/connections');
      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch connections', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.apiService.get('/auth/verify', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.error('Pabbly connection test failed', error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<PabblyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiKey) {
      this.apiService.updateConfig({
        headers: { 'Authorization': `Bearer ${newConfig.apiKey}` }
      });
    }
    
    if (newConfig.baseUrl) {
      this.apiService.updateConfig({ baseURL: newConfig.baseUrl });
    }
    
    if (newConfig.timeout) {
      this.apiService.updateConfig({ timeout: newConfig.timeout });
    }
  }
}