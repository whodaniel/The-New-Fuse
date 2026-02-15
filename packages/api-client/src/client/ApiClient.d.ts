import { AxiosRequestConfig } from 'axios';
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
import type { TokenStorage } from '../auth/TokenStorage';
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
export declare class ApiClient {
    private client;
    private tokenStorage?;
    private refreshPromise;
    /**
     * Create a new API client
     * @param options API client options
     */
    constructor(options: ApiClientOptions);
    /**
     * Set up request and response interceptors
     */
    private setupInterceptors;
    /**
     * Refresh the access token
     * @returns Promise resolving to the new access token or null if refresh fails
     */
    private refreshToken;
    /**
     * Format error response
     * @param error Axios error
     * @returns Formatted API error
     */
    private formatError;
    /**
     * Make a GET request
     * @param url URL to request
     * @param config Request configuration
     * @returns Promise resolving to the response data
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a POST request
     * @param url URL to request
     * @param data Data to send
     * @param config Request configuration
     * @returns Promise resolving to the response data
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PUT request
     * @param url URL to request
     * @param data Data to send
     * @param config Request configuration
     * @returns Promise resolving to the response data
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PATCH request
     * @param url URL to request
     * @param data Data to send
     * @param config Request configuration
     * @returns Promise resolving to the response data
     */
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a DELETE request
     * @param url URL to request
     * @param config Request configuration
     * @returns Promise resolving to the response data
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
