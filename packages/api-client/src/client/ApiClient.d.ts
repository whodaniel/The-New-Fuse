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
}
//# sourceMappingURL=ApiClient.d.ts.map