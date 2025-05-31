import { ApiClient } from '../client/ApiClient.js';
import type { AxiosRequestConfig } from 'axios';

/**
 * Base service class for API services
 * Provides common HTTP methods and utilities for all API services
 */
export abstract class BaseService {
  protected apiClient: ApiClient;
  protected basePath: string;

  /**
   * Create a new base service
   * @param apiClient API client instance
   * @param basePath Base path for API requests (e.g., '/users', '/workflows')
   */
  constructor(apiClient: ApiClient, basePath: string) {
    this.apiClient = apiClient;
    this.basePath = basePath;
  }

  /**
   * Get the full path for a resource
   * @param path Path to the resource relative to basePath
   * @returns Full path including the base path
   * @example
   * // If basePath is '/users' and path is '/123'
   * // Returns '/users/123'
   */
  protected getPath(path: string = ''): string {
    // Ensure path starts with '/' if it's not empty and doesn't already start with '/'
    const normalizedPath = path && !path.startsWith('/') ? `/${path}` : path;
    return `${this.basePath}${normalizedPath}`;
  }

  /**
   * Make a GET request to the service endpoint
   * @param path Path relative to the service base path
   * @param config Optional request configuration
   * @returns Promise resolving to the response data
   */
  protected async get<T = any>(path: string = '', config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.get<T>(this.getPath(path), config);
  }

  /**
   * Make a POST request to the service endpoint
   * @param path Path relative to the service base path
   * @param data Data to send in the request body
   * @param config Optional request configuration
   * @returns Promise resolving to the response data
   */
  protected async post<T = any>(path: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.post<T>(this.getPath(path), data, config);
  }

  /**
   * Make a PUT request to the service endpoint
   * @param path Path relative to the service base path
   * @param data Data to send in the request body
   * @param config Optional request configuration
   * @returns Promise resolving to the response data
   */
  protected async put<T = any>(path: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.put<T>(this.getPath(path), data, config);
  }

  /**
   * Make a PATCH request to the service endpoint
   * @param path Path relative to the service base path
   * @param data Data to send in the request body
   * @param config Optional request configuration
   * @returns Promise resolving to the response data
   */
  protected async patch<T = any>(path: string = '', data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.patch<T>(this.getPath(path), data, config);
  }

  /**
   * Make a DELETE request to the service endpoint
   * @param path Path relative to the service base path
   * @param config Optional request configuration
   * @returns Promise resolving to the response data
   */
  protected async delete<T = any>(path: string = '', config?: AxiosRequestConfig): Promise<T> {
    return this.apiClient.delete<T>(this.getPath(path), config);
  }

  /**
   * Validate required parameters
   * @param params Object containing parameters to validate
   * @param required Array of required parameter names
   * @throws Error if any required parameters are missing
   */
  protected validateRequired(params: Record<string, any>, required: string[]): void {
    const missing = required.filter(key => 
      params[key] === undefined || params[key] === null || params[key] === ''
    );
    
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Build query string from parameters object
   * @param params Parameters object
   * @returns URL search params string
   */
  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Handle common service operations like list with pagination
   * @param path Path for the list endpoint
   * @param options Query options (page, limit, etc.)
   * @returns Promise resolving to the list response
   */
  protected async list<T = any>(path: string = '', options: Record<string, any> = {}): Promise<T> {
    const queryString = this.buildQueryString(options);
    return this.get<T>(`${path}${queryString}`);
  }

  /**
   * Handle common service operations like get by ID
   * @param id Resource ID
   * @param path Optional path prefix (defaults to '/')
   * @returns Promise resolving to the resource
   */
  protected async getById<T = any>(id: string, path: string = '/'): Promise<T> {
    this.validateRequired({ id }, ['id']);
    return this.get<T>(`${path}${id}`);
  }

  /**
   * Handle common service operations like create
   * @param data Data to create the resource with
   * @param path Optional path (defaults to '')
   * @returns Promise resolving to the created resource
   */
  protected async create<T = any>(data: any, path: string = ''): Promise<T> {
    return this.post<T>(path, data);
  }

  /**
   * Handle common service operations like update by ID
   * @param id Resource ID
   * @param data Data to update the resource with
   * @param path Optional path prefix (defaults to '/')
   * @returns Promise resolving to the updated resource
   */
  protected async updateById<T = any>(id: string, data: any, path: string = '/'): Promise<T> {
    this.validateRequired({ id }, ['id']);
    return this.put<T>(`${path}${id}`, data);
  }

  /**
   * Handle common service operations like partial update by ID
   * @param id Resource ID
   * @param data Data to partially update the resource with
   * @param path Optional path prefix (defaults to '/')
   * @returns Promise resolving to the updated resource
   */
  protected async patchById<T = any>(id: string, data: any, path: string = '/'): Promise<T> {
    this.validateRequired({ id }, ['id']);
    return this.patch<T>(`${path}${id}`, data);
  }

  /**
   * Handle common service operations like delete by ID
   * @param id Resource ID
   * @param path Optional path prefix (defaults to '/')
   * @returns Promise resolving to the deletion response
   */
  protected async deleteById<T = any>(id: string, path: string = '/'): Promise<T> {
    this.validateRequired({ id }, ['id']);
    return this.delete<T>(`${path}${id}`);
  }
}
