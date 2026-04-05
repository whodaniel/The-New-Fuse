/**
 * Base service class for API services
 * Provides common HTTP methods and utilities for all API services
 */
export class BaseService {
    /**
     * Create a new base service
     * @param apiClient API client instance
     * @param basePath Base path for API requests (e.g., '/users', '/workflows')
     */
    constructor(apiClient, basePath) {
        Object.defineProperty(this, "apiClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "basePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
    getPath(path = '') {
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
    async get(path = '', config) {
        return this.apiClient.get(this.getPath(path), config);
    }
    /**
     * Make a POST request to the service endpoint
     * @param path Path relative to the service base path
     * @param data Data to send in the request body
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    async post(path = '', data, config) {
        return this.apiClient.post(this.getPath(path), data, config);
    }
    /**
     * Make a PUT request to the service endpoint
     * @param path Path relative to the service base path
     * @param data Data to send in the request body
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    async put(path = '', data, config) {
        return this.apiClient.put(this.getPath(path), data, config);
    }
    /**
     * Make a PATCH request to the service endpoint
     * @param path Path relative to the service base path
     * @param data Data to send in the request body
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    async patch(path = '', data, config) {
        return this.apiClient.patch(this.getPath(path), data, config);
    }
    /**
     * Make a DELETE request to the service endpoint
     * @param path Path relative to the service base path
     * @param config Optional request configuration
     * @returns Promise resolving to the response data
     */
    async delete(path = '', config) {
        return this.apiClient.delete(this.getPath(path), config);
    }
    /**
     * Validate required parameters
     * @param params Object containing parameters to validate
     * @param required Array of required parameter names
     * @throws Error if any required parameters are missing
     */
    validateRequired(params, required) {
        const missing = required.filter(key => params[key] === undefined || params[key] === null || params[key] === '');
        if (missing.length > 0) {
            throw new Error(`Missing required parameters: ${missing.join(', ')}`);
        }
    }
    /**
     * Build query string from parameters object
     * @param params Parameters object
     * @returns URL search params string
     */
    buildQueryString(params) {
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
    async list(path = '', options = {}) {
        const queryString = this.buildQueryString(options);
        return this.get(`${path}${queryString}`);
    }
    /**
     * Handle common service operations like get by ID
     * @param id Resource ID
     * @param path Optional path prefix (defaults to '/')
     * @returns Promise resolving to the resource
     */
    async getById(id, path = '/') {
        this.validateRequired({ id }, ['id']);
        return this.get(`${path}${id}`);
    }
    /**
     * Handle common service operations like create
     * @param data Data to create the resource with
     * @param path Optional path (defaults to '')
     * @returns Promise resolving to the created resource
     */
    async create(data, path = '') {
        return this.post(path, data);
    }
    /**
     * Handle common service operations like update by ID
     * @param id Resource ID
     * @param data Data to update the resource with
     * @param path Optional path prefix (defaults to '/')
     * @returns Promise resolving to the updated resource
     */
    async updateById(id, data, path = '/') {
        this.validateRequired({ id }, ['id']);
        return this.put(`${path}${id}`, data);
    }
    /**
     * Handle common service operations like partial update by ID
     * @param id Resource ID
     * @param data Data to partially update the resource with
     * @param path Optional path prefix (defaults to '/')
     * @returns Promise resolving to the updated resource
     */
    async patchById(id, data, path = '/') {
        this.validateRequired({ id }, ['id']);
        return this.patch(`${path}${id}`, data);
    }
    /**
     * Handle common service operations like delete by ID
     * @param id Resource ID
     * @param path Optional path prefix (defaults to '/')
     * @returns Promise resolving to the deletion response
     */
    async deleteById(id, path = '/') {
        this.validateRequired({ id }, ['id']);
        return this.delete(`${path}${id}`);
    }
}
