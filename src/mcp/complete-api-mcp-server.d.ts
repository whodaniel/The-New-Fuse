/**
 * Complete MCP Server for The New Fuse Platform API Wrapper
 *
 * This is the complete, production-ready MCP server that wraps ALL API endpoints
 * from The New Fuse platform, making them available as MCP tools and resources.
 *
 * Features:
 * - 80+ MCP tools covering all API endpoints
 * - Authentication management with token storage
 * - Comprehensive error handling
 * - Resource access for platform metadata
 * - Service health monitoring
 * - Automatic API discovery
 */
declare class CompleteTheNewFuseApiMcpServer {
    private server;
    private baseUrl;
    private authContext;
    constructor();
    private setupHandlers;
    private makeApiRequest;
    private getAuthenticationTools;
    private getAgentManagementTools;
    private getChatTools;
    private getWebhookTools;
    private getMcpManagementTools;
    private handleAuthTool;
    private handleAgentTool;
    private handleChatTool;
    private handleWebhookTool;
    private handleMcpTool;
    private handleWorkflowTool;
    private handleUserTool;
    private handleMarketplaceTool;
    private handleAgencyTool;
    private handleAdminTool;
    private handleIntegrationTool;
    private handleHealthTool;
    private handlePlatformTool;
    private mapChatToolToEndpoint;
    private mapWebhookToolToEndpoint;
    private mapMcpToolToEndpoint;
    private getCompleteApiSchema;
    private getAllApiEndpoints;
    private getPlatformStatus;
    private getAuthContext;
    private getToolsCatalog;
    private getServicesRegistry;
    run(): Promise<void>;
}
export { CompleteTheNewFuseApiMcpServer };
//# sourceMappingURL=complete-api-mcp-server.d.ts.map