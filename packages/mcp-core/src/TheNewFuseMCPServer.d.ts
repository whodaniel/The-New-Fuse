/**
 * Complete MCP Server Implementation for The New Fuse
 * Provides Model Context Protocol server for AI agency platform capabilities
 */
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
interface ServiceInterface {
    agent?: any;
    chat?: any;
    workflow?: any;
    monitoring?: any;
    claudeDev?: any;
}
/**
 * The New Fuse MCP Server
 * Provides comprehensive AI agency platform capabilities via MCP
 */
export declare class TheNewFuseMCPServer {
    private server;
    private isRemote;
    private services;
    constructor(isRemote?: boolean);
    /**
     * Set service implementations
     */
    setServices(services: ServiceInterface): void;
    /**
     * Setup all MCP tool handlers
     */
    private setupToolHandlers;
    private handleListAgents;
    private handleCreateAgent;
    private handleListAutomationTemplates;
    private handleCreateAutomationFromTemplate;
    const transport: SSEServerTransport;
}
export {};
//# sourceMappingURL=TheNewFuseMCPServer.d.ts.map