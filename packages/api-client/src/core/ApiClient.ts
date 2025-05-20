import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfig } from '../config/ApiConfig.js';

/**
 * Core API client for making HTTP requests
 */
export class ApiClient {
  private axios: AxiosInstance;
  private baseURL: string;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;

    // Create Axios instance with default config
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
    });

    // Add request interceptor for authentication
    this.axios.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (config.headers && config.headers['Authorization'] === undefined) {
          const token = this.getAuthToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors (rate limits, auth issues, etc.)
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Handle unauthorized (could trigger token refresh)
              break;
            case 403:
              // Handle forbidden
              break;
            case 429:
              // Handle rate limit
              break;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the current authentication token
   */
  private getAuthToken(): string | null {
    // Implement token retrieval from storage
    // This could be from localStorage, cookies, or a token manager
    return localStorage.getItem('auth_token');
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axios;
  }
}