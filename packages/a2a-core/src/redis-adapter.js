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
var A2ARedisAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2ARedisAdapter = void 0;
const common_1 = require("@nestjs/common");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const events_1 = require("events");
// @ts-ignore
const uuid_1 = require("uuid");
const types_js_1 = require("./types.js");
let A2ARedisAdapter = A2ARedisAdapter_1 = class A2ARedisAdapter extends events_1.EventEmitter {
    constructor(config, redisService) {
        super();
        this.config = config;
        this.redisService = redisService;
        this.logger = new common_1.Logger(A2ARedisAdapter_1.name);
        this.requestTimeouts = new Map();
        this.pendingRequests = new Map();
        this.isConnected = false;
        this.keyPrefix = config.redis?.keyPrefix || 'a2a:';
    }
    async onModuleInit() {
        try {
            // UnifiedRedisService handles connection management
            await this.setupSubscriptions();
            this.isConnected = true;
            this.logger.log('A2A Redis Adapter initialized successfully');
        }
        catch (error) {
            this.isConnected = false;
            // Log error but don't crash the application - operate in degraded mode
            this.logger.warn('A2A Redis Adapter failed to initialize - operating in degraded mode');
            this.logger.warn('Redis connection error:', error instanceof Error ? error.message : String(error));
            this.logger.warn('A2A agent-to-agent communication will be unavailable until Redis is connected');
            // Emit event for monitoring
            this.emit('connection:failed', error);
        }
    }
    /**
     * Check if Redis is connected and available for A2A communication
     */
    get connected() {
        return this.isConnected;
    }
    /**
     * Helper method to check connection before operations
     */
    ensureConnected() {
        if (!this.isConnected) {
            throw new types_js_1.A2AConnectionError('A2A Redis Adapter is not connected - operating in degraded mode');
        }
    }
    async onModuleDestroy() {
        // Clear all timeouts
        for (const timeout of this.requestTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.requestTimeouts.clear();
        // Reject pending requests
        for (const { reject } of this.pendingRequests.values()) {
            reject(new types_js_1.A2AError('Service shutting down', 'SHUTDOWN'));
        }
        this.pendingRequests.clear();
        // UnifiedRedisService handles connection cleanup
        this.logger.log('A2A Redis Adapter destroyed');
    }
    async setupSubscriptions() {
        // Subscribe to global message channels using UnifiedRedisService
        const channels = [
            `${this.keyPrefix}messages:global`,
            `${this.keyPrefix}responses:global`,
            `${this.keyPrefix}heartbeats:global`,
            `${this.keyPrefix}events:global`,
        ];
        for (const channel of channels) {
            await this.redisService.subscribe(channel, (message) => {
                this.handleRedisMessage(channel, JSON.stringify(message?.message ?? message)).catch((error) => {
                    this.logger.error('Error handling Redis message:', error);
                });
            });
        }
    }
    async handleRedisMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            if (channel.endsWith(':messages:global')) {
                const parsedMessage = types_js_1.A2AMessageSchema.parse(data);
                this.emit('message:received', parsedMessage);
                // Handle responses to pending requests
                if (parsedMessage.type === types_js_1.A2AMessageType.DATA_RESPONSE &&
                    parsedMessage.metadata?.originalMessageId) {
                    this.handleResponse({ ...parsedMessage, payload: parsedMessage.payload || {} });
                }
            }
            else if (channel.endsWith(':heartbeats:global')) {
                const heartbeat = types_js_1.AgentHeartbeatSchema.parse(data);
                this.emit('heartbeat:received', heartbeat);
            }
            else if (channel.endsWith(':events:global')) {
                this.handleSystemEvent(data);
            }
        }
        catch (error) {
            this.logger.error('Failed to parse Redis message:', error);
        }
    }
    handleResponse(response) {
        const originalMessageId = response.metadata?.originalMessageId;
        if (!originalMessageId)
            return;
        const pending = this.pendingRequests.get(originalMessageId);
        if (pending) {
            const timeout = this.requestTimeouts.get(originalMessageId);
            if (timeout) {
                clearTimeout(timeout);
                this.requestTimeouts.delete(originalMessageId);
            }
            this.pendingRequests.delete(originalMessageId);
            pending.resolve(response);
        }
    }
    handleSystemEvent(event) {
        const { type, data } = event;
        switch (type) {
            case 'agent:registered':
                this.emit('agent:registered', data);
                break;
            case 'agent:unregistered':
                this.emit('agent:unregistered', data);
                break;
            case 'agent:status_changed':
                this.emit('agent:status_changed', data.agentId, data.status);
                break;
            case 'conversation:started':
                this.emit('conversation:started', data);
                break;
            case 'conversation:ended':
                this.emit('conversation:ended', data);
                break;
            default:
                this.logger.warn(`Unknown system event type: ${type}`);
        }
    }
    async registerAgent(registration) {
        try {
            // Validate registration
            const validatedRegistration = types_js_1.AgentRegistrationSchema.parse(registration);
            // Store agent registration
            const agentKey = `${this.keyPrefix}agents:${validatedRegistration.agentId}`;
            await this.redisService.set(agentKey, JSON.stringify(validatedRegistration), this.config.redis?.ttl || 3600);
            // Add to agents index
            await this.redisService.sadd(`${this.keyPrefix}agents:index`, validatedRegistration.agentId);
            // Set initial status
            await this.updateAgentStatus(validatedRegistration.agentId, types_js_1.AgentStatus.ONLINE);
            // Publish registration event
            await this.publishSystemEvent('agent:registered', validatedRegistration);
            this.logger.log(`Agent registered: ${validatedRegistration.agentId}`);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_js_1.A2AValidationError('Invalid agent registration', error.message);
            }
            throw error;
        }
    }
    async unregisterAgent(agentId) {
        // Remove agent data
        await this.redisService.del(`${this.keyPrefix}agents:${agentId}`);
        await this.redisService.del(`${this.keyPrefix}agents:${agentId}:status`);
        await this.redisService.del(`${this.keyPrefix}agents:${agentId}:heartbeat`);
        // Remove from index
        await this.redisService.srem(`${this.keyPrefix}agents:index`, agentId);
        // Publish unregistration event
        await this.publishSystemEvent('agent:unregistered', agentId);
        this.logger.log(`Agent unregistered: ${agentId}`);
    }
    async updateAgentStatus(agentId, status) {
        const statusKey = `${this.keyPrefix}agents:${agentId}:status`;
        await this.redisService.set(statusKey, status, this.config.redis?.ttl || 3600);
        // Publish status change event
        await this.publishSystemEvent('agent:status_changed', { agentId, status });
    }
    async sendMessage(message) {
        try {
            // Ensure payload exists
            const messageWithPayload = {
                ...message,
                payload: message.payload ?? {},
                timestamp: message.timestamp || Date.now(),
            };
            // Validate message
            const validatedMessage = types_js_1.A2AMessageSchema.parse(messageWithPayload);
            // Store message for audit/history
            await this.storeMessage({ ...validatedMessage, payload: validatedMessage.payload || {} });
            // Publish to appropriate channels using UnifiedRedisService
            if (validatedMessage.toAgent) {
                // Direct message
                await this.redisService.publish(`${this.keyPrefix}agents:${validatedMessage.toAgent}:messages`, { message: validatedMessage });
            }
            else {
                // Broadcast
                await this.redisService.publish(`${this.keyPrefix}messages:global`, {
                    message: validatedMessage,
                });
            }
            // Also publish to conversation channel if part of conversation
            if (validatedMessage.conversationId) {
                await this.redisService.publish(`${this.keyPrefix}conversations:${validatedMessage.conversationId}:messages`, { message: validatedMessage });
            }
            this.logger.debug(`Message sent: ${validatedMessage.id}`);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_js_1.A2AValidationError('Invalid message format', error.message);
            }
            throw error;
        }
    }
    async sendRequest(fromAgent, toAgent, payload, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const timeout = options.timeout || 30000; // 30 seconds default
        const message = {
            id: (0, uuid_1.v4)(),
            timestamp: Date.now(),
            fromAgent,
            toAgent,
            type: types_js_1.A2AMessageType.DATA_REQUEST,
            priority: options.priority || types_js_1.A2APriority.MEDIUM,
            conversationId: options.conversationId,
            payload,
            metadata: { requestId },
        };
        // Set up response handling
        const responsePromise = new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            // Set timeout
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new types_js_1.A2ATimeoutError(`Request timeout after ${timeout}ms`, fromAgent));
            }, timeout);
            this.requestTimeouts.set(requestId, timeoutHandle);
        });
        // Send the request
        await this.sendMessage(message);
        return responsePromise;
    }
    async broadcast(fromAgent, payload, options = {}) {
        const message = {
            id: (0, uuid_1.v4)(),
            timestamp: Date.now(),
            fromAgent,
            toAgent: '*', // Broadcast
            type: types_js_1.A2AMessageType.DATA_REQUEST,
            priority: options.priority || types_js_1.A2APriority.MEDIUM,
            payload,
            metadata: {
                channel: options.channel,
                topic: options.topic,
            },
        };
        await this.sendMessage(message);
    }
    async startConversation(initiator, participants, topic) {
        const conversation = {
            id: (0, uuid_1.v4)(),
            participants: [initiator, ...participants.filter((p) => p !== initiator)],
            initiator,
            topic,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // Validate conversation
        const validatedConversation = types_js_1.ConversationSchema.parse(conversation);
        // Store conversation
        const conversationKey = `${this.keyPrefix}conversations:${validatedConversation.id}`;
        await this.redisService.set(conversationKey, JSON.stringify(validatedConversation), this.config.redis?.ttl || 3600);
        // Add participants to conversation
        for (const participant of validatedConversation.participants) {
            await this.redisService.sadd(`${this.keyPrefix}agents:${participant}:conversations`, validatedConversation.id);
        }
        // Publish conversation started event
        await this.publishSystemEvent('conversation:started', validatedConversation);
        this.logger.log(`Conversation started: ${validatedConversation.id}`);
        return validatedConversation.id;
    }
    async joinConversation(conversationId, agentId) {
        const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
        const conversationData = await this.redisService.get(conversationKey);
        if (!conversationData) {
            throw new types_js_1.A2AError('Conversation not found', 'NOT_FOUND');
        }
        const conversation = JSON.parse(conversationData);
        if (!conversation.participants.includes(agentId)) {
            conversation.participants.push(agentId);
            conversation.updatedAt = new Date().toISOString();
            // Update conversation
            await this.redisService.set(conversationKey, JSON.stringify(conversation), this.config.redis?.ttl || 3600);
            // Add agent to conversation
            await this.redisService.sadd(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
        }
    }
    async leaveConversation(conversationId, agentId) {
        const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
        const conversationData = await this.redisService.get(conversationKey);
        if (!conversationData) {
            return; // Conversation doesn't exist, nothing to do
        }
        const conversation = JSON.parse(conversationData);
        conversation.participants = conversation.participants.filter((p) => p !== agentId);
        conversation.updatedAt = new Date().toISOString();
        if (conversation.participants.length === 0) {
            // End conversation if no participants left
            conversation.status = 'completed';
            await this.publishSystemEvent('conversation:ended', conversationId);
        }
        // Update conversation
        await this.redisService.set(conversationKey, JSON.stringify(conversation), this.config.redis?.ttl || 3600);
        // Remove agent from conversation
        await this.redisService.srem(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
    }
    async discoverAgents(criteria = {}) {
        const agentIds = await this.redisService.smembers(`${this.keyPrefix}agents:index`);
        const agents = [];
        for (const agentId of agentIds) {
            const agentData = await this.redisService.get(`${this.keyPrefix}agents:${agentId}`);
            if (!agentData)
                continue;
            try {
                const agent = JSON.parse(agentData);
                // Apply filters
                if (criteria.type && agent.type !== criteria.type)
                    continue;
                if (criteria.status) {
                    const status = await this.redisService.get(`${this.keyPrefix}agents:${agentId}:status`);
                    if (status !== criteria.status)
                        continue;
                }
                if (criteria.capabilities && criteria.capabilities.length > 0) {
                    const hasAllCapabilities = criteria.capabilities.every((cap) => agent.capabilities.some((agentCap) => agentCap === cap));
                    if (!hasAllCapabilities)
                        continue;
                }
                agents.push(agent);
            }
            catch (error) {
                this.logger.warn(`Failed to parse agent data for ${agentId}:`, error);
            }
        }
        return agents;
    }
    async sendHeartbeat(heartbeat) {
        try {
            const validatedHeartbeat = types_js_1.AgentHeartbeatSchema.parse(heartbeat);
            // Store heartbeat
            const heartbeatKey = `${this.keyPrefix}agents:${validatedHeartbeat.agentId}:heartbeat`;
            await this.redisService.set(heartbeatKey, JSON.stringify(validatedHeartbeat), this.config.redis?.ttl || 3600);
            // Publish heartbeat
            await this.redisService.publish(`${this.keyPrefix}heartbeats:global`, {
                message: JSON.stringify(validatedHeartbeat),
            });
            // Update agent status based on heartbeat
            await this.updateAgentStatus(validatedHeartbeat.agentId, validatedHeartbeat.status);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_js_1.A2AValidationError('Invalid heartbeat format', error.message);
            }
            throw error;
        }
    }
    async getAgentHealth(agentId) {
        const heartbeatData = await this.redisService.get(`${this.keyPrefix}agents:${agentId}:heartbeat`);
        if (!heartbeatData)
            return null;
        try {
            return JSON.parse(heartbeatData);
        }
        catch (error) {
            this.logger.warn(`Failed to parse heartbeat data for ${agentId}:`, error);
            return null;
        }
    }
    async storeMessage(message) {
        // Store message with TTL for audit/history
        const messageKey = `${this.keyPrefix}messages:${message.id}`;
        await this.redisService.set(messageKey, JSON.stringify(message), this.config.redis?.ttl || 3600);
        // Add to conversation history if applicable
        if (message.conversationId) {
            await this.redisService.lpush(`${this.keyPrefix}conversations:${message.conversationId}:history`, message.id);
            // Keep only recent messages in conversation history
            await this.redisService.ltrim(`${this.keyPrefix}conversations:${message.conversationId}:history`, 0, 999 // Keep last 1000 messages
            );
        }
    }
    async publishSystemEvent(type, data) {
        await this.redisService.publish(`${this.keyPrefix}events:global`, {
            message: { type, data, timestamp: Date.now() },
        });
    }
};
exports.A2ARedisAdapter = A2ARedisAdapter;
exports.A2ARedisAdapter = A2ARedisAdapter = A2ARedisAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, infrastructure_1.UnifiedRedisService])
], A2ARedisAdapter);
//# sourceMappingURL=redis-adapter.js.map