import axios from 'axios';
import { Logger } from '../logging.js';
import { EventEmitter } from 'events';

interface WebhookConfig {
  hookUrl: string;
  secret?: string;
  headers?: Record<string, string>;
  defaultMetadata?: Record<string, any>;
  timeout?: number;
  retries?: number;
}

export class ZapierWebhook extends EventEmitter {
  private logger: Logger;
  private config: WebhookConfig;
  
  constructor(logger: Logger, config: WebhookConfig) {
    super();
    this.logger = logger;
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config
    };
    
    if (!this.config.hookUrl) {
      throw new Error('Zapier webhook URL is required');
    }
  }
  
  /**
   * Send data to a Zapier webhook
   */
  async send(data: Record<string, any>, options?: {
    metadata?: Record<string, any>,
    additionalHeaders?: Record<string, string>
  }): Promise<boolean> {
    const metadata = {
      ...this.config.defaultMetadata,
      ...options?.metadata,
      timestamp: Date.now()
    };
    
    const payload = {
      data,
      metadata
    };
    
    // Add webhook secret if configured
    if (this.config.secret) {
      metadata.secret = this.config.secret;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options?.additionalHeaders
    };
    
    let attempts = 0;
    let success = false;
    let lastError: Error | null = null;
    
    while (attempts < (this.config.retries || 1) && !success) {
      attempts++;
      
      try {
        this.logger.debug(`Sending webhook to Zapier (attempt ${attempts})`, {
          url: this.config.hookUrl,
          payloadSize: JSON.stringify(payload).length
        });
        
        const response = await axios.post(this.config.hookUrl, payload, {
          headers,
          timeout: this.config.timeout
        });
        
        if (response.status >= 200 && response.status < 300) {
          this.logger.debug('Webhook sent successfully', {
            status: response.status,
            response: response.data
          });
          
          this.emit('success', {
            data,
            response: response.data,
            statusCode: response.status,
            attempt: attempts
          });
          
          success = true;
        } else {
          const error = new Error(`Received non-success status code: ${response.status}`);
          lastError = error;
          
          this.logger.warn('Webhook request failed', {
            status: response.status,
            attempt: attempts,
            response: response.data
          });
          
          this.emit('error', {
            error,
            statusCode: response.status,
            data,
            attempt: attempts
          });
          
          // Wait before retrying
          if (attempts < (this.config.retries || 1)) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      } catch (error) {
        lastError = error as Error;
        
        this.logger.error('Error sending webhook', {
          error: error.message,
          attempt: attempts
        });
        
        this.emit('error', {
          error,
          data,
          attempt: attempts
        });
        
        // Wait before retrying
        if (attempts < (this.config.retries || 1)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    if (!success) {
      this.logger.error('All webhook attempts failed', {
        attempts,
        error: lastError?.message
      });
      
      this.emit('failed', {
        error: lastError,
        data,
        attempts
      });
    }
    
    return success;
  }
  
  /**
   * Updates the webhook configuration
   */
  updateConfig(newConfig: Partial<WebhookConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    this.logger.debug('Updated webhook configuration');
  }
}
