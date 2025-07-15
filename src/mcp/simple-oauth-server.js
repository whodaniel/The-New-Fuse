#!/usr/bin/env node
/**
 * Simplified MCP OAuth Server for Testing
 * Tests OAuth Authorization Server discovery without full NestJS dependencies
 */
import express from 'express';
import { MCPOAuthServer } from '../auth/MCPOAuthServer.js';
import { Logger } from '../common/logger.service.js';
class SimpleMCPOAuthServer {
    app;
    oauthServer;
    logger;
    constructor() {
        this.app = express();
        this.logger = new Logger('SimpleMCPOAuthServer');
        this.oauthServer = new MCPOAuthServer(this.logger);
        this.setupServer();
    }
    setupServer() {
        // Basic middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        // CORS for testing
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            next();
        });
        // Mount OAuth routes
        this.app.use('/', this.oauthServer.getRouter());
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                oauth_enabled: true,
                mcp_version: '2025-06-18',
                tnf_version: '2.1.0'
            });
        });
        // Test endpoints for OAuth flow
        this.app.get('/test/client-credentials', async (req, res) => {
            try {
                // Simulate client credentials flow
                const response = await fetch(`http://localhost:3001/oauth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        grant_type: 'client_credentials',
                        client_id: 'tnf_default_mcp_client',
                        client_secret: 'tnf_default_secret_change_in_production',
                        scope: 'mcp:read tnf:agents'
                    })
                });
                const tokenData = await response.json();
                res.json({
                    test: 'client_credentials_flow',
                    success: response.ok,
                    token_data: tokenData
                });
            }
            catch (error) {
                res.status(500).json({
                    test: 'client_credentials_flow',
                    success: false,
                    error: error.message
                });
            }
        });
    }
    async start(port = 3001) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                this.logger.log(`🚀 MCP OAuth Server started on port ${port}`);
                this.logger.log(`📋 Health check: http://localhost:${port}/health`);
                this.logger.log(`🔐 OAuth discovery: http://localhost:${port}/.well-known/oauth-authorization-server`);
                this.logger.log(`🔗 MCP discovery: http://localhost:${port}/mcp/discovery`);
                this.logger.log(`🧪 Test endpoint: http://localhost:${port}/test/client-credentials`);
                resolve(undefined);
            });
        });
    }
}
// Start the server if this file is run directly
if (require.main === module) {
    const server = new SimpleMCPOAuthServer();
    server.start();
}
export default SimpleMCPOAuthServer;
