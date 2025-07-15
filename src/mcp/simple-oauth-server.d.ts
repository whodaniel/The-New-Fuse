#!/usr/bin/env node
/**
 * Simplified MCP OAuth Server for Testing
 * Tests OAuth Authorization Server discovery without full NestJS dependencies
 */
declare class SimpleMCPOAuthServer {
    private app;
    private oauthServer;
    private logger;
    constructor();
    private setupServer;
    start(port?: number): Promise<unknown>;
}
export default SimpleMCPOAuthServer;
//# sourceMappingURL=simple-oauth-server.d.ts.map