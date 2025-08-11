import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from '../utils/logger';
export interface ApiClientOptions {
  // Implementation needed
}
  baseURL: string;
  timeout?: number;
  apiKey?: string;
  apiVersion?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export class ApiClientFactory {
  // Implementation needed
}
  private static logger = new Logger('ApiClientFactory');
  static createClient(options: ApiClientOptions): AxiosInstance {
  // Implementation needed
}
    const client = axios.create({
  // Implementation needed
}
      baseURL: options.baseURL,
      timeout: options.timeout || 30000,
      headers: {
  // Implementation needed
}
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    // Add API version header if specified
    if (options.apiVersion) {
  // Implementation needed
}
      client.defaults.headers.common['x-api-version'] = options.apiVersion;
    }

    // Add authorization header if API key is provided
    if (options.apiKey) {
  // Implementation needed
}
      client.defaults.headers.common['Authorization'] = `Bearer ${options.apiKey}`;
    }

    // Request interceptor for logging
    client.interceptors.request.use(
      (config) => {
  // Implementation needed
}
        const redactedConfig = { ...config };
        if (redactedConfig.headers?.Authorization) {
  // Implementation needed
}
          redactedConfig.headers.Authorization = 'Bearer [REDACTED]';
        }
        
        this.logger.debug('message', context);
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: redactedConfig.headers
        });
        return config;
      },
      (error) => {
  // Implementation needed
}
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );
    // Response interceptor for logging
    client.interceptors.response.use(
      (response: AxiosResponse) => {
  // Implementation needed
}
        this.logger.debug('message', context);
        });
        return response;
      },
      (error) => {
  // Implementation needed
}
        this.logger.error('message', context);
        });
        return Promise.reject(error);
      }
    );
    return client;
  }

  static createRetryClient(options: ApiClientOptions): AxiosInstance {
  // Implementation needed
}
    const client = this.createClient(options);
    const retryAttempts = options.retryAttempts || 3;
    const retryDelay = options.retryDelay || 1000;
    // Add retry logic
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
  // Implementation needed
}
        const config = error.config;
        if (!config || !config.retry) {
  // Implementation needed
}
          config.retry = 0;
        }

        if (config.retry < retryAttempts && this.shouldRetry(error)) {
  // Implementation needed
}
          config.retry++;
          const delay = retryDelay * Math.pow(2, config.retry - 1); // Exponential backoff
          
          this.logger.warn(`API request failed, retrying in ${delay}ms (attempt ${config.retry}/${retryAttempts})`, {
  // Implementation needed
}
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
  // Implementation needed
}
    if (!error.response) {
  // Implementation needed
}
      return true; // Network error
    }

    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  private static delay(ms: number): Promise<void> {
  // Implementation needed
}
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}