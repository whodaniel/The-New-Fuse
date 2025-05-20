import axios from 'axios';
import { Node, NodeConfig, NodeInput, NodeOutput } from './types.js';
import { ApiUsageTracker } from './api-usage-tracker.js';

export interface ApiNodeConfig extends NodeConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
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
  caching?: {
    enabled: boolean;
    ttl?: number; // seconds
  };
}

export class ApiNode implements Node {
  id: string;
  type: string = 'api';
  name: string;
  config: ApiNodeConfig;
  private apiUsageTracker: ApiUsageTracker;
  
  constructor(id: string, name: string, config: ApiNodeConfig, apiUsageTracker: ApiUsageTracker) {
    this.id = id;
    this.name = name;
    this.config = config;
    this.apiUsageTracker = apiUsageTracker;
  }
  
  async execute(inputs: NodeInput): Promise<NodeOutput> {
    let retries = 0;
    const maxRetries = this.config.errorHandling?.retryCount || 0;
    const retryDelay = this.config.errorHandling?.retryDelay || 1000;
    
    while (true) {
      try {
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
        
        // Prepare URL and query parameters
        let url = this.config.url;
        const queryParams: Record<string, string> = {};
        
        if (this.config.authentication?.keyLocation === 'query') {
          queryParams[this.config.authentication.keyName || 'api_key'] = this.config.authentication.keyValue || '';
        }
        
        // Make request
        const response = await axios({
          method: this.config.method,
          url,
          headers,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
          data: this.config.bodyTemplate ? JSON.parse(this.replaceVariables(this.config.bodyTemplate, inputs)) : undefined
        });
        
        // Track API usage
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: url,
          timestamp: new Date(),
          success: true,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: new URL(url).hostname
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
        // Track failed API usage
        await this.apiUsageTracker.trackUsage({
          userId: inputs.userId,
          endpoint: this.config.url,
          timestamp: new Date(),
          success: false,
          nodeId: this.id,
          workflowId: inputs.workflowId,
          serviceProvider: new URL(this.config.url).hostname
        });
        
        // Retry logic
        if (retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Use fallback value if provided
        if (this.config.errorHandling?.fallbackValue !== undefined) {
          return { 
            success: true, 
            data: this.config.errorHandling.fallbackValue,
            warnings: [`API request failed, using fallback value. Error: ${error.message}`]
          };
        }
        
        return { 
          success: false, 
          error: error.message,
          data: error.response?.data
        };
      }
    }
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
