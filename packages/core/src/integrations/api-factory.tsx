import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Logger } from '../logging.js';
import { EventEmitter } from 'events';
import { ApiMetrics } from '../monitoring/api-metrics.js';

export interface ApiClientConfig {
  baseUrl: string;
  authType: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2';
  authConfig?: {
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    oauthConfig?: any;
  };
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    initialDelayMs: number;
    backoffMultiplier: number;
    retryableStatusCodes: number[];
  };
  transformRequest?: Array<(data: any, headers?: any) => any>;
  transformResponse?: Array<(data: any) => any>;
  metrics?: ApiMetrics;
}

export class ApiClientFactory extends EventEmitter {
  private logger: Logger;
  private defaultConfig: Partial<ApiClientConfig> = {
    authType: 'none',
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    }
  };

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * Create an API client with robust error handling and retries
   */
  createClient(config: ApiClientConfig): AxiosInstance {
    const mergedConfig: ApiClientConfig = {
      ...this.defaultConfig,
      ...config
    };

    const axiosConfig: AxiosRequestConfig = {
      baseURL: mergedConfig.baseUrl,
      timeout: mergedConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...mergedConfig.defaultHeaders
      }
    };

    // Configure authentication
    this.configureAuthentication(axiosConfig, mergedConfig);

    // Setup request/response transforms
    if (mergedConfig.transformRequest) {
      axiosConfig.transformRequest = mergedConfig.transformRequest;
    }
    if (mergedConfig.transformResponse) {
      axiosConfig.transformResponse = mergedConfig.transformResponse;
    }

    // Create the client
    const client = axios.create(axiosConfig);

    // Add request interceptor for logging and metrics
    client.interceptors.request.use(
      (config) => {
        // Log outgoing requests (with sensitive data redacted)
        const redactedConfig = this.redactSensitiveInfo(config);
        this.logger.debug('API Request', { url: redactedConfig.url, method: redactedConfig.method });
        
        // Track metrics start time
        config.metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => {
        this.logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling, retries, and metrics
    client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
        
        // Record metrics
        if (mergedConfig.metrics) {
          mergedConfig.metrics.recordSuccess({
            url: response.config.url || '',
            method: response.config.method || 'GET',
            duration,
            status: response.status,
            dataSize: JSON.stringify(response.data).length
          });
        }
        
        this.logger.debug('API Response', { 
          status: response.status, 
          url: response.config.url,
          duration: `${duration}ms`
        });
        
        return response;
      },
      async (error: AxiosError) => {
        // Get request details
        const config = error.config as AxiosRequestConfig & { 
          metadata?: { startTime: number; retryCount?: number }
          _retryCount?: number 
        };
        
        if (!config) {
          this.logger.error('API Error without config', error);
          return Promise.reject(error);
        }
        
        // Calculate duration
        const duration = Date.now() - (config.metadata?.startTime || Date.now());
        
        // Determine if we should retry
        const retryConfig = mergedConfig.retryConfig;
        const currentRetryCount = config._retryCount || 0;
        
        const canRetry = retryConfig && 
                         currentRetryCount < retryConfig.maxRetries && 
                         this.isRetryableError(error, retryConfig.retryableStatusCodes);
        
        if (canRetry) {
          // Increment retry count
          config._retryCount = currentRetryCount + 1;
          
          // Calculate delay with exponential backoff
          const delay = retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, currentRetryCount);
          
          this.logger.info(`Retrying API request [${config._retryCount}/${retryConfig.maxRetries}] after ${delay}ms`, {
            url: config.url,
            method: config.method,
            status: error.response?.status
          });
          
          // Wait for the backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the request
          return client(config);
        }
        
        // Not retrying - log error and record metrics
        this.logger.error('API Response Error', {
          status: error.response?.status,
          url: config.url,
          method: config.method,
          duration: `${duration}ms`,
          message: error.message,
          retries: currentRetryCount
        });
        
        // Record error metrics
        if (mergedConfig.metrics) {
          mergedConfig.metrics.recordFailure({
            url: config.url || '',
            method: config.method || 'GET',
            duration,
            status: error.response?.status || 0,
            error: error.message
          });
        }
        
        // Emit error event
        this.emit('error', {
          url: config.url,
          method: config.method,
          status: error.response?.status,
          message: error.message,
          retries: currentRetryCount
        });
        
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Configure authentication for the API client
   */
  private configureAuthentication(axiosConfig: AxiosRequestConfig, clientConfig: ApiClientConfig): void {
    const { authType, authConfig } = clientConfig;

    switch (authType) {
      case 'bearer':
        if (authConfig?.token) {
          axiosConfig.headers = {
            ...axiosConfig.headers,
            'Authorization': `Bearer ${authConfig.token}`
          };
        }
        break;
      case 'basic':
        if (authConfig?.username && authConfig?.password) {
          const credentials = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64');
          axiosConfig.headers = {
            ...axiosConfig.headers,
            'Authorization': `Basic ${credentials}`
          };
        }
        break;
      case 'api-key':
        if (authConfig?.apiKey) {
          const headerName = authConfig.apiKeyHeader || 'X-Api-Key';
          axiosConfig.headers = {
            ...axiosConfig.headers,
            [headerName]: authConfig.apiKey
          };
        }
        break;
      case 'oauth2':
        // OAuth2 authentication would be implemented here
        // This typically involves token acquisition and refresh logic
        break;
      case 'none':
      default:
        // No authentication needed
        break;
    }
  }

  /**
   * Redact sensitive information from request config for logging
   */
  private redactSensitiveInfo(config: AxiosRequestConfig): AxiosRequestConfig {
    const redacted = { ...config };
    
    // Redact authorization headers
    if (redacted.headers) {
      const headers = { ...(redacted.headers as Record<string, any>) };
      
      if (headers.Authorization) {
        headers.Authorization = headers.Authorization.replace(/Bearer .+/, 'Bearer [REDACTED]')
                                                   .replace(/Basic .+/, 'Basic [REDACTED]');
      }
      
      // Redact common API key headers
      const apiKeyHeaders = ['X-Api-Key', 'Api-Key', 'Apikey', 'X-API-KEY'];
      apiKeyHeaders.forEach(header => {
        if (headers[header]) {
          headers[header] = '[REDACTED]';
        }
      });
      
      redacted.headers = headers;
    }
    
    return redacted;
  }

  /**
   * Determine if an error should trigger a retry
   */
  private isRetryableError(error: AxiosError, retryableStatusCodes: number[]): boolean {
    // Network errors should be retried
    if (!error.response) {
      return true;
    }
    
    // Check if status code is in retryable list
    const statusCode = error.response.status;
    return retryableStatusCodes.includes(statusCode);
  }
}
