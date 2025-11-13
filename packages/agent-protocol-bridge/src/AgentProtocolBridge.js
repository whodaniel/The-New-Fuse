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
var AgentProtocolBridge_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentProtocolBridge = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
const src_1 = require("../../database/src");
const prisma_enums_1 = require("./types/prisma-enums");
const src_2 = require("../../a2a-core/src");
const src_3 = require("../../mcp-core/src");
let AgentProtocolBridge = AgentProtocolBridge_1 = class AgentProtocolBridge extends events_1.EventEmitter {
    prisma;
    a2aService;
    mcpServer;
    logger = new common_1.Logger(AgentProtocolBridge_1.name);
    activeConnections = new Map();
    protocolAdapters = new Map();
    translationCache = new Map();
    constructor(prisma, a2aService, mcpServer) {
        super();
        this.prisma = prisma;
        this.a2aService = a2aService;
        this.mcpServer = mcpServer;
    }
    async onModuleInit() {
        this.logger.log('Initializing Agent Protocol Bridge...');
        try {
            await this.loadExistingConnections();
            await this.initializeProtocolAdapters();
            this.setupEventListeners();
            this.logger.log('Agent Protocol Bridge initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize Agent Protocol Bridge: ${error.message}`);
            throw error;
        }
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down Agent Protocol Bridge...');
        for (const [connectionId, connection] of this.activeConnections) {
            await this.disconnectAgent(connection.agentId, connection.bridgeType);
        }
        this.removeAllListeners();
        this.logger.log('Agent Protocol Bridge shutdown complete');
    }
    /**
     * Connect an agent to a target system via specified bridge type
     */
    async connectAgent(agentId, bridgeType, targetSystem, config) {
        try {
            this.logger.log(`Connecting agent ${agentId} to ${targetSystem} via ${bridgeType}`);
            // Validate agent exists
            const agent = await this.prisma.agent.findUnique({
                where: { id: agentId },
                include: { protocolAdapters: true, bridgeConnections: true }
            });
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            // Create bridge connection
            const bridgeConnection = await this.prisma.agentBridgeConnection.upsert({
                where: {
                    agentId_bridgeType_targetSystem: {
                        agentId,
                        bridgeType,
                        targetSystem
                    }
                },
                update: {
                    connectionState: prisma_enums_1.ConnectionState.CONNECTING,
                    configuration: config || {},
                    lastConnectedAt: new Date()
                },
                create: {
                    agentId,
                    bridgeType,
                    targetSystem,
                    connectionState: prisma_enums_1.ConnectionState.CONNECTING,
                    configuration: config || {},
                    createdAt: new Date(),
                    lastConnectedAt: new Date()
                }
            });
            // Establish actual connection based on bridge type
            const success = await this.establishConnection(agent, bridgeType, targetSystem, config);
            if (success) {
                // Update connection state
                await this.prisma.agentBridgeConnection.update({
                    where: { id: bridgeConnection.id },
                    data: {
                        connectionState: prisma_enums_1.ConnectionState.CONNECTED,
                        lastConnectedAt: new Date()
                    }
                });
                // Store in active connections
                this.activeConnections.set(`${agentId}-${bridgeType}-${targetSystem}`, {
                    agentId,
                    bridgeType,
                    targetSystem,
                    state: prisma_enums_1.ConnectionState.CONNECTED,
                    config
                });
                this.emit('agentConnected', { agentId, bridgeType, targetSystem });
                this.logger.log(`Successfully connected agent ${agentId} to ${targetSystem}`);
                return true;
            }
            else {
                // Update connection state to failed
                await this.prisma.agentBridgeConnection.update({
                    where: { id: bridgeConnection.id },
                    data: {
                        connectionState: prisma_enums_1.ConnectionState.FAILED,
                        lastErrorAt: new Date()
                    }
                });
                this.logger.error(`Failed to connect agent ${agentId} to ${targetSystem}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error(`Error connecting agent ${agentId}: ${error.message}`);
            return false;
        }
    }
    /**
     * Disconnect an agent from a target system
     */
    async disconnectAgent(agentId, bridgeType) {
        try {
            this.logger.log(`Disconnecting agent ${agentId} from ${bridgeType}`);
            // Find and remove from active connections
            const connectionKey = Array.from(this.activeConnections.keys())
                .find(key => key.startsWith(`${agentId}-${bridgeType}`));
            if (connectionKey) {
                this.activeConnections.delete(connectionKey);
            }
            // Update database
            await this.prisma.agentBridgeConnection.updateMany({
                where: {
                    agentId,
                    bridgeType
                },
                data: {
                    connectionState: prisma_enums_1.ConnectionState.DISCONNECTED,
                    lastDisconnectedAt: new Date()
                }
            });
            this.emit('agentDisconnected', { agentId, bridgeType });
            this.logger.log(`Successfully disconnected agent ${agentId} from ${bridgeType}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error disconnecting agent ${agentId}: ${error.message}`);
            return false;
        }
    }
    /**
     * Translate a message between protocols
     */
    async translateMessage(message, targetProtocol, agentId) {
        try {
            const cacheKey = `${message.id}-${targetProtocol}`;
            // Check cache first
            if (this.translationCache.has(cacheKey)) {
                return this.translationCache.get(cacheKey);
            }
            let translatedMessage;
            // Get appropriate adapter for translation
            const adapter = await this.getProtocolAdapter(message.protocol, targetProtocol, agentId);
            if (adapter && typeof adapter.translateMessage === 'function') {
                translatedMessage = await adapter.translateMessage(message, targetProtocol);
            }
            else {
                // Fallback to direct translation
                translatedMessage = await this.performDirectTranslation(message, targetProtocol);
            }
            // Cache the result
            this.translationCache.set(cacheKey, translatedMessage);
            // Clean cache if it gets too large
            if (this.translationCache.size > 1000) {
                const firstKey = this.translationCache.keys().next().value;
                this.translationCache.delete(firstKey);
            }
            return translatedMessage;
        }
        catch (error) {
            this.logger.error(`Error translating message: ${error.message}`);
            return null;
        }
    }
    /**
     * Register a conversation between multiple agents
     */
    async registerConversation(agentIds, initiatorId, topic) {
        try {
            const conversation = await this.prisma.conversation.create({
                data: {
                    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    topic: topic || `Conversation initiated by ${initiatorId}`,
                    initiatorId,
                    participantIds: agentIds,
                    createdAt: new Date(),
                    isActive: true
                }
            });
            this.logger.log(`Created conversation ${conversation.id} with agents: ${agentIds.join(', ')}`);
            return conversation;
        }
        catch (error) {
            this.logger.error(`Error creating conversation: ${error.message}`);
            throw error;
        }
    }
    /**
     * Send a message through the bridge
     */
    async sendMessage(message, targetAgentId, conversationId) {
        try {
            // Route message based on protocol type
            switch (message.protocol) {
                case prisma_enums_1.ProtocolType.A2A:
                    return await this.sendA2AMessage(message, targetAgentId, conversationId);
                case prisma_enums_1.ProtocolType.MCP:
                    return await this.sendMCPMessage(message, targetAgentId);
                case prisma_enums_1.ProtocolType.CLAUDE_DEV:
                    return await this.sendClaudeMessage(message, targetAgentId);
                default:
                    this.logger.warn(`Unsupported protocol: ${message.protocol}`);
                    return false;
            }
        }
        catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            return false;
        }
    }
    /**
     * Get bridge status for an agent
     */
    async getBridgeStatus(agentId) {
        try {
            return await this.prisma.agentBridgeConnection.findMany({
                where: { agentId },
                orderBy: { lastConnectedAt: 'desc' }
            });
        }
        catch (error) {
            this.logger.error(`Error getting bridge status: ${error.message}`);
            return [];
        }
    }
    /**
     * Get performance metrics for the bridge
     */
    async getPerformanceMetrics(agentId) {
        try {
            const baseQuery = agentId ? { agentId } : {};
            const [totalConnections, activeConnections, failedConnections, messageCount] = await Promise.all([
                this.prisma.agentBridgeConnection.count({ where: baseQuery }),
                this.prisma.agentBridgeConnection.count({
                    where: { ...baseQuery, connectionState: prisma_enums_1.ConnectionState.CONNECTED }
                }),
                this.prisma.agentBridgeConnection.count({
                    where: { ...baseQuery, connectionState: prisma_enums_1.ConnectionState.FAILED }
                }),
                this.prisma.conversationMessage.count({
                    where: agentId ? {
                        conversation: {
                            participantIds: { has: agentId }
                        }
                    } : {}
                })
            ]);
            return {
                totalConnections,
                activeConnections,
                failedConnections,
                messageCount,
                successRate: totalConnections > 0 ? (activeConnections / totalConnections) * 100 : 0,
                cacheSize: this.translationCache.size,
                adapterCount: this.protocolAdapters.size,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error getting performance metrics: ${error.message}`);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    // Private helper methods
    async loadExistingConnections() {
        try {
            const connections = await this.prisma.agentBridgeConnection.findMany({
                where: { connectionState: prisma_enums_1.ConnectionState.CONNECTED }
            });
            for (const conn of connections) {
                this.activeConnections.set(`${conn.agentId}-${conn.bridgeType}-${conn.targetSystem}`, {
                    agentId: conn.agentId,
                    bridgeType: conn.bridgeType,
                    targetSystem: conn.targetSystem,
                    state: conn.connectionState,
                    config: conn.configuration
                });
            }
            this.logger.log(`Loaded ${connections.length} existing connections`);
        }
        catch (error) {
            this.logger.error(`Error loading existing connections: ${error.message}`);
        }
    }
    async initializeProtocolAdapters() {
        // Initialize protocol adapters based on available services
        if (this.a2aService) {
            this.protocolAdapters.set('a2a', this.a2aService);
        }
        if (this.mcpServer) {
            this.protocolAdapters.set('mcp', this.mcpServer);
        }
        this.logger.log(`Initialized ${this.protocolAdapters.size} protocol adapters`);
    }
    setupEventListeners() {
        // Set up event listeners for protocol-specific events
        if (this.a2aService) {
            this.a2aService.on?.('message', this.handleA2AMessage.bind(this));
        }
        if (this.mcpServer) {
            this.mcpServer.on?.('message', this.handleMCPMessage.bind(this));
        }
        this.logger.log('Event listeners configured');
    }
    async establishConnection(agent, bridgeType, targetSystem, config) {
        switch (bridgeType) {
            case prisma_enums_1.BridgeType.A2A:
                return await this.establishA2AConnection(agent, targetSystem, config);
            case prisma_enums_1.BridgeType.MCP:
                return await this.establishMCPConnection(agent, targetSystem, config);
            case prisma_enums_1.BridgeType.WEBSOCKET:
                return await this.establishWebSocketConnection(agent, targetSystem, config);
            case prisma_enums_1.BridgeType.REDIS:
                return await this.establishRedisConnection(agent, targetSystem, config);
            default:
                this.logger.warn(`Unsupported bridge type: ${bridgeType}`);
                return false;
        }
    }
    async establishA2AConnection(agent, targetSystem, config) {
        // A2A connection logic
        return this.a2aService ? true : false;
    }
    async establishMCPConnection(agent, targetSystem, config) {
        // MCP connection logic
        return this.mcpServer ? true : false;
    }
    async establishWebSocketConnection(agent, targetSystem, config) {
        // WebSocket connection logic
        return true; // Placeholder
    }
    async establishRedisConnection(agent, targetSystem, config) {
        // Redis connection logic
        return true; // Placeholder
    }
    async getProtocolAdapter(sourceProtocol, targetProtocol, agentId) {
        // Find appropriate adapter for protocol translation
        const adapter = await this.prisma.protocolAdapter.findFirst({
            where: {
                sourceProtocol,
                targetProtocol,
                isActive: true,
                ...(agentId && { agentId })
            }
        });
        return adapter ? this.protocolAdapters.get(adapter.name) : null;
    }
    async performDirectTranslation(message, targetProtocol) {
        // Basic direct translation logic
        return {
            ...message,
            id: `${message.id}-translated`,
            protocol: targetProtocol,
            metadata: {
                ...message.metadata,
                originalProtocol: message.protocol,
                translatedAt: new Date().toISOString()
            }
        };
    }
    async sendA2AMessage(message, targetAgentId, conversationId) {
        if (!this.a2aService)
            return false;
        const a2aMessage = {
            id: message.id,
            fromAgent: message.metadata?.fromAgent || 'system',
            toAgent: targetAgentId || '*',
            type: src_2.A2AMessageType.DATA_REQUEST,
            payload: message.payload,
            priority: src_2.A2APriority.MEDIUM,
            timestamp: message.timestamp.getTime(),
            conversationId,
            metadata: message.metadata
        };
        try {
            await this.a2aService.sendMessage(a2aMessage);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send A2A message: ${error.message}`);
            return false;
        }
    }
    async sendMCPMessage(message, targetAgentId) {
        // MCP message sending logic
        return this.mcpServer ? true : false;
    }
    async sendClaudeMessage(message, targetAgentId) {
        // Claude message sending logic
        return true; // Placeholder
    }
    async handleA2AMessage(message) {
        try {
            this.logger.debug(`Handling A2A message: ${message.id}`);
            // Process A2A message
            this.emit('messageReceived', {
                protocol: prisma_enums_1.ProtocolType.A2A,
                message
            });
        }
        catch (error) {
            this.logger.error(`Error handling A2A message: ${error.message}`);
        }
    }
    async handleMCPMessage(message) {
        try {
            this.logger.debug(`Handling MCP message: ${message.id}`);
            // Process MCP message
            this.emit('messageReceived', {
                protocol: prisma_enums_1.ProtocolType.MCP,
                message
            });
        }
        catch (error) {
            this.logger.error(`Error handling MCP message: ${error.message}`);
        }
    }
};
exports.AgentProtocolBridge = AgentProtocolBridge;
exports.AgentProtocolBridge = AgentProtocolBridge = AgentProtocolBridge_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof src_1.PrismaService !== "undefined" && src_1.PrismaService) === "function" ? _a : Object, Object, src_3.MCPServer])
], AgentProtocolBridge);
//# sourceMappingURL=AgentProtocolBridge.js.map