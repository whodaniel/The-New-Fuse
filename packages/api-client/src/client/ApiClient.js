import axios from 'axios';
/**
 * API client for making HTTP requests
 */
export class ApiClient {
    /**
     * Create a new API client
     * @param options API client options
     */
    constructor(options) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tokenStorage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "refreshPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        const { baseURL, headers = {}, timeout = 30000, withCredentials = false, tokenStorage, } = options;
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
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(async (config) => {
            // Add authorization header if token exists
            if (this.tokenStorage) {
                const token = await this.tokenStorage.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor
        this.client.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            // Handle token refresh
            if (error.response?.status === 401 &&
                this.tokenStorage &&
                originalRequest &&
                !originalRequest._retry) {
                if (!this.refreshPromise) {
                    this.refreshPromise = this.refreshToken();
                }
                try {
                    const newToken = await this.refreshPromise;
                    this.refreshPromise = null;
                    if (newToken) {
                        // Retry the original request with the new token
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        originalRequest._retry = true;
                        return this.client(originalRequest);
                    }
                }
                catch (refreshError) {
                    this.refreshPromise = null;
                    // If token refresh fails, redirect to login
                    this.tokenStorage.clearTokens();
                    return Promise.reject(refreshError);
                }
            }
            // Format error response
            return Promise.reject(this.formatError(error));
        });
    }
    /**
     * Refresh the access token
     * @returns Promise resolving to the new access token or null if refresh fails
     */
    async refreshToken() {
        if (!this.tokenStorage) {
            return null;
        }
        try {
            const refreshToken = await this.tokenStorage.getRefreshToken();
            if (!refreshToken) {
                return null;
            }
            // Create a new axios instance to avoid interceptors
            const response = await axios.post(`${this.client.defaults.baseURL}/auth/refresh`, {
                refreshToken,
            });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            if (accessToken && newRefreshToken) {
                await this.tokenStorage.setTokens(accessToken, newRefreshToken);
                return accessToken;
            }
            return null;
        }
        catch (error) {
            await this.tokenStorage.clearTokens();
            throw error;
        }
    }
    /**
     * Format error response
     * @param error Axios error
     * @returns Formatted API error
     */
    sanitizeErrorMessage(input) {
        const fallback = 'Request failed';
        if (input == null)
            return fallback;
        const asString = Array.isArray(input)
            ? input.map((item) => String(item)).join(', ')
            : String(input);
        const compact = asString.replace(/\s+/g, ' ').trim();
        const looksLikePromptDump = compact.includes('Codebase Overview') ||
            compact.includes('What It Is') ||
            compact.includes('Core Services');
        if (!compact || looksLikePromptDump || compact.length > 220) {
            return 'Request failed due to an unexpected server response.';
        }
        return compact;
    }
    formatError(error) {
        const rawMessage = error?.response?.data?.message;
        return {
            message: this.sanitizeErrorMessage(rawMessage || (error instanceof Error ? error.message : 'Unknown error')),
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
    async get(url, config) {
        try {
            const response = await this.client.get(url, config);
            return response.data;
        }
        catch (error) {
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
    async post(url, data, config) {
        try {
            const response = await this.client.post(url, data, config);
            return response.data;
        }
        catch (error) {
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
    async put(url, data, config) {
        try {
            const response = await this.client.put(url, data, config);
            return response.data;
        }
        catch (error) {
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
    async patch(url, data, config) {
        try {
            const response = await this.client.patch(url, data, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Make a DELETE request
     * @param url URL to request
     * @param config Request configuration
     * @returns Promise resolving to the response data
     */
    async delete(url, config) {
        try {
            const response = await this.client.delete(url, config);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
}
