/**
 * API Client for The New Fuse
 * Provides a centralized way to make API requests with proper error handling and authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /**
   * Base URL for API requests
   */
  baseURL: string;
  /**
   * Default timeout in milliseconds
   */
  timeout?: number;
  /**
   * Whether to include credentials in requests
   */
  withCredentials?: boolean;
  /**
   * Default headers to include in all requests
   */
  headers?: Record<string, string>;
  /**
   * Authentication token
   */
  token?: string;
  /**
   * Whether to automatically refresh the token when it expires
   */
  autoRefreshToken?: boolean;
  /**
   * Function to refresh the token
   */
  refreshToken?: () => Promise<string>;
  /**
   * Function to handle unauthorized errors
   */
  onUnauthorized?: () => void;
}

/**
 * API client class
 */
export class ApiClient {
  private axios: AxiosInstance;
  private config: ApiClientConfig;
  private refreshPromise: Promise<string> | null = null;

  /**
   * Create a new API client
   * @param config API client configuration
   */
  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      withCredentials: true,
      autoRefreshToken: true,
      ...config,
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      withCredentials: this.config.withCredentials,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.token && { Authorization: `Bearer ${this.config.token}` }),
        ...this.config.headers,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        // Add token to request if available
        if (this.config.token) {
          config.headers.Authorization = `Bearer ${this.config.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle token refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.config.autoRefreshToken &&
          this.config.refreshToken
        ) {
          if (!this.refreshPromise) {
            this.refreshPromise = this.config.refreshToken().finally(() => {
              this.refreshPromise = null;
            });
          }

          try {
            const newToken = await this.refreshPromise;
            this.setToken(newToken);
            originalRequest._retry = true;
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return this.axios(originalRequest);
          } catch (refreshError) {
            // If token refresh fails, handle unauthorized
            if (this.config.onUnauthorized) {
              this.config.onUnauthorized();
            }
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle API errors
   * @param error Axios error
   * @returns Standardized error object
   */
  private handleError(error: AxiosError): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = error.response.data as any;
      const message = data?.error || data?.message || 'An error occurred';
      const customError = new Error(message);
      (customError as any).status = error.response.status;
      (customError as any).data = data;
      return customError;
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(error.message || 'Request failed');
    }
  }

  /**
   * Set the authentication token
   * @param token JWT token
   */
  public setToken(token: string): void {
    this.config.token = token;
  }

  /**
   * Clear the authentication token
   */
  public clearToken(): void {
    this.config.token = undefined;
  }

  /**
   * Make a GET request
   * @param url API endpoint
   * @param config Axios request config
   * @returns Promise with response data
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axios.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a POST request
   * @param url API endpoint
   * @param data Request body
   * @param config Axios request config
   * @returns Promise with response data
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axios.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PUT request
   * @param url API endpoint
   * @param data Request body
   * @param config Axios request config
   * @returns Promise with response data
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axios.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PATCH request
   * @param url API endpoint
   * @param data Request body
   * @param config Axios request config
   * @returns Promise with response data
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axios.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a DELETE request
   * @param url API endpoint
   * @param config Axios request config
   * @returns Promise with response data
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axios.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Create a new API client instance
 * @param config API client configuration
 * @returns API client instance
 * 
 * @example
 * // Create a new API client
 * const api = createApiClient({
 *   baseURL: 'https://api.example.com',
 *   token: 'your-jwt-token',
 *   onUnauthorized: () => {
 *     // Redirect to login page
 *     window.location.href = '/login';
 *   }
 * });
 * 
 * // Make API requests
 * const { data } = await api.get('/users');
 * const { data: user } = await api.post('/users', { name: 'John Doe' });
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
