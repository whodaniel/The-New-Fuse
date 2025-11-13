/**
 * API Client for The New Fuse
 * Provides a centralized way to make API requests with proper error handling and authentication
 */
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
}
//# sourceMappingURL=api-client.d.ts.map