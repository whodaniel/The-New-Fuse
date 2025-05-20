/**
 * Pabbly integration for The New Fuse
 * Provides connection to Pabbly Connect and other Pabbly services
 */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseIntegration } from '../base-integration.js';
import { IntegrationAuthType } from '../integration.types.js';

@Injectable()
export class PabblyIntegration extends BaseIntegration {
  private readonly logger = new Logger(PabblyIntegration.name);
  private readonly baseUrl = 'https://connect.pabbly.com/api/v1';
  
  constructor(private readonly configService: ConfigService) {
    super();
    this.id = 'pabbly';
    this.name = 'Pabbly';
    this.description = 'Connect with Pabbly services for workflow automation, form building, email marketing, and more';
    this.icon = 'https://pabbly.com/wp-content/uploads/2022/04/pabbly-connect-icon.png';
    this.authType = IntegrationAuthType.OAUTH2;
    this.category = 'workflow-automation';
    this.pricing = {
      free: true,
      freeTier: 'Limited workflows and runs per month',
      paidTier: 'Unlimited workflows and higher execution limits'
    };
    this.documentationUrl = 'https://pabbly.com/connect/docs/api-reference/';
  }

  /**
   * Validate OAuth2 credentials
   */
  async validateCredentials(credentials: { 
    accessToken: string; 
    refreshToken?: string;
  }): Promise<boolean> {
    try {
      if (!credentials.accessToken) {
        return false;
      }

      // Check if the token is valid by making a simple API call
      const response = await axios.get(`${this.baseUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return false;
      }
      this.logger.error(`Error validating Pabbly credentials: ${error.message}`);
      return false;
    }
  }

  /**
   * Refresh the access token if expired
   */
  async refreshAccessToken(credentials: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await axios.post('https://connect.pabbly.com/oauth/token', {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token'
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token
      };
    } catch (error) {
      this.logger.error(`Error refreshing Pabbly access token: ${error.message}`);
      throw new HttpException(
        `Failed to refresh Pabbly access token: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get Pabbly user profile
   */
  async getUserProfile(credentials: { accessToken: string }): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting Pabbly user profile: ${error.message}`);
      throw new HttpException(
        `Failed to get Pabbly user profile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all workflows from Pabbly Connect
   */
  async getWorkflows(credentials: { accessToken: string }): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/workflows`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Error getting Pabbly workflows: ${error.message}`);
      throw new HttpException(
        `Failed to get Pabbly workflows: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(credentials: { accessToken: string }, workflowId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/workflows/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.data.data || {};
    } catch (error) {
      this.logger.error(`Error getting Pabbly workflow: ${error.message}`);
      throw new HttpException(
        `Failed to get Pabbly workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a new workflow in Pabbly Connect
   */
  async createWorkflow(
    credentials: { accessToken: string },
    workflowData: { name: string; description?: string }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/workflows`,
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data || {};
    } catch (error) {
      this.logger.error(`Error creating Pabbly workflow: ${error.message}`);
      throw new HttpException(
        `Failed to create Pabbly workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(
    credentials: { accessToken: string },
    workflowId: string,
    workflowData: { name?: string; description?: string; active?: boolean }
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/workflows/${workflowId}`,
        workflowData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data || {};
    } catch (error) {
      this.logger.error(`Error updating Pabbly workflow: ${error.message}`);
      throw new HttpException(
        `Failed to update Pabbly workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(credentials: { accessToken: string }, workflowId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/workflows/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting Pabbly workflow: ${error.message}`);
      throw new HttpException(
        `Failed to delete Pabbly workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutions(
    credentials: { accessToken: string },
    workflowId: string,
    options?: { page?: number; limit?: number }
  ): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/workflows/${workflowId}/executions`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        },
        params: {
          page: options?.page || 1,
          limit: options?.limit || 10
        }
      });

      return response.data || {};
    } catch (error) {
      this.logger.error(`Error getting Pabbly workflow executions: ${error.message}`);
      throw new HttpException(
        `Failed to get Pabbly workflow executions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Trigger a workflow via webhook
   */
  async triggerWorkflow(
    credentials: { accessToken: string },
    workflowId: string,
    data: any
  ): Promise<any> {
    try {
      // First get the webhook URL for this workflow
      const workflowDetails = await this.getWorkflow(credentials, workflowId);
      
      if (!workflowDetails.webhook_url) {
        throw new Error('No webhook URL found for this workflow');
      }

      // Trigger the webhook
      const response = await axios.post(
        workflowDetails.webhook_url,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data || {};
    } catch (error) {
      this.logger.error(`Error triggering Pabbly workflow: ${error.message}`);
      throw new HttpException(
        `Failed to trigger Pabbly workflow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get the list of available apps/integrations in Pabbly Connect
   */
  async getAvailableApps(credentials: { accessToken: string }): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/apps`, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });

      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Error getting Pabbly available apps: ${error.message}`);
      throw new HttpException(
        `Failed to get Pabbly available apps: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get the list of actions available for this integration
   */
  getActions(): any[] {
    return [
      {
        id: 'get_workflows',
        name: 'Get Workflows',
        description: 'Retrieve all workflows from Pabbly Connect',
        inputs: [],
        outputs: [
          {
            name: 'workflows',
            type: 'array',
            description: 'List of workflows'
          }
        ]
      },
      {
        id: 'get_workflow',
        name: 'Get Workflow',
        description: 'Retrieve a specific workflow by ID',
        inputs: [
          {
            name: 'workflowId',
            type: 'string',
            description: 'ID of the workflow to retrieve',
            required: true
          }
        ],
        outputs: [
          {
            name: 'workflow',
            type: 'object',
            description: 'Workflow details'
          }
        ]
      },
      {
        id: 'create_workflow',
        name: 'Create Workflow',
        description: 'Create a new workflow in Pabbly Connect',
        inputs: [
          {
            name: 'name',
            type: 'string',
            description: 'Name of the workflow',
            required: true
          },
          {
            name: 'description',
            type: 'string',
            description: 'Description of the workflow',
            required: false
          }
        ],
        outputs: [
          {
            name: 'workflow',
            type: 'object',
            description: 'Created workflow details'
          }
        ]
      },
      {
        id: 'update_workflow',
        name: 'Update Workflow',
        description: 'Update an existing workflow',
        inputs: [
          {
            name: 'workflowId',
            type: 'string',
            description: 'ID of the workflow to update',
            required: true
          },
          {
            name: 'name',
            type: 'string',
            description: 'New name for the workflow',
            required: false
          },
          {
            name: 'description',
            type: 'string',
            description: 'New description for the workflow',
            required: false
          },
          {
            name: 'active',
            type: 'boolean',
            description: 'Whether the workflow should be active',
            required: false
          }
        ],
        outputs: [
          {
            name: 'workflow',
            type: 'object',
            description: 'Updated workflow details'
          }
        ]
      },
      {
        id: 'delete_workflow',
        name: 'Delete Workflow',
        description: 'Delete a workflow',
        inputs: [
          {
            name: 'workflowId',
            type: 'string',
            description: 'ID of the workflow to delete',
            required: true
          }
        ],
        outputs: [
          {
            name: 'success',
            type: 'boolean',
            description: 'Whether the deletion was successful'
          }
        ]
      },
      {
        id: 'trigger_workflow',
        name: 'Trigger Workflow',
        description: 'Trigger a workflow via webhook',
        inputs: [
          {
            name: 'workflowId',
            type: 'string',
            description: 'ID of the workflow to trigger',
            required: true
          },
          {
            name: 'data',
            type: 'object',
            description: 'Data to send to the workflow',
            required: true
          }
        ],
        outputs: [
          {
            name: 'result',
            type: 'object',
            description: 'Result of the workflow trigger'
          }
        ]
      }
    ];
  }

  /**
   * Execute an action from this integration
   */
  async executeAction(actionId: string, credentials: { accessToken: string }, inputs: any): Promise<any> {
    switch (actionId) {
      case 'get_workflows':
        const workflows = await this.getWorkflows(credentials);
        return { workflows };

      case 'get_workflow':
        const workflow = await this.getWorkflow(credentials, inputs.workflowId);
        return { workflow };

      case 'create_workflow':
        const createdWorkflow = await this.createWorkflow(credentials, {
          name: inputs.name,
          description: inputs.description
        });
        return { workflow: createdWorkflow };

      case 'update_workflow':
        const updatedWorkflow = await this.updateWorkflow(credentials, inputs.workflowId, {
          name: inputs.name,
          description: inputs.description,
          active: inputs.active
        });
        return { workflow: updatedWorkflow };

      case 'delete_workflow':
        const success = await this.deleteWorkflow(credentials, inputs.workflowId);
        return { success };

      case 'trigger_workflow':
        const result = await this.triggerWorkflow(credentials, inputs.workflowId, inputs.data);
        return { result };

      default:
        throw new HttpException(`Unknown action: ${actionId}`, HttpStatus.BAD_REQUEST);
    }
  }
}