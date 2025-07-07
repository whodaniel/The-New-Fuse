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
var A2AService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AService = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
const uuid_1 = require("uuid");
const types_1 = require("./types");
const redis_adapter_1 = require("./redis-adapter");
const websocket_adapter_1 = require("./websocket-adapter");
let A2AService = A2AService_1 = class A2AService extends events_1.EventEmitter {
    config;
    redisAdapter;
    websocketAdapter;
    logger = new common_1.Logger(A2AService_1.name);
    isInitialized = false;
    constructor(config, redisAdapter, websocketAdapter) {
        super();
        this.config = config;
        this.redisAdapter = redisAdapter;
        this.websocketAdapter = websocketAdapter;
        this.setupEventForwarding();
    }
    async onModuleInit() {
        try {
            await this.redisAdapter.onModuleInit();
            if (this.websocketAdapter) {
                // WebSocket adapter is initialized by NestJS automatically
                this.logger.log('WebSocket adapter available');
            }
            this.isInitialized = true;
            this.logger.log('A2A Service initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize A2A Service:', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        this.isInitialized = false;
        if (this.redisAdapter) {
            await this.redisAdapter.onModuleDestroy();
        }
        this.logger.log('A2A Service destroyed');
    }
    setupEventForwarding() {
        // Forward events from Redis adapter
        const eventsToForward = [
            'agent:registered',
            'agent:unregistered',
            'agent:status_changed',
            'message:received',
            'conversation:started',
            'conversation:ended',
            'heartbeat:received',
            'error'
        ];
        eventsToForward.forEach(event => {
            this.redisAdapter.on(event, (...args) => {
                this.emit(event, ...args);
            });
        });
    }
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new types_1.A2AError('A2A Service not initialized', 'NOT_INITIALIZED');
        }
    }
    // Agent Registration
    async registerAgent(registration) {
        this.ensureInitialized();
        this.logger.log(`Registering agent: ${registration.agentId} (${registration.name})`);
        await this.redisAdapter.registerAgent(registration);
        // Start automatic heartbeat if agent supports it
        if (registration.metadata?.autoHeartbeat) {
            this.startAutoHeartbeat(registration.agentId);
        }
    }
    async unregisterAgent(agentId) {
        this.ensureInitialized();
        this.logger.log(`Unregistering agent: ${agentId}`);
        this.stopAutoHeartbeat(agentId);
        await this.redisAdapter.unregisterAgent(agentId);
    }
    async updateAgentStatus(agentId, status) {
        this.ensureInitialized();
        await this.redisAdapter.updateAgentStatus(agentId, status);
    }
    // Messaging
    async sendMessage(message) {
        this.ensureInitialized();
        // Add ID and timestamp if not provided
        if (!message.id) {
            message.id = (0, uuid_1.v4)();
        }
        if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
        }
        await this.redisAdapter.sendMessage(message);
        // Also send via WebSocket if available and target agent is connected
        if (this.websocketAdapter && message.toAgent) {
            if (this.websocketAdapter.isAgentConnected(message.toAgent)) {
                await this.websocketAdapter.sendDirectMessage(message);
            }
        }
    }
    async sendRequest(fromAgent, toAgent, payload, options = {}) {
        this.ensureInitialized();
        this.logger.debug(`Sending request from ${fromAgent} to ${toAgent}`);
        return await this.redisAdapter.sendRequest(fromAgent, toAgent, payload, options);
    }
    async sendResponse(originalMessage, responsePayload, fromAgent) {
        this.ensureInitialized();
        const response = {
            id: (0, uuid_1.v4)(),
            protocolVersion: originalMessage.protocolVersion,
            timestamp: new Date().toISOString(),
            fromAgent,
            toAgent: originalMessage.fromAgent,
            type: types_1.MessageType.RESPONSE,
            priority: originalMessage.priority,
            conversationId: originalMessage.conversationId,
            requestId: originalMessage.requestId,
            payload: responsePayload
        };
        await this.sendMessage(response);
    }
    async broadcast(fromAgent, payload, options = {}) {
        this.ensureInitialized();
        this.logger.debug(`Broadcasting from ${fromAgent} to channel: ${options.channel || 'global'}`);
        await this.redisAdapter.broadcast(fromAgent, payload, options);
    }
    // Conversations
    async startConversation(initiator, participants, topic) {
        this.ensureInitialized();
        this.logger.log(`Starting conversation between ${participants.join(', ')} (initiated by ${initiator})`);
        return await this.redisAdapter.startConversation(initiator, participants, topic);
    }
    async joinConversation(conversationId, agentId) {
        this.ensureInitialized();
        await this.redisAdapter.joinConversation(conversationId, agentId);
    }
    async leaveConversation(conversationId, agentId) {
        this.ensureInitialized();
        await this.redisAdapter.leaveConversation(conversationId, agentId);
    }
    // Discovery
    async discoverAgents(criteria = {}) {
        this.ensureInitialized();
        return await this.redisAdapter.discoverAgents(criteria);
    }
    async findAgentsByCapability(capabilityName) {
        return await this.discoverAgents({ capabilities: [capabilityName] });
    }
    async getOnlineAgents() {
        return await this.discoverAgents({ status: types_1.AgentStatus.ONLINE });
    }
    // Health and Monitoring
    async sendHeartbeat(heartbeat) {
        this.ensureInitialized();
        await this.redisAdapter.sendHeartbeat(heartbeat);
    }
    async getAgentHealth(agentId) {
        this.ensureInitialized();
        return await this.redisAdapter.getAgentHealth(agentId);
    }
    // High-level helper methods
    async createAgentCommunicationChannel(agentIds, topic) {
        if (agentIds.length < 2) {
            throw new types_1.A2AError('At least 2 agents required for communication channel', 'INVALID_PARTICIPANTS');
        }
        const initiator = agentIds[0];
        const participants = agentIds.slice(1);
        return await this.startConversation(initiator, participants, topic);
    }
    async facilitateAgentHandshake(agent1Id, agent2Id) {
        // Get agent information
        const agents = await this.discoverAgents();
        const agent1 = agents.find(a => a.agentId === agent1Id);
        const agent2 = agents.find(a => a.agentId === agent2Id);
        if (!agent1 || !agent2) {
            throw new types_1.A2AError('One or both agents not found', 'AGENT_NOT_FOUND');
        }
        // Send handshake messages
        const handshake1to2 = {
            id: (0, uuid_1.v4)(),
            protocolVersion: '1.0.0',
            timestamp: new Date().toISOString(),
            fromAgent: agent1Id,
            toAgent: agent2Id,
            type: types_1.MessageType.HANDSHAKE,
            priority: types_1.Priority.HIGH,
            payload: {
                agentInfo: {
                    name: agent1.name,
                    type: agent1.type,
                    capabilities: agent1.capabilities
                },
                purpose: 'agent_introduction'
            }
        };
        const handshake2to1 = {
            id: (0, uuid_1.v4)(),
            protocolVersion: '1.0.0',
            timestamp: new Date().toISOString(),
            fromAgent: agent2Id,
            toAgent: agent1Id,
            type: types_1.MessageType.HANDSHAKE,
            priority: types_1.Priority.HIGH,
            payload: {
                agentInfo: {
                    name: agent2.name,
                    type: agent2.type,
                    capabilities: agent2.capabilities
                },
                purpose: 'agent_introduction'
            }
        };
        await Promise.all([
            this.sendMessage(handshake1to2),
            this.sendMessage(handshake2to1)
        ]);
        this.logger.log(`Facilitated handshake between ${agent1.name} and ${agent2.name}`);
    }
    async routeMessageByCapability(fromAgent, targetCapability, payload, options = {}) {
        // Find agents with the required capability
        const capableAgents = await this.findAgentsByCapability(targetCapability);
        if (capableAgents.length === 0) {
            throw new types_1.A2AError(`No agents found with capability: ${targetCapability}`, 'NO_CAPABLE_AGENTS');
        }
        // Select target agent (prefer specified agent, otherwise pick first available)
        let targetAgent = capableAgents.find(a => a.agentId === options.preferredAgent);
        if (!targetAgent) {
            // Find online agents first
            const onlineAgents = capableAgents.filter(async (a) => {
                const health = await this.getAgentHealth(a.agentId);
                return health?.status === types_1.AgentStatus.ONLINE;
            });
            targetAgent = onlineAgents.length > 0 ? onlineAgents[0] : capableAgents[0];
        }
        const message = {
            id: (0, uuid_1.v4)(),
            protocolVersion: '1.0.0',
            timestamp: new Date().toISOString(),
            fromAgent,
            toAgent: targetAgent.agentId,
            type: types_1.MessageType.REQUEST,
            priority: options.priority || types_1.Priority.MEDIUM,
            payload,
            routing: {
                targetCapability
            }
        };
        await this.sendMessage(message);
    }
    // Auto-heartbeat management
    heartbeatIntervals = new Map();
    startAutoHeartbeat(agentId) {
        if (this.heartbeatIntervals.has(agentId)) {
            return; // Already running
        }
        const interval = setInterval(async () => {
            try {
                const heartbeat = {
                    agentId,
                    timestamp: new Date().toISOString(),
                    status: types_1.AgentStatus.ONLINE,
                    lastActivity: new Date().toISOString()
                };
                await this.sendHeartbeat(heartbeat);
            }
            catch (error) {
                this.logger.error(`Failed to send auto-heartbeat for agent ${agentId}:`, error);
            }
        }, this.config.monitoring?.heartbeatInterval || 30000);
        this.heartbeatIntervals.set(agentId, interval);
    }
    stopAutoHeartbeat(agentId) {
        const interval = this.heartbeatIntervals.get(agentId);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(agentId);
        }
    }
    // Statistics and monitoring
    async getSystemStats() {
        this.ensureInitialized();
        const allAgents = await this.discoverAgents();
        const onlineAgents = await this.getOnlineAgents();
        // TODO: Implement conversation and message counting
        return {
            totalAgents: allAgents.length,
            onlineAgents: onlineAgents.length,
            activeConversations: 0, // Placeholder
            messagesInLastHour: 0 // Placeholder
        };
    }
    // Connection status
    getConnectedWebSocketAgents() {
        return this.websocketAdapter ? this.websocketAdapter.getConnectedAgents() : [];
    }
    isAgentConnectedViaWebSocket(agentId) {
        return this.websocketAdapter ? this.websocketAdapter.isAgentConnected(agentId) : false;
    }
};
exports.A2AService = A2AService;
exports.A2AService = A2AService = A2AService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, redis_adapter_1.A2ARedisAdapter,
        websocket_adapter_1.A2AWebSocketAdapter])
], A2AService);
