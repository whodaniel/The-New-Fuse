import { ApiClient } from '../client/ApiClient';
import type { AxiosRequestConfig } from 'axios';
/**
 * Base service class for API services
 * Provides common HTTP methods and utilities for all API services
 */
export declare abstract class BaseService {
    protected apiClient: ApiClient;
    protected basePath: string;
    /**
     * Create a new base service
     * @param apiClient API client instance
     * @param basePath Base path for API requests (e.g., '/users', '/workflows')
     */
    constructor(apiClient: ApiClient, basePath: string);
    /**
     * Get the full path for a resource
     * @param path Path to the resource relative to basePath
     * @returns Full path including the base path
     * @example
     * // If basePath is '/users' and path is '/123'
     * // Returns '/users/123'
     */
    protected getPath(path?: string): string;
    /**
     * Make a GET request to the service endpoint
     * @param path Path relative to the service base path
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    protected get<T = any>(path?: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a POST request to the service endpoint
     * @param path Path relative to the service base path
     * @param data Data to send in the request body
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    protected post<T = any>(path?: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PUT request to the service endpoint
     * @param path Path relative to the service base path
     * @param data Data to send in the request body
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    protected put<T = any>(path?: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PATCH request to the service endpoint
     * @param path Path relative to the service base path
     * @param data Data to send in the request body
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    protected patch<T = any>(path?: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a DELETE request to the service endpoint
     * @param path Path relative to the service base path
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    protected delete<T = any>(path?: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Validate required parameters
     * @param params Object containing parameters to validate
     * @param required Array of required parameter names
     * @throws Error if any required parameters are missing
     */
    protected validateRequired(params: Record<string, any>, required: string[]): void;
    /**
     * Handle common service operations like create
     * @param data Data to create the resource with
     * @param path Optional path (defaults to '')
     * @returns Promise resolving to the created resource
     */
    protected create<T = any>(data: any, path?: string): Promise<T>;
    /**
     * Handle common service operations like update by ID
     * @param id Resource ID
     * @param data Data to update the resource with
     * @param path Optional path prefix (defaults to '/')
     * @returns Promise resolving to the updated resource
     */
    protected updateById<T = any>(id: string, data: any, path?: string): Promise<T>;
    /**
     * Handle common service operations like partial update by ID
     * @param id Resource ID
     * @param data Data to partially update the resource with
     * @param path Optional path prefix (defaults to '/')
     * @returns Promise resolving to the updated resource
     */
    protected patchById<T = any>(id: string, data: any, path?: string): Promise<T>;
}
//# sourceMappingURL=BaseService.d.ts.map