"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPBrokerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPBrokerService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const config_1 = require("@nestjs/config");
const MCPAgentServer_1 = require("../MCPAgentServer");
const MCPChatServer_1 = require("../MCPChatServer");
const MCPWorkflowServer_1 = require("../MCPWorkflowServer");
const MCPFuseServer_1 = require("../MCPFuseServer");
const MCPFileCoordinationServer_1 = require("../MCPFileCoordinationServer");
const MCPRAGServer_1 = require("../MCPRAGServer");
/**
 * MCP Broker Service
 *
 * Central broker for all MCP communication. Provides:
 * 1. Single entry point for all MCP directives
 * 2. Message routing between MCP servers
 * 3. Redis-based communication for distributed setups
 * 4. Logging and monitoring of MCP operations
 */
let MCPBrokerService = MCPBrokerService_1 = class MCPBrokerService {
    configService;
    agentServer;
    chatServer;
    workflowServer;
    fuseServer;
    fileCoordinationServer;
    ragServer;
    logger = new common_1.Logger(MCPBrokerService_1.name);
    publisher;
    subscriber;
    servers = new Map();
    handlers = new Map();
    // Redis channels
    BROADCAST_CHANNEL = 'mcp:broadcast';
    DIRECT_CHANNEL_PREFIX = 'mcp:direct:';
    SERVER_CHANNEL_PREFIX = 'mcp:server:';
    constructor(configService, agentServer, chatServer, workflowServer, fuseServer, fileCoordinationServer, ragServer) {
        this.configService = configService;
        this.agentServer = agentServer;
        this.chatServer = chatServer;
        this.workflowServer = workflowServer;
        this.fuseServer = fuseServer;
        this.fileCoordinationServer = fileCoordinationServer;
        this.ragServer = ragServer;
        // Register all MCP servers
        this.servers.set('agent', this.agentServer);
        this.servers.set('chat', this.chatServer);
        this.servers.set('workflow', this.workflowServer);
        this.servers.set('fuse', this.fuseServer);
        this.servers.set('fileCoordination', this.fileCoordinationServer);
        this.servers.set('rag', this.ragServer);
    }
    async onModuleInit() {
        await this.connect();
        await this.setupSubscriptions();
        this.logger.log('MCP Broker Service initialized');
    }
    async onModuleDestroy() {
        await this.disconnect();
        this.logger.log('MCP Broker Service destroyed');
    }
    /**
     * Connect to Redis
     */
    async connect() {
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        try {
            this.publisher = new ioredis_1.Redis(redisUrl);
            this.subscriber = new ioredis_1.Redis(redisUrl);
            this.logger.log('Connected to Redis');
        }
        catch (error) {
            this.logger.error(`Failed to connect to Redis: ${error.message}`);
            throw error;
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        try {
            await Promise.all([
                this.publisher?.disconnect(),
                this.subscriber?.disconnect()
            ]);
            this.logger.log('Disconnected from Redis');
        }
        catch (error) {
            this.logger.error(`Failed to disconnect from Redis: ${error.message}`);
        }
    }
    /**
     * Setup Redis subscriptions
     */
    async setupSubscriptions() {
        try {
            // Subscribe to broadcast channel
            await this.subscriber.subscribe(this.BROADCAST_CHANNEL);
            // Subscribe to direct channel for this instance
            const instanceId = this.configService.get('INSTANCE_ID') || 'default';
            const directChannel = `${this.DIRECT_CHANNEL_PREFIX}${instanceId}`;
            await this.subscriber.subscribe(directChannel);
            // Subscribe to server channels
            for (const serverName of this.servers.keys()) {
                const serverChannel = `${this.SERVER_CHANNEL_PREFIX}${serverName}`;
                await this.subscriber.subscribe(serverChannel);
            }
            // Handle incoming messages
            this.subscriber.on('message', async (channel, message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    await this.handleMessage(channel, parsedMessage);
                }
                catch (error) {
                    this.logger.error(`Error handling message on channel ${channel}: ${error.message}`);
                }
            });
            this.logger.log('Redis subscriptions set up');
        }
        catch (error) {
            this.logger.error(`Failed to set up Redis subscriptions: ${error.message}`);
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(channel, message) {
        this.logger.debug(`Received message on channel ${channel}: ${JSON.stringify(message)}`);
        // Handle based on channel type
        if (channel === this.BROADCAST_CHANNEL) {
            await this.handleBroadcastMessage(message);
        }
        else if (channel.startsWith(this.DIRECT_CHANNEL_PREFIX)) {
            await this.handleDirectMessage(message);
        }
        else if (channel.startsWith(this.SERVER_CHANNEL_PREFIX)) {
            await this.handleServerMessage(channel, message);
        }
        // Notify handlers
        const handlers = this.handlers.get(message.type) || new Set();
        const promises = Array.from(handlers).map(handler => handler(message));
        await Promise.all(promises);
    }
    /**
     * Handle broadcast message
     */
    async handleBroadcastMessage(message) {
        // Process broadcast message this.logger.debug(`Processing broadcast message: ${JSON.stringify(message)}`);
        // Route to appropriate server
        const serverName = message.payload.server;
        const server = this.servers.get(serverName);
        if (!server) {
            this.logger.warn(`Unknown server: ${serverName}`);
            return;
        }
        try {
            // Execute capability or tool based on action
            const action = message.payload.action;
            const params = message.payload.params || {};
            let result;
            if (action.includes('.')) {
                // Tool execution (format: toolName.execute)
                const [toolName, method] = action.split('.');
                if (method === 'execute') {
                    result = await server.executeTool(toolName, params);
                }
            }
            else {
                // Capability execution
                result = await server.executeCapability(action, params);
            }
            // Send response
            await this.sendResponse(message, result);
        }
        catch (error) {
            await this.sendError(message, error.message);
        }
    }
    /**
     * Handle direct message
     */
    async handleDirectMessage(message) {
        // Process direct message (similar to broadcast but for this instance only)
        await this.handleBroadcastMessage(message);
    }
    /**
     * Handle server message
     */
    async handleServerMessage(channel, message) {
        // Extract server name from channel
        const serverName = channel.replace(this.SERVER_CHANNEL_PREFIX, '');
        const server = this.servers.get(serverName);
        if (!server) {
            this.logger.warn(`Unknown server: ${serverName}`);
            return;
        }
        try {
            // Execute capability or tool based on action
            const action = message.payload.action;
            const params = message.payload.params || {};
            let result;
            if (action.includes('.')) {
                // Tool execution (format: toolName.execute)
                const [toolName, method] = action.split('.');
                if (method === 'execute') {
                    result = await server.executeTool(toolName, params);
                }
            }
            else {
                // Capability execution
                result = await server.executeCapability(action, params);
            }
            // Send response
            await this.sendResponse(message, result);
        }
        catch (error) {
            await this.sendError(message, error.message);
        }
    }
    /**
     * Send response message
     */
    async sendResponse(originalMessage, result) {
        const response = { id: `${originalMessage.id}_response`,
            timestamp: new Date().toISOString(),
            sender: originalMessage.recipient || 'mcp-broker',
            recipient: originalMessage.sender,
            type: 'response',
            payload: {
                server: originalMessage.payload.server,
                action: originalMessage.payload.action,
                result
            },
            metadata: {
                correlationId: originalMessage.id,
                ...originalMessage.metadata
            }
        };
        // Send to appropriate channel
        if (originalMessage.sender) {
            const channel = `${this.DIRECT_CHANNEL_PREFIX}${originalMessage.sender}`;
            await this.publisher.publish(channel, JSON.stringify(response));
        }
        else {
            // If no sender specified, broadcast the response
            await this.publisher.publish(this.BROADCAST_CHANNEL, JSON.stringify(response));
        }
    }
    /**
     * Send error message
     */
    async sendError(originalMessage, errorMessage) {
        const response = { id: `${originalMessage.id}_error`,
            timestamp: new Date().toISOString(),
            sender: originalMessage.recipient || 'mcp-broker',
            recipient: originalMessage.sender,
            type: 'error',
            payload: {
                server: originalMessage.payload.server,
                action: originalMessage.payload.action,
                error: errorMessage
            },
            metadata: {
                correlationId: originalMessage.id,
                ...originalMessage.metadata
            }
        };
        // Send to appropriate channel
        if (originalMessage.sender) {
            const channel = `${this.DIRECT_CHANNEL_PREFIX}${originalMessage.sender}`;
            await this.publisher.publish(channel, JSON.stringify(response));
        }
        else {
            // If no sender specified, broadcast the response
            await this.publisher.publish(this.BROADCAST_CHANNEL, JSON.stringify(response));
        }
    }
    /**
     * Execute MCP directive
     *
     * This is the main entry point for all MCP directives
     */
    async executeDirective(serverName, action, params = {}, options = {}) {
        const { sender = 'api', recipient, metadata = {} } = options;
        // Check if server exists
        if (!this.servers.has(serverName)) {
            throw new Error(`Unknown MCP server: ${serverName}`);
        }
        // Create message
        const message = { id: `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
            sender,
            recipient,
            type: 'command',
            payload: {
                server: serverName,
                action,
                params
            },
            metadata
        };
        // Determine channel
        let channel;
        if (recipient) {
            channel = `${this.DIRECT_CHANNEL_PREFIX}${recipient}`;
        }
        else {
            channel = `${this.SERVER_CHANNEL_PREFIX}${serverName}`;
        }
        // Publish message
        await this.publisher.publish(channel, JSON.stringify(message));
        // For local execution, also handle directly
        const server = this.servers.get(serverName);
        try {
            if (action.includes('.')) {
                // Tool execution (format: toolName.execute)
                const [toolName, method] = action.split('.');
                if (method === 'execute') {
                    return await server.executeTool(toolName, params);
                }
                throw new Error(`Unknown method: ${method}`);
            }
            else {
                // Capability execution
                return await server.executeCapability(action, params);
            }
        }
        catch (error) {
            this.logger.error(`Error executing directive: ${error.message}`);
            throw error;
        }
    }
    /**
     * Register message handler
     */
    registerHandler(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type).add(handler);
        // Return unsubscribe function
        return () => {
            const handlers = this.handlers.get(type);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.handlers.delete(type);
                }
            }
        };
    }
    /**
     * Get all available MCP capabilities
     */
    getAllCapabilities() {
        const capabilities = {};
        for (const [serverName, server] of this.servers.entries()) {
            capabilities[serverName] = server.getCapabilities();
        }
        return capabilities;
    }
    /**
     * Get all available MCP tools
     */
    getAllTools() {
        const tools = {};
        for (const [serverName, server] of this.servers.entries()) {
            tools[serverName] = server.getTools();
        }
        return tools;
    }
};
exports.MCPBrokerService = MCPBrokerService;
exports.MCPBrokerService = MCPBrokerService = MCPBrokerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        MCPAgentServer_1.MCPAgentServer,
        MCPChatServer_1.MCPChatServer,
        MCPWorkflowServer_1.MCPWorkflowServer,
        MCPFuseServer_1.MCPFuseServer,
        MCPFileCoordinationServer_1.MCPFileCoordinationServer,
        MCPRAGServer_1.MCPRAGServer])
], MCPBrokerService);
//# sourceMappingURL=mcp-broker.service.js.map