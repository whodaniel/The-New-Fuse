import { Node, NodeConfig, NodeInput, NodeOutput } from './types.js';
import { ZapierWebhook } from './zapier-webhook.js';
import { ApiUsageTracker } from './api-usage-tracker.js';
import axios from 'axios';

export interface WebhookNodeConfig extends NodeConfig {
  operation: 'trigger' | 'receive' | 'listen';
  webhookId?: string;
  service?: 'zapier' | 'integromat' | 'n8n' | 'custom';
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  bodyTemplate?: string;
  responseMapping?: Record<string, string>;
  authentication?: {
    type: 'Basic' | 'Bearer' | 'API Key';
    username?: string;
    password?: string;
    token?: string;
    keyName?: string;
    keyValue?: string;
    keyLocation?: 'header' | 'query';
  };
  errorHandling?: {
    retryCount?: number;
    retryDelay?: number;
    fallbackValue?: any;
  };
}

export class WebhookNode implements Node {
  id: string;
  type: string = 'webhook';
  name: string;
  config: WebhookNodeConfig;
  private zapierWebhook?: ZapierWebhook;
  private apiUsageTracker?: ApiUsageTracker;
  private webhookListeners: Map<string, (data: any) => Promise<void>> = new Map();
  
  constructor(
    id: string, 
    name: string, 
    config: WebhookNodeConfig, 
    zapierWebhook?: ZapierWebhook,
    apiUsageTracker?: ApiUsageTracker
  ) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.zapierWebhook = zapierWebhook;
    this.apiUsageTracker = apiUsageTracker;
  }
  
  async execute(inputs: NodeInput): Promise<NodeOutput> {
    try {
      let result;
      
      switch (this.config.operation) {
        case 'trigger':
          result = await this.triggerWebhook(inputs);
          break;
        case 'receive':
          result = { success: true, data: inputs.data };
          break;
        case 'listen':
          result = await this.setupWebhookListener(inputs);
          break;
        default:
          return {
            success: false,
            error: `Unsupported operation: ${this.config.operation}`
          };
      }
      
      // Track API usage if tracker is provided
      if (this.apiUsageTracker) {
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: `webhook/${this.config.operation}`,
          timestamp: new Date(),
          success: result.success,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: this.config.service || 'webhook'
        });
      }
      
      return result;
    } catch (error) {
      // Track error if tracker is provided
      if (this.apiUsageTracker) {
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: `webhook/${this.config.operation}`,
          timestamp: new Date(),
          success: false,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: this.config.service || 'webhook'
        });
      }
      
      // Check for fallback value
      if (this.config.errorHandling?.fallbackValue !== undefined) {
        return { 
          success: true, 
          data: this.config.errorHandling.fallbackValue,
          warnings: [`Webhook operation failed, using fallback value. Error: ${error.message}`]
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  private async triggerWebhook(inputs: NodeInput): Promise<NodeOutput> {
    // Try to use predefined webhook from Zapier
    if (this.config.webhookId && this.zapierWebhook) {
      const retries = this.config.errorHandling?.retryCount || 0;
      const retryDelay = this.config.errorHandling?.retryDelay || 1000;
      
      let attempt = 0;
      let success = false;
      
      while (attempt <= retries && !success) {
        success = await this.zapierWebhook.triggerWebhook(
          this.config.webhookId,
          inputs.data
        );
        
        if (!success && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        attempt++;
      }
      
      return { success };
    } 
    // Use direct webhook configuration
    else if (this.config.url) {
      // Prepare headers
      const headers = { ...this.config.headers };
      
      // Add authentication if specified
      if (this.config.authentication) {
        switch (this.config.authentication.type) {
          case 'Basic':
            const auth = Buffer.from(`${this.config.authentication.username}:${this.config.authentication.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
            break;
          case 'Bearer':
            headers['Authorization'] = `Bearer ${this.config.authentication.token}`;
            break;
          case 'API Key':
            if (this.config.authentication.keyLocation === 'header') {
              headers[this.config.authentication.keyName || 'X-API-Key'] = this.config.authentication.keyValue || '';
            }
            break;
        }
      }
      
      // Prepare query parameters
      const queryParams: Record<string, string> = {};
      
      if (this.config.authentication?.keyLocation === 'query') {
        queryParams[this.config.authentication.keyName || 'api_key'] = this.config.authentication.keyValue || '';
      }
      
      // Prepare request body
      let body = inputs.data;
      if (this.config.bodyTemplate) {
        body = JSON.parse(this.replaceVariables(this.config.bodyTemplate, inputs));
      }
      
      // Implement retry logic
      const maxRetries = this.config.errorHandling?.retryCount || 0;
      const retryDelay = this.config.errorHandling?.retryDelay || 1000;
      let attempts = 0;
      
      while (attempts <= maxRetries) {
        try {
          // Make request
          const response = await axios({
            method: this.config.method || 'POST',
            url: this.config.url,
            headers,
            params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
            data: body
          });
          
          // Map response to output
          const output: any = {};
          
          if (this.config.responseMapping) {
            for (const [key, path] of Object.entries(this.config.responseMapping)) {
              output[key] = this.getValueByPath(response.data, path);
            }
          } else {
            output.data = response.data;
          }
          
          return { success: true, data: output };
        } catch (error) {
          attempts++;
          
          if (attempts <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            throw error;
          }
        }
      }
      
      // This shouldn't be reached due to the throw in the catch block
      return { success: false, error: 'Failed after retries' };
    } else {
      return {
        success: false,
        error: 'No webhook ID or URL provided'
      };
    }
  }
  
  private async setupWebhookListener(inputs: NodeInput): Promise<NodeOutput> {
    if (!inputs.data?.callbackUrl) {
      return {
        success: false,
        error: 'No callback URL provided for webhook listener'
      };
    }
    
    // Generate a unique listener ID
    const listenerId = `${this.id}-${Date.now()}`;
    
    // Store the callback function
    this.webhookListeners.set(listenerId, async (data: any) => {
      try {
        await axios.post(inputs.data.callbackUrl, {
          listenerId,
          data,
          nodeId: this.id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to call webhook listener callback: ${error.message}`);
      }
    });
    
    return {
      success: true,
      data: { listenerId }
    };
  }
  
  // Method to be called when a webhook is received
  async receiveWebhook(data: any): Promise<boolean> {
    let success = false;
    
    // Call all registered listeners
    for (const [listenerId, callback] of this.webhookListeners.entries()) {
      try {
        await callback(data);
        success = true;
      } catch (error) {
        console.error(`Error in webhook listener ${listenerId}: ${error.message}`);
      }
    }
    
    return success;
  }
  
  private replaceVariables(template: string, inputs: any): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      return this.getValueByPath(inputs, path.trim()) || match;
    });
  }
  
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }
}
