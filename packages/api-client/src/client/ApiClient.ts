import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * API error interface
 */
export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

/**
 * API client options
 */
export interface ApiClientOptions {
  /**
   * Base URL for API requests
   */
  baseURL: string;
  /**
   * Default headers to include with every request
   */
  headers?: Record<string, string>;
  /**
   * Default timeout in milliseconds
   */
  timeout?: number;
  /**
   * Whether to include credentials (cookies) with requests
   */
  withCredentials?: boolean;
  /**
   * Token storage instance
   */
  tokenStorage?: TokenStorage;
}

/**
 * API client for making HTTP requests
 */
export class ApiClient {
  private client: AxiosInstance;
  private tokenStorage?: TokenStorage;
  private refreshPromise: Promise<string | null> | null = null;

  /**
   * Create a new API client
   * @param options API client options
   */
  constructor(options: ApiClientOptions) {
    const { baseURL, headers = {}, timeout = 30000, withCredentials = false, tokenStorage } = options;

    this.tokenStorage = tokenStorage;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      timeout,
      withCredentials,
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add authorization header if token exists
        if (this.tokenStorage) {
          const token = await this.tokenStorage.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Handle token refresh
        if (
          error.response?.status === 401 &&
          this.tokenStorage &&
          originalRequest &&
          !(originalRequest as any)._retry
        ) {
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshToken();
          }

          try {
            const newToken = await this.refreshPromise;
            this.refreshPromise = null;

            if (newToken) {
              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              (originalRequest as any)._retry = true;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.refreshPromise = null;
            // If token refresh fails, redirect to login
            this.tokenStorage.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        // Format error response
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Refresh the access token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  private async refreshToken(): Promise<string | null> {
    if (!this.tokenStorage) {
      return null;
    }

    try {
      const refreshToken = await this.tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return null;
      }

      // Create a new axios instance to avoid interceptors
      const response = await axios.post(
        `${this.client.defaults.baseURL}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      if (accessToken && newRefreshToken) {
        await this.tokenStorage.setTokens(accessToken, newRefreshToken);
        return accessToken;
      }
      
      return null;
    } catch (error) {
      await this.tokenStorage.clearTokens();
      throw error;
    }
  }

  /**
   * Format error response
   * @param error Axios error
   * @returns Formatted API error
   */
  private formatError(error: AxiosError): ApiError {
    return {
      message: (error as any)?.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error'),
      status: error.response?.status || 500,
      data: error.response?.data,
    };
  }

  /**
   * Make a GET request
   * @param url URL to request
   * @param config Request configuration
   * @returns Promise resolving to the response data
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a POST request
   * @param url URL to request
   * @param data Data to send
   * @param config Request configuration
   * @returns Promise resolving to the response data
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PUT request
   * @param url URL to request
   * @param data Data to send
   * @param config Request configuration
   * @returns Promise resolving to the response data
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a PATCH request
   * @param url URL to request
   * @param data Data to send
   * @param config Request configuration
   * @returns Promise resolving to the response data
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make a DELETE request
   * @param url URL to request
   * @param config Request configuration
   * @returns Promise resolving to the response data
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Minimal TokenStorage interface for type safety
export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
}
