import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiConfig } from '../config/ApiConfig';
/**
 * Core API client for making HTTP requests
 */
export declare class ApiClient {
    private axios;
    private baseURL;
    constructor(config: ApiConfig);
    /**
     * Get the current authentication token
     */
    private getAuthToken;
    /**
     * Make a GET request
     */
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a POST request
     */
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PUT request
     */
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a PATCH request
     */
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Make a DELETE request
     */
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Get the underlying Axios instance
     */
    getAxiosInstance(): AxiosInstance;
}
//# sourceMappingURL=ApiClient.d.ts.map