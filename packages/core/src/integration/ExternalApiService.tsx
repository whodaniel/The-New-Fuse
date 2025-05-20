import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from '../logging/LoggingService.js';
import { CacheManager } from '../optimization/CacheManager.js';
import { RetryConfig } from '../types/RetryConfig.js';

@Injectable()
export class ExternalApiService {
  private axiosInstance: AxiosInstance;
  private logger: Logger;

  constructor(
    private readonly cacheManager: CacheManager,
    logger: Logger,
    private readonly config: {
      baseURL?: string;
      timeout?: number;
      retryConfig?: RetryConfig;
    } = {}
  ) {
    this.logger = logger.createChild('ExternalApiService');
    this.setupAxiosInstance();
  }

  private setupAxiosInstance(): void {
    const defaultConfig: AxiosRequestConfig = {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    this.axiosInstance = axios.create(defaultConfig);

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug('Making external API request', {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug('Received external API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.logger.error('Response interceptor error', { error });
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.generateCacheKey('GET', url, config);
    const cachedResponse = await this.cacheManager.get<T>(cacheKey);

    if (cachedResponse) {
      this.logger.debug('Returning cached response', { url });
      return cachedResponse;
    }

    return this.withRetry(async () => {
      const response = await this.axiosInstance.get<T>(url, config);
      await this.cacheManager.set(cacheKey, response.data);
      return response.data;
    });
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response.data;
    });
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return response.data;
    });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.axiosInstance.delete<T>(url, config);
      return response.data;
    });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (
        this.config.retryConfig &&
        attempt <= this.config.retryConfig.maxAttempts &&
        this.shouldRetry(error)
      ) {
        const delay = this.calculateRetryDelay(attempt);
        this.logger.warn('Retrying failed request', {
          attempt,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.withRetry(operation, attempt + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('response' in error)) {
      return false;
    }

    const response = (error as { response?: { status?: number } }).response;
    if (!response || !response.status) {
      return true; // Network errors
    }

    // Retry server errors (5xx) and some client errors
    return response.status >= 500 || [429, 408].includes(response.status);
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryConfig?.baseDelay || 1000;
    return Math.min(
      baseDelay * Math.pow(2, attempt - 1),
      this.config.retryConfig?.maxDelay || 30000
    );
  }

  private generateCacheKey(
    method: string,
    url: string,
    config?: AxiosRequestConfig
  ): string {
    return `${method}:${url}:${JSON.stringify(config?.params || {})}`;
  }

  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}
