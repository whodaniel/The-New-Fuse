import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
}

export interface ExternalApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig?: RetryConfig;
}

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: ExternalApiConfig = {}) {
    this.retryConfig = config.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      retryCondition: (error) => this.shouldRetry(error)
    };

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: unknown;
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('Response interceptor error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() => 
      this.axiosInstance.get<T>(url, config).then(response => response.data)
    );
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() =>
      this.axiosInstance.post<T>(url, data, config).then(response => response.data)
    );
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() =>
      this.axiosInstance.put<T>(url, data, config).then(response => response.data)
    );
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() =>
      this.axiosInstance.patch<T>(url, data, config).then(response => response.data)
    );
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeWithRetry(() =>
      this.axiosInstance.delete<T>(url, config).then(response => response.data)
    );
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt > this.retryConfig.maxRetries || !this.shouldRetry(error)) {
          break;
        }
        
        this.logger.warn(`Request failed, retrying (${attempt}/${this.retryConfig.maxRetries})`, {
          error: error instanceof Error ? error.message : String(error)
        });
        
        await this.delay(this.retryConfig.retryDelay * attempt);
      }
    }
    
    throw lastError;
  }

  private shouldRetry(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      // Retry on network errors or 5xx server errors
      return !error.response || (error.response.status >= 500 && error.response.status < 600);
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateConfig(config: Partial<ExternalApiConfig>): void {
    if (config.baseURL) {
      this.axiosInstance.defaults.baseURL = config.baseURL;
    }
    
    if (config.timeout) {
      this.axiosInstance.defaults.timeout = config.timeout;
    }
    
    if (config.headers) {
      Object.assign(this.axiosInstance.defaults.headers.common, config.headers);
    }
    
    if (config.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...config.retryConfig };
    }
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}