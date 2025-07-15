#!/usr/bin/env node
/**
 * Unified MCP Configuration Server
 * Combines Enhanced Config Manager with OAuth Integration
 *
 * Features:
 * - Traditional MCP protocol via stdio
 * - OAuth-protected HTTP API
 * - Integration with TNF OAuth Authorization Server
 * - Modern MCP protocol 2025-06-18
 * - Configuration discovery and health monitoring
 * - Template and backup management
 */
interface UnifiedServerOptions {
    http_port?: number;
    oauth_port?: number;
    enable_oauth?: boolean;
    enable_discovery?: boolean;
    enable_health_monitoring?: boolean;
    config_paths?: string[];
}
declare class UnifiedMCPConfigServer {
    private logger;
    private mcpServer;
    private oauthServer;
    private oauthIntegration;
    private httpApp;
    private options;
    constructor(options?: UnifiedServerOptions);
    private initializeComponents;
    private setupHttpServer;
    private setupPublicConfigAPI;
    private callMCPMethod;
    private generateDiscoveryResponse;
    start(): Promise<void>;
    private gracefulShutdown;
}
export default UnifiedMCPConfigServer;
//# sourceMappingURL=unified-config-server.d.ts.map