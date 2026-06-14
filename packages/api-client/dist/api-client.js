/**
 * API Client for The New Fuse
 * Provides a centralized way to make API requests with proper error handling and authentication
 */
import axios from 'axios';
/**
 * API client class
 */
export class ApiClient {
    /**
     * Create a new API client
     * @param config API client configuration
     */
    constructor(config) {
        this.refreshPromise = null;
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
    setupInterceptors() {
        // Request interceptor
        this.axios.interceptors.request.use((config) => {
            // Add token to request if available
            if (this.config.token) {
                config.headers.Authorization = `Bearer ${this.config.token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor
        this.axios.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            // Handle token refresh
            if (error.response?.status === 401 &&
                !originalRequest._retry &&
                this.config.autoRefreshToken &&
                this.config.refreshToken) {
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
                }
                catch (refreshError) {
                    // If token refresh fails, handle unauthorized
                    if (this.config.onUnauthorized) {
                        this.config.onUnauthorized();
                    }
                    return Promise.reject(refreshError);
                }
            }
            // Handle other errors
            return Promise.reject(this.handleError(error));
        });
    }
    /**
     * Handle API errors
     * @param error Axios error
     * @returns Standardized error object
     */
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const data = error.response.data;
            const message = data?.error || data?.message || 'An error occurred';
            const customError = new Error(message);
            customError.status = error.response.status;
            customError.data = data;
            return customError;
        }
        else if (error.request) {
            // The request was made but no response was received
            return new Error('No response received from server');
        }
        else {
            // Something happened in setting up the request that triggered an Error
            return new Error(error.message || 'Request failed');
        }
    }
    /**
     * Set the authentication token
     * @param token JWT token
     */
    setToken(token) {
        this.config.token = token;
    }
    /**
     * Clear the authentication token
     */
    clearToken() {
        this.config.token = undefined;
    }
    /**
     * Make a GET request
     * @param url API endpoint
     * @param config Axios request config
     * @returns Promise with response data
     */
    async get(url, config) {
        try {
            const response = await this.axios.get(url, config);
            return response.data;
        }
        catch (error) {
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
    async post(url, data, config) {
        try {
            const response = await this.axios.post(url, data, config);
            return response.data;
        }
        catch (error) {
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
    async put(url, data, config) {
        try {
            const response = await this.axios.put(url, data, config);
            return response.data;
        }
        catch (error) {
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
    async patch(url, data, config) {
        try {
            const response = await this.axios.patch(url, data, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Make a DELETE request
     * @param url API endpoint
     * @param config Axios request config
     * @returns Promise with response data
     */
    async delete(url, config) {
        try {
            const response = await this.axios.delete(url, config);
            return response.data;
        }
        catch (error) {
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
export function createApiClient(config) {
    return new ApiClient(config);
}
//# sourceMappingURL=api-client.js.map