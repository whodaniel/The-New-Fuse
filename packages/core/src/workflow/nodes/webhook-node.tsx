import axios from 'axios';
import { NodeHandler, WorkflowNode, ExecutionContext } from '../types.js';

export class WebhookNodeHandler implements NodeHandler {
  constructor() {}
  
  async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
    const {
      url,
      method = 'POST',
      headers = {},
      payload,
      timeout = 30000,
      retries = 3
    } = node.data;
    
    if (!url) {
      throw new Error('Webhook URL is required');
    }
    
    context.logger.debug(`Executing webhook node: ${node.id}`, { url, method });
    
    // Prepare payload by evaluating any template expressions
    const processedPayload = this.processPayload(payload, context);
    
    // Add default headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    let attempts = 0;
    let lastError: Error | null = null;
    
    while (attempts < retries) {
      attempts++;
      
      try {
        const response = await axios({
          url,
          method,
          headers: requestHeaders,
          data: processedPayload,
          timeout
        });
        
        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
          attempts
        };
      } catch (error) {
        lastError = error;
        
        context.logger.warn(`Webhook request failed (attempt ${attempts}/${retries})`, {
          url,
          error: error.message,
          status: error.response?.status
        });
        
        // Only retry on certain errors (network errors, 5xx responses)
        const shouldRetry = !error.response || error.response.status >= 500;
        if (!shouldRetry || attempts >= retries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempts) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed
    context.logger.error(`All webhook attempts failed (${attempts} attempts)`, {
      url,
      error: lastError?.message
    });
    
    // Return error response
    if (lastError?.response) {
      return {
        success: false,
        status: lastError.response.status,
        statusText: lastError.response.statusText,
        data: lastError.response.data,
        error: lastError.message,
        attempts
      };
    } else {
      return {
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts
      };
    }
  }
  
  private processPayload(payload: any, context: ExecutionContext): any {
    if (!payload) return {};
    
    // If payload is a string, look for template expressions
    if (typeof payload === 'string') {
      return payload.replace(/\$\{([^}]+)\}/g, (match, expr) => {
        try {
          // Evaluate the expression against context
          const parts = expr.split('.');
          let value = context;
          
          for (const part of parts) {
            value = value[part];
            if (value === undefined) break;
          }
          
          return value !== undefined ? String(value) : match;
        } catch (error) {
          context.logger.warn(`Error evaluating expression ${expr} in webhook payload`, error);
          return match;
        }
      });
    }
    
    // If payload is an object, process each property recursively
    if (typeof payload === 'object' && payload !== null) {
      const result = Array.isArray(payload) ? [] : {};
      
      for (const [key, value] of Object.entries(payload)) {
        result[key] = this.processPayload(value, context);
      }
      
      return result;
    }
    
    // Otherwise return as is
    return payload;
  }
}
