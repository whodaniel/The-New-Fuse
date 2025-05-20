import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from '../logging.js';
import { LLMProvider } from '../types/providers.js';

/**
 * Factory for creating standardized API clients for different LLM providers
 */
export class ApiClientFactory {
  private logger: Logger;
  private defaultConfig: AxiosRequestConfig = {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create an API client for a specific provider
   */
  createClient(provider: LLMProvider, apiKey: string): AxiosInstance {
    this.logger.debug(`Creating API client for ${provider.name}`);
    
    const config: AxiosRequestConfig = {
      ...this.defaultConfig,
      baseURL: provider.baseUrl,
      headers: {
        ...this.defaultConfig.headers,
        'Authorization': `Bearer ${apiKey}`
      }
    };

    // Add provider-specific configurations
    switch (provider.id) {
      case 'openai':
        // OpenAI-specific configuration
        break;
      case 'anthropic':
        // Anthropic-specific configuration
        config.headers['x-api-version'] = '2023-06-01';
        break;
      case 'mistral':
        // Mistral-specific configuration
        break;
      // Add other providers as needed
    }

    const client = axios.create(config);
    
    // Add request interceptor for logging
    client.interceptors.request.use(
      (config) => {
        const redactedConfig = { ...config };
        if (redactedConfig.headers && redactedConfig.headers.Authorization) {
          redactedConfig.headers.Authorization = 'Bearer [REDACTED]';
        }
        this.logger.debug('API Request', { 
          url: redactedConfig.url,
          method: redactedConfig.method,
          provider: provider.id
        });
        return config;
      },
      (error) => {
        this.logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    client.interceptors.response.use(
      (response) => {
        this.logger.debug('API Response', {
          status: response.status,
          provider: provider.id,
          requestId: response.headers['x-request-id']
        });
        return response;
      },
      (error) => {
        this.logger.error('API Response Error', {
          provider: provider.id,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    return client;
  }
}
