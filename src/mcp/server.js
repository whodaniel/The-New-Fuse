#!/usr/bin/env node
"use strict";
/**
 * The New Fuse MCP Server Entry Point
 * Unified entry point that starts all MCP servers and integrates with the platform
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const TheNewFuseMCPServer_1 = require("./TheNewFuseMCPServer");
const mcp_broker_service_1 = require("./services/mcp-broker.service");
const mcp_client_1 = require("./services/mcp-client");
const logger_service_1 = require("../common/logger.service");
const MCPOAuthServer_1 = require("../auth/MCPOAuthServer");
const express_1 = __importDefault(require("express"));
class TNFMCPServerOrchestrator {
    app;
    mcpServer;
    mcpBroker;
    oauthServer;
    httpServer;
    internalClients = new Map();
    logger;
    platformServices = {};
    constructor() {
        this.mcpServer = new TheNewFuseMCPServer_1.TheNewFuseMCPServer();
        this.logger = new logger_service_1.Logger('TNFMCPOrchestrator');
    }
    async start() {
        try {
            // 1. Initialize NestJS application
            await this.initializeNestApp();
            // 2. Initialize platform services
            await this.initializePlatformServices();
            // 3. Initialize OAuth server
            await this.initializeOAuthServer();
            // 4. Start main MCP server with OAuth
            await this.startMainMCPServer();
            // 5. Initialize internal MCP clients
            await this.initializeInternalClients();
            // 6. Setup inter-server communication
            await this.setupInterServerCommunication();
            this.logger.log('🚀 TNF MCP Server Orchestrator started successfully');
            // Keep the process running
            process.on('SIGINT', () => this.gracefulShutdown());
            process.on('SIGTERM', () => this.gracefulShutdown());
        }
        catch (error) {
            this.logger.error('Failed to start TNF MCP Server:', error);
            process.exit(1);
        }
    }
    async initializeNestApp() {
        this.app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: false // Use our custom logger
        });
        this.mcpBroker = this.app.get(mcp_broker_service_1.MCPBrokerService);
        this.logger = this.app.get(logger_service_1.Logger);
        this.logger.log('✅ NestJS application initialized');
    }
    async initializePlatformServices() {
        // Connect to actual TNF platform services
        this.platformServices = {
            agent: this.app.get('AgentService', { strict: false }),
            chat: this.app.get('ChatService', { strict: false }),
            workflow: this.app.get('WorkflowService', { strict: false }),
            monitoring: this.app.get('MonitoringService', { strict: false }),
            claudeDev: this.app.get('ClaudeDevService', { strict: false })
        };
        // Set services in MCP server
        this.mcpServer.setServices(this.platformServices);
        this.logger.log('✅ Platform services connected to MCP server');
    }
    async initializeOAuthServer() {
        this.oauthServer = new MCPOAuthServer_1.MCPOAuthServer(this.logger);
        // Create HTTP server for OAuth endpoints
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        // Add CORS for OAuth endpoints
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        // Mount OAuth routes
        app.use('/', this.oauthServer.getRouter());
        // Add MCP SSE endpoints with OAuth protection
        app.use('/mcp/main/sse', this.oauthServer.validateMCPToken(['mcp:read']), this.createSSEEndpoint('main'));
        app.use('/mcp/relay/sse', this.oauthServer.validateMCPToken(['mcp:admin']), this.createSSEEndpoint('relay'));
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                oauth_enabled: true,
                mcp_version: '2025-06-18',
                tnf_version: '2.1.0'
            });
        });
        const port = process.env.TNF_OAUTH_PORT ? parseInt(process.env.TNF_OAUTH_PORT) : 3001;
        this.httpServer = app.listen(port, () => {
            this.logger.log(`✅ OAuth server started on port ${port}`);
        });
    }
    createSSEEndpoint(serverType) {
        return (req, res) => {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            // OAuth info available in req.oauth
            const { client_id, scope, mcp_resources } = req.oauth;
            res.write(`data: ${JSON.stringify({
                type: 'connection_established',
                server: serverType,
                client_id,
                authorized_resources: mcp_resources,
                capabilities: this.getMCPCapabilitiesForServer(serverType)
            })}\n\n`);
            // Keep connection alive
            const keepAlive = setInterval(() => {
                res.write('data: {"type":"heartbeat"}\n\n');
            }, 30000);
            req.on('close', () => {
                clearInterval(keepAlive);
                this.logger.log(`SSE connection closed for ${serverType} client ${client_id}`);
            });
            this.logger.log(`✅ SSE connection established for ${serverType} client ${client_id}`);
        };
    }
    getMCPCapabilitiesForServer(serverType) {
        const baseCapabilities = ['list_tools', 'call_tool', 'list_resources', 'read_resource'];
        switch (serverType) {
            case 'main':
                return [...baseCapabilities, 'agent_management', 'workflow_execution', 'chat_operations'];
            case 'relay':
                return [...baseCapabilities, 'api_interception', 'message_routing', 'proxy_management'];
            default:
                return baseCapabilities;
        }
    }
    async startMainMCPServer() {
        const transport = process.argv.includes('--http') ? 'http' : 'stdio';
        const port = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 3001;
        await this.mcpServer.start(transport, port);
        this.logger.log(`✅ Main MCP server started (${transport}${transport === 'http' ? `:${port}` : ''})`);
    }
    async initializeInternalClients() {
        // Connect to specialized MCP servers within TNF
        const internalServers = [
            { name: 'agent-server', url: 'http://localhost:3011' },
            { name: 'chat-server', url: 'http://localhost:3012' },
            { name: 'workflow-server', url: 'http://localhost:3013' },
            { name: 'file-coordination', url: 'http://localhost:3014' },
            { name: 'rag-server', url: 'http://localhost:3015' }
        ];
        for (const server of internalServers) {
            try {
                const client = new mcp_client_1.MCPClient(server.url);
                const connected = await client.connectToServer();
                if (connected) {
                    this.internalClients.set(server.name, client);
                    this.logger.log(`✅ Connected to internal ${server.name}`);
                }
                else {
                    this.logger.warn(`⚠️ Could not connect to ${server.name} at ${server.url}`);
                }
            }
            catch (error) {
                this.logger.warn(`⚠️ Error connecting to ${server.name}:`, error.message);
            }
        }
        this.logger.log(`✅ Internal MCP clients initialized (${this.internalClients.size} connected)`);
    }
    async setupInterServerCommunication() {
        // Setup MCP broker to coordinate between internal servers
        await this.mcpBroker.initialize({
            serverTypes: ['agent', 'chat', 'workflow', 'file-coordination', 'rag'],
            redisConfig: {
                enablePubSub: true,
                enableCache: true
            },
            mcpClients: this.internalClients
        });
        // Register cross-server capabilities
        await this.registerCrossServerCapabilities();
        this.logger.log('✅ Inter-server communication established');
    }
    async registerCrossServerCapabilities() {
        // Register tools that can orchestrate across multiple servers
        const orchestrationTools = [
            {
                name: 'execute_cross_server_workflow',
                description: 'Execute workflows that span multiple MCP servers',
                handler: this.executeCrossServerWorkflow.bind(this)
            },
            {
                name: 'aggregate_server_status',
                description: 'Get aggregated status from all internal MCP servers',
                handler: this.aggregateServerStatus.bind(this)
            },
            {
                name: 'broadcast_to_all_servers',
                description: 'Broadcast a message to all connected MCP servers',
                handler: this.broadcastToAllServers.bind(this)
            }
        ];
        for (const tool of orchestrationTools) {
            await this.mcpBroker.registerTool(tool.name, tool.description, tool.handler);
        }
        this.logger.log('✅ Cross-server orchestration tools registered');
    }
    async executeCrossServerWorkflow(params) {
        const { workflowSteps, context } = params;
        const results = [];
        for (const step of workflowSteps) {
            const { serverName, toolName, toolParams } = step;
            const client = this.internalClients.get(serverName);
            if (client) {
                try {
                    const result = await client.processQuery(`Execute ${toolName} with ${JSON.stringify(toolParams)}`);
                    results.push({ step: step.id, result, success: true });
                }
                catch (error) {
                    results.push({ step: step.id, error: error.message, success: false });
                }
            }
            else {
                results.push({ step: step.id, error: `Server ${serverName} not available`, success: false });
            }
        }
        return { workflowId: `cross-server-${Date.now()}`,
            results,
            summary: {
                total: workflowSteps.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        };
    }
    async aggregateServerStatus() {
        const serverStatuses = {};
        for (const [serverName, client] of this.internalClients.entries()) {
            try {
                const messages = await client.processQuery('Get server status');
                serverStatuses[serverName] = {
                    status: 'connected',
                    lastResponse: new Date().toISOString(),
                    responseTime: '< 100ms', // Could measure actual time
                    details: messages[messages.length - 1]?.content
                };
            }
            catch (error) {
                serverStatuses[serverName] = {
                    status: 'error',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        }
        return {
            platform_status: 'operational',
            total_servers: this.internalClients.size,
            connected_servers: Object.values(serverStatuses).filter((s) => s.status === 'connected').length,
            server_details: serverStatuses,
            aggregated_at: new Date().toISOString()
        };
    }
    async broadcastToAllServers(params) {
        const { message, action, parameters } = params;
        const results = [];
        for (const [serverName, client] of this.internalClients.entries()) {
            try {
                const query = action ? `${action}: ${message}` : message;
                const response = await client.processQuery(query);
                results.push({
                    server: serverName,
                    success: true,
                    response: response[response.length - 1]?.content
                });
            }
            catch (error) {
                results.push({
                    server: serverName,
                    success: false,
                    error: error.message
                });
            }
        }
        return { broadcast_id: `broadcast-${Date.now()}`,
            message,
            sent_to: this.internalClients.size,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
    async gracefulShutdown() {
        this.logger.log('🛑 Shutting down TNF MCP Server gracefully...');
        try {
            // Close all internal clients
            for (const [name, client] of this.internalClients.entries()) {
                await client.cleanup();
                this.logger.log(`✅ Closed connection to ${name}`);
            }
            // Stop main MCP server
            await this.mcpServer.stop();
            this.logger.log('✅ Main MCP server stopped');
            // Close NestJS app
            if (this.app) {
                await this.app.close();
                this.logger.log('✅ NestJS application closed');
            }
            this.logger.log('✅ Graceful shutdown complete');
            process.exit(0);
        }
        catch (error) {
            this.logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}
// Start the orchestrator if this file is run directly
if (require.main === module) {
    const orchestrator = new TNFMCPServerOrchestrator();
    orchestrator.start();
}
exports.default = TNFMCPServerOrchestrator;
//# sourceMappingURL=server.js.map