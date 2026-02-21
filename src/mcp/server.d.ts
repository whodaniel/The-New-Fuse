#!/usr/bin/env node
/**
 * The New Fuse MCP Server Entry Point
 * Unified entry point that starts all MCP servers and integrates with the platform
 */
declare class TNFMCPServerOrchestrator {
    private app;
    private mcpServer;
    private mcpBroker;
    private oauthServer;
    private httpServer;
    private internalClients;
    private logger;
    private platformServices;
    constructor();
    start(): Promise<void>;
    private initializeNestApp;
    private initializePlatformServices;
    private initializeOAuthServer;
    private createSSEEndpoint;
    private getMCPCapabilitiesForServer;
    private startMainMCPServer;
    private initializeInternalClients;
    private setupInterServerCommunication;
    private registerCrossServerCapabilities;
    private executeCrossServerWorkflow;
    private aggregateServerStatus;
    private broadcastToAllServers;
    private gracefulShutdown;
}
export default TNFMCPServerOrchestrator;
//# sourceMappingURL=server.d.ts.map