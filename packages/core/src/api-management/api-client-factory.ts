import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '../utils/logger';
export interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
  apiVersion?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ApiClientFactory {
  private static logger = new Logger('ApiClientFactory');
  static createClient(options: ApiClientOptions): AxiosInstance {
    const client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    // Add API version header if specified
    if (options.apiVersion) {
      client.defaults.headers.common['x-api-version'] = options.apiVersion;
    }

    // Add authorization header if API key is provided
    if (options.apiKey) {
      client.defaults.headers.common['Authorization'] = `Bearer ${options.apiKey}`;
    }

    // Request interceptor for logging
    client.interceptors.request.use(
      (config) => {
        const redactedConfig = { ...config };
        if (redactedConfig.headers?.Authorization) {
          redactedConfig.headers.Authorization = 'Bearer [REDACTED]';
        }

        this.logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: redactedConfig.headers
        });
        return config;
      },
      (error: any) => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );
    // Response interceptor for logging
    client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug('API Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url
        });
        return response;
      },
      (error: any) => {
        this.logger.error('API Error', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
    return client;
  }

  static createRetryClient(options: ApiClientOptions): AxiosInstance {
    const client = this.createClient(options);
    const retryAttempts = options.retryAttempts || 3;
    const retryDelay = options.retryDelay || 1000;
    // Add retry logic
    client.interceptors.response.use(
      (response) => response,
      async (error: any) => {
        const config = error.config;
        if (!config.retry) {
          config.retry = 0;
        }

        if (config.retry < retryAttempts && this.shouldRetry(error)) {
          config.retry++;
          const delay = retryDelay * Math.pow(2, config.retry - 1); // Exponential backoff

          this.logger.warn(`API request failed, retrying in ${delay}ms (attempt ${config.retry}/${retryAttempts})`, {
            url: config.url,
            status: error.response?.status
          });
          await this.delay(delay);
          return client(config);
        }

        return Promise.reject(error);
      }
    );
    return client;
  }

  private static shouldRetry(error: any): boolean {
    if (!error.response) {
      return true; // Network error
    }

    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}