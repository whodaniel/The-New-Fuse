/**
 * API Client for The New Fuse
 * Provides a centralized way to make API requests with proper error handling and authentication
 */
import { AxiosRequestConfig } from 'axios';
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
export declare class ApiClient {
    private axios;
    private config;
    private refreshPromise;
    /**
     * Create a new API client
     * @param config API client configuration
     */
    constructor(config: ApiClientConfig);
    /**
     * Set up request and response interceptors
     */
    private setupInterceptors;
    /**
     * Handle API errors
     * @param error Axios error
     * @returns Standardized error object
     */
    private handleError;
    /**
     * Set the authentication token
     * @param token JWT token
     */
    setToken(token: string): void;
    /**
     * Clear the authentication token
     */
    clearToken(): void;
    /**
     * Make a GET request
     * @param url API endpoint
     * @param config Axios request config
     * @returns Promise with response data
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    /**
     * Make a POST request
     * @param url API endpoint
     * @param data Request body
     * @param config Axios request config
     * @returns Promise with response data
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    /**
     * Make a PUT request
     * @param url API endpoint
     * @param data Request body
     * @param config Axios request config
     * @returns Promise with response data
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    /**
     * Make a PATCH request
     * @param url API endpoint
     * @param data Request body
     * @param config Axios request config
     * @returns Promise with response data
     */
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    /**
     * Make a DELETE request
     * @param url API endpoint
     * @param config Axios request config
     * @returns Promise with response data
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
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
export declare function createApiClient(config: ApiClientConfig): ApiClient;
//# sourceMappingURL=api-client.d.ts.map