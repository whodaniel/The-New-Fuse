/**
 * Refactored MCP Server using modular architecture
 * Delegates tool and resource handling to specialized handlers
 */
import { ApiClient } from './api-client';
import { BaseHandler } from '../handlers/base.handler';
export declare class McpServer {
    private server;
    private apiClient;
    private handlers;
    constructor();
    private setupHandlers;
    private registerHandlers;
    run(): Promise<void>;
    addHandler(handler: BaseHandler): void;
    getApiClient(): ApiClient;
}
//# sourceMappingURL=mcp-server.d.ts.map