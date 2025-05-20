import { NodeHandler, WorkflowNode, ExecutionContext } from '../types.js';
import { ApiClientFactory } from '../../integrations/api-factory.js';

export class APINodeHandler implements NodeHandler {
  private apiClientFactory: ApiClientFactory;
  
  constructor({ apiClientFactory }: { apiClientFactory: ApiClientFactory }) {
    this.apiClientFactory = apiClientFactory;
  }
  
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
    const { 
      url,
      method = 'GET',
      baseUrl,
      path,
      headers = {},
      params = {},
      data,
      authType,
      authConfig,
      timeout,
      responseType = 'json',
      cacheDuration
    } = node.data;
    
    context.logger.debug(`Executing API node: ${node.id}`, { 
      url: url || `${baseUrl}${path}`, 
      method 
    });
    
    try {
      // Resolve the final URL
      const finalUrl = url || `${baseUrl}${path}`;
      
      // Create or get an API client
      const clientConfig = {
        baseUrl: baseUrl || new URL(finalUrl).origin,
        authType: authType || 'none',
        authConfig: authConfig || {},
        timeout: timeout || 30000
      };
      
      const client = this.apiClientFactory.createClient(clientConfig);
      
      // Execute the request
      const response = await client({
        url: path || (url && !baseUrl ? url : undefined),
        method,
        headers,
        params,
        data,
        responseType
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        context.logger.error(`API error: ${error.message}`, { 
          status: error.response.status,
          data: error.response.data
        });
        
        return {
          error: true,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          message: error.message
        };
      } else if (error.request) {
        // The request was made but no response was received
        context.logger.error(`API request error: ${error.message}`);
        
        return {
          error: true,
          message: error.message,
          request: true,
          response: false
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        context.logger.error(`API setup error: ${error.message}`);
        
        return {
          error: true,
          message: error.message,
          setup: true
        };
      }
    }
  }
}
