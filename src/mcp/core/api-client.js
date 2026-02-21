"use strict";
/**
 * Core API client for MCP server
 * Handles HTTP requests with proper error handling and timeouts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const types_1 = require("../types");
class ApiClient {
    baseUrl;
    authContext;
    timeout = 30000; // 30 seconds
    constructor(baseUrl) {
        this.baseUrl = baseUrl || process.env.TNF_API_BASE_URL || 'http://localhost:8080/v1';
        this.authContext = {};
    }
    setAuthContext(auth) {
        this.authContext = auth;
    }
    getAuthContext() {
        return { ...this.authContext };
    }
    async makeRequest(request) {
        const url = new URL(request.endpoint, this.baseUrl);
        // Add query parameters
        if (request.query) {
            Object.entries(request.query).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'TNF-MCP-Server/1.0.0',
            'X-MCP-Client': 'true',
            ...request.headers,
        };
        // Add authentication
        if (this.authContext.token) {
            headers['Authorization'] = `Bearer ${this.authContext.token}`;
        }
        if (this.authContext.apiKey) {
            headers['X-API-Key'] = this.authContext.apiKey;
        }
        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url.toString(), {
                method: request.method,
                headers,
                body: request.data ? JSON.stringify(request.data) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                }
                catch {
                    errorData = { message: errorText };
                }
                throw new types_1.McpError(`API request failed: ${response.status} ${response.statusText} - ${errorData.message || errorText}`, 'API_ERROR', response.status);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            else {
                return await response.text();
            }
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new types_1.McpError('API request timed out after 30 seconds', 'TIMEOUT');
                }
                if (error instanceof types_1.McpError) {
                    throw error;
                }
                throw new types_1.McpError(`Network error: ${error.message}`, 'NETWORK_ERROR');
            }
            throw new types_1.McpError('Unknown network error', 'NETWORK_ERROR');
        }
    }
    async get(endpoint, query, headers) {
        return this.makeRequest({ method: 'GET', endpoint, query, headers });
    }
    async post(endpoint, data, headers) {
        return this.makeRequest({ method: 'POST', endpoint, data, headers });
    }
    async put(endpoint, data, headers) {
        return this.makeRequest({ method: 'PUT', endpoint, data, headers });
    }
    async delete(endpoint, headers) {
        return this.makeRequest({ method: 'DELETE', endpoint, headers });
    }
    async patch(endpoint, data, headers) {
        return this.makeRequest({ method: 'PATCH', endpoint, data, headers });
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=api-client.js.map