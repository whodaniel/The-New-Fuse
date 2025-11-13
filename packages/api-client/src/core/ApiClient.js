import axios from 'axios';
/**
 * Core API client for making HTTP requests
 */
export class ApiClient {
    axios;
    baseURL;
    constructor(config) {
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
        this.axios.interceptors.request.use((config) => {
            // Add auth token if available
            if (config.headers && config.headers['Authorization'] === undefined) {
                const token = this.getAuthToken();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            }
            return config;
        }, (error) => Promise.reject(error));
        // Add response interceptor for error handling
        this.axios.interceptors.response.use((response) => response, (error) => {
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
        });
    }
    /**
     * Get the current authentication token
     */
    getAuthToken() {
        // Implement token retrieval from storage
        // This could be from localStorage, cookies, or a token manager
        return localStorage.getItem('auth_token');
    }
    /**
     * Make a GET request
     */
    async get(url, config) {
        const response = await this.axios.get(url, config);
        return response.data;
    }
    /**
     * Make a POST request
     */
    async post(url, data, config) {
        const response = await this.axios.post(url, data, config);
        return response.data;
    }
    /**
     * Make a PUT request
     */
    async put(url, data, config) {
        const response = await this.axios.put(url, data, config);
        return response.data;
    }
    /**
     * Make a PATCH request
     */
    async patch(url, data, config) {
        const response = await this.axios.patch(url, data, config);
        return response.data;
    }
    /**
     * Make a DELETE request
     */
    async delete(url, config) {
        const response = await this.axios.delete(url, config);
        return response.data;
    }
    /**
     * Get the underlying Axios instance
     */
    getAxiosInstance() {
        return this.axios;
    }
}
//# sourceMappingURL=ApiClient.js.map