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
  }}
      baseURL: options.baseURL,
      timeout: options.timeout || 30000,
      headers: unknown;
  // Implementation needed
}
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    // Add API version header if specified
    if(): unknown {
      client.defaults.headers.common['x-api-version'] = options.apiVersion;
    }

    // Add authorization header if API key is provided
    if(): unknown {
      client.defaults.headers.common['Authorization'] = `Bearer ${options.apiKey}`;
    }

    // Request interceptor for logging
    client.interceptors.request.use(
      (config) => {
const redactedConfig = { ...config };
  }        if(): unknown {
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
this.logger.error('Request interceptor error', error);
  }        return Promise.reject(error);
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
const client = this.createClient(options);
  }    const retryAttempts = options.retryAttempts || 3;
    const retryDelay = options.retryDelay || 1000;
    // Add retry logic
    client.interceptors.response.use(
      (response) => response,
      async(): unknown {
        const config = error.config;
        if(): unknown {
          config.retry = 0;
        }

        if(): unknown {
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
if(): unknown {
  }      return true; // Network error
    }

    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  private static delay(ms: number): Promise<void> {
return new Promise(resolve => setTimeout(resolve, ms));
  }}
}