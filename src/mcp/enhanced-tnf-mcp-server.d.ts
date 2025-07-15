/**
 * Enhanced The New Fuse MCP Server
 * Extends the existing MCP server with direct API Gateway integration
 * Provides comprehensive platform access while maintaining existing functionality
 */
import { TheNewFuseMCPServer } from './TheNewFuseMCPServer.js';
/**
 * Enhanced MCP Server that combines existing functionality with direct API access
 */
export declare class EnhancedTheNewFuseMCPServer extends TheNewFuseMCPServer {
    private apiBaseUrl;
    private authContext;
    private enhancedServer;
    constructor(isRemote?: boolean);
    private setupEnhancedHandlers;
    private getEnhancedApiTools;
    private makeApiRequest;
    private handleEnhancedApiTool;
    private handleUnifiedLogin;
    private handleGatewayHealthCheck;
    private handleComprehensiveAgentList;
    private handleAdvancedChatSessionCreate;
    private handleRealTimeMetrics;
    private handleAdvancedWebhookRegister;
    private handleAdvancedMcpManagement;
    private handleWorkflowExecuteWithMonitoring;
    private handleComprehensiveSystemStatus;
    private getApiPlatformStatus;
    private getUnifiedApiSchema;
    private getMcpIntegrationMap;
    private getEnhancedAuthContext;
    private getExistingTools;
    private handleExistingTool;
    run(): Promise<void>;
}
export { EnhancedTheNewFuseMCPServer };
//# sourceMappingURL=enhanced-tnf-mcp-server.d.ts.map