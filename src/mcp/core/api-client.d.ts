/**
 * Core API client for MCP server
 * Handles HTTP requests with proper error handling and timeouts
 */
import { AuthContext } from '../types';
export declare class ApiClient {
    private baseUrl;
    private authContext;
    private timeout;
    constructor(baseUrl?: string);
    setAuthContext(auth: AuthContext): void;
    getAuthContext(): AuthContext;
    private makeRequest;
    get(endpoint: string, query?: Record<string, string>, headers?: Record<string, string>): Promise<any>;
    post(endpoint: string, data?: any, headers?: Record<string, string>): Promise<any>;
    put(endpoint: string, data?: any, headers?: Record<string, string>): Promise<any>;
    delete(endpoint: string, headers?: Record<string, string>): Promise<any>;
    patch(endpoint: string, data?: any, headers?: Record<string, string>): Promise<any>;
}
//# sourceMappingURL=api-client.d.ts.map