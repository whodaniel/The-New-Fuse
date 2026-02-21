/**
 * Comprehensive MCP API Wrapper for The New Fuse Platform
 * Wraps ALL API endpoints as MCP tools and resources
 *
 * This server exposes every API endpoint through MCP, enabling:
 * - External MCP clients to interact with the platform programmatically
 * - AI agents to access platform functionality via MCP
 * - Complete platform automation through MCP protocol
 */
declare class TheNewFuseApiWrapper {
    private server;
    private baseUrl;
    private authContext;
    constructor();
    private setupHandlers;
    private getAuthenticationTools;
    private getAgentManagementTools;
    private getChatTools;
    private getWebhookTools;
    private getMcpManagementTools;
    private makeApiRequest;
    private handleAuthTool;
    private handleAgentTool;
    run(): Promise<void>;
}
export { TheNewFuseApiWrapper };
//# sourceMappingURL=comprehensive-api-wrapper.d.ts.map