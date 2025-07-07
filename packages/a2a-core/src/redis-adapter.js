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
const ioredis_1 = require("ioredis");
const events_1 = require("events");
const uuid_1 = require("uuid");
const types_1 = require("./types");
let A2ARedisAdapter = A2ARedisAdapter_1 = class A2ARedisAdapter extends events_1.EventEmitter {
    config;
    logger = new common_1.Logger(A2ARedisAdapter_1.name);
    client;
    pubClient;
    subClient;
    keyPrefix;
    requestTimeouts = new Map();
    pendingRequests = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.keyPrefix = config.redis.keyPrefix || 'a2a:';
        // Initialize Redis clients
        const redisConfig = {
            ...config.redis,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        };
        this.client = new ioredis_1.Redis(redisConfig);
        this.pubClient = new ioredis_1.Redis(redisConfig);
        this.subClient = new ioredis_1.Redis(redisConfig);
    }
    async onModuleInit() {
        try {
            await Promise.all([
                this.client.connect(),
                this.pubClient.connect(),
                this.subClient.connect()
            ]);
            // Subscribe to global A2A channels
            await this.setupSubscriptions();
            this.logger.log('A2A Redis Adapter initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize A2A Redis Adapter:', error);
            throw new types_1.A2AConnectionError('Failed to connect to Redis');
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
            reject(new types_1.A2AError('Service shutting down', 'SHUTDOWN'));
        }
        this.pendingRequests.clear();
        // Disconnect Redis clients
        await Promise.all([
            this.client.disconnect(),
            this.pubClient.disconnect(),
            this.subClient.disconnect()
        ]);
        this.logger.log('A2A Redis Adapter destroyed');
    }
    async setupSubscriptions() {
        // Subscribe to global message channels
        await this.subClient.subscribe(`${this.keyPrefix}messages:global`, `${this.keyPrefix}responses:global`, `${this.keyPrefix}heartbeats:global`, `${this.keyPrefix}events:global`);
        this.subClient.on('message', (channel, message) => {
            this.handleRedisMessage(channel, message).catch(error => {
                this.logger.error('Error handling Redis message:', error);
            });
        });
    }
    async handleRedisMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            if (channel.endsWith(':messages:global')) {
                const parsedMessage = types_1.A2AMessageSchema.parse(data);
                this.emit('message:received', parsedMessage);
                // Handle responses to pending requests
                if (parsedMessage.type === types_1.MessageType.RESPONSE && parsedMessage.requestId) {
                    this.handleResponse(parsedMessage);
                }
            }
            else if (channel.endsWith(':heartbeats:global')) {
                const heartbeat = types_1.AgentHeartbeatSchema.parse(data);
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
        const pending = this.pendingRequests.get(response.requestId);
        if (pending) {
            const timeout = this.requestTimeouts.get(response.requestId);
            if (timeout) {
                clearTimeout(timeout);
                this.requestTimeouts.delete(response.requestId);
            }
            this.pendingRequests.delete(response.requestId);
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
            const validatedRegistration = types_1.AgentRegistrationSchema.parse(registration);
            // Store agent registration
            const agentKey = `${this.keyPrefix}agents:${validatedRegistration.agentId}`;
            await this.client.setex(agentKey, this.config.redis.ttl || 3600, JSON.stringify(validatedRegistration));
            // Add to agents index
            await this.client.sadd(`${this.keyPrefix}agents:index`, validatedRegistration.agentId);
            // Set initial status
            await this.updateAgentStatus(validatedRegistration.agentId, types_1.AgentStatus.ONLINE);
            // Publish registration event
            await this.publishSystemEvent('agent:registered', validatedRegistration);
            this.logger.log(`Agent registered: ${validatedRegistration.agentId}`);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_1.A2AValidationError('Invalid agent registration', error.message);
            }
            throw error;
        }
    }
    async unregisterAgent(agentId) {
        // Remove agent data
        await this.client.del(`${this.keyPrefix}agents:${agentId}`);
        await this.client.del(`${this.keyPrefix}agents:${agentId}:status`);
        await this.client.del(`${this.keyPrefix}agents:${agentId}:heartbeat`);
        // Remove from index
        await this.client.srem(`${this.keyPrefix}agents:index`, agentId);
        // Publish unregistration event
        await this.publishSystemEvent('agent:unregistered', agentId);
        this.logger.log(`Agent unregistered: ${agentId}`);
    }
    async updateAgentStatus(agentId, status) {
        const statusKey = `${this.keyPrefix}agents:${agentId}:status`;
        await this.client.setex(statusKey, this.config.redis.ttl || 3600, status);
        // Publish status change event
        await this.publishSystemEvent('agent:status_changed', { agentId, status });
    }
    async sendMessage(message) {
        try {
            // Validate message
            const validatedMessage = types_1.A2AMessageSchema.parse(message);
            // Add timestamp if not provided
            if (!validatedMessage.timestamp) {
                validatedMessage.timestamp = new Date().toISOString();
            }
            // Store message for audit/history
            await this.storeMessage(validatedMessage);
            // Publish to appropriate channels
            if (validatedMessage.toAgent) {
                // Direct message
                await this.pubClient.publish(`${this.keyPrefix}agents:${validatedMessage.toAgent}:messages`, JSON.stringify(validatedMessage));
            }
            else {
                // Broadcast
                await this.pubClient.publish(`${this.keyPrefix}messages:global`, JSON.stringify(validatedMessage));
            }
            // Also publish to conversation channel if part of conversation
            if (validatedMessage.conversationId) {
                await this.pubClient.publish(`${this.keyPrefix}conversations:${validatedMessage.conversationId}:messages`, JSON.stringify(validatedMessage));
            }
            this.logger.debug(`Message sent: ${validatedMessage.id}`);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_1.A2AValidationError('Invalid message format', error.message);
            }
            throw error;
        }
    }
    async sendRequest(fromAgent, toAgent, payload, options = {}) {
        const requestId = (0, uuid_1.v4)();
        const timeout = options.timeout || 30000; // 30 seconds default
        const message = {
            id: (0, uuid_1.v4)(),
            protocolVersion: '1.0.0',
            timestamp: new Date().toISOString(),
            fromAgent,
            toAgent,
            type: types_1.MessageType.REQUEST,
            priority: options.priority || types_1.Priority.MEDIUM,
            conversationId: options.conversationId,
            requestId,
            payload
        };
        // Set up response handling
        const responsePromise = new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            // Set timeout
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new types_1.A2ATimeoutError(`Request timeout after ${timeout}ms`, fromAgent));
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
            protocolVersion: '1.0.0',
            timestamp: new Date().toISOString(),
            fromAgent,
            type: types_1.MessageType.BROADCAST,
            priority: options.priority || types_1.Priority.MEDIUM,
            payload,
            routing: {
                channel: options.channel,
                topic: options.topic
            }
        };
        await this.sendMessage(message);
    }
    async startConversation(initiator, participants, topic) {
        const conversation = {
            id: (0, uuid_1.v4)(),
            participants: [initiator, ...participants.filter(p => p !== initiator)],
            initiator,
            topic,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Validate conversation
        const validatedConversation = types_1.ConversationSchema.parse(conversation);
        // Store conversation
        const conversationKey = `${this.keyPrefix}conversations:${validatedConversation.id}`;
        await this.client.setex(conversationKey, this.config.redis.ttl || 3600, JSON.stringify(validatedConversation));
        // Add participants to conversation
        for (const participant of validatedConversation.participants) {
            await this.client.sadd(`${this.keyPrefix}agents:${participant}:conversations`, validatedConversation.id);
        }
        // Publish conversation started event
        await this.publishSystemEvent('conversation:started', validatedConversation);
        this.logger.log(`Conversation started: ${validatedConversation.id}`);
        return validatedConversation.id;
    }
    async joinConversation(conversationId, agentId) {
        const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
        const conversationData = await this.client.get(conversationKey);
        if (!conversationData) {
            throw new types_1.A2AError('Conversation not found', 'NOT_FOUND');
        }
        const conversation = JSON.parse(conversationData);
        if (!conversation.participants.includes(agentId)) {
            conversation.participants.push(agentId);
            conversation.updatedAt = new Date().toISOString();
            // Update conversation
            await this.client.setex(conversationKey, this.config.redis.ttl || 3600, JSON.stringify(conversation));
            // Add agent to conversation
            await this.client.sadd(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
        }
    }
    async leaveConversation(conversationId, agentId) {
        const conversationKey = `${this.keyPrefix}conversations:${conversationId}`;
        const conversationData = await this.client.get(conversationKey);
        if (!conversationData) {
            return; // Conversation doesn't exist, nothing to do
        }
        const conversation = JSON.parse(conversationData);
        conversation.participants = conversation.participants.filter(p => p !== agentId);
        conversation.updatedAt = new Date().toISOString();
        if (conversation.participants.length === 0) {
            // End conversation if no participants left
            conversation.status = 'completed';
            await this.publishSystemEvent('conversation:ended', conversationId);
        }
        // Update conversation
        await this.client.setex(conversationKey, this.config.redis.ttl || 3600, JSON.stringify(conversation));
        // Remove agent from conversation
        await this.client.srem(`${this.keyPrefix}agents:${agentId}:conversations`, conversationId);
    }
    async discoverAgents(criteria = {}) {
        const agentIds = await this.client.smembers(`${this.keyPrefix}agents:index`);
        const agents = [];
        for (const agentId of agentIds) {
            const agentData = await this.client.get(`${this.keyPrefix}agents:${agentId}`);
            if (!agentData)
                continue;
            try {
                const agent = JSON.parse(agentData);
                // Apply filters
                if (criteria.type && agent.type !== criteria.type)
                    continue;
                if (criteria.status) {
                    const status = await this.client.get(`${this.keyPrefix}agents:${agentId}:status`);
                    if (status !== criteria.status)
                        continue;
                }
                if (criteria.capabilities && criteria.capabilities.length > 0) {
                    const hasAllCapabilities = criteria.capabilities.every(cap => agent.capabilities.some(agentCap => agentCap.name === cap));
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
            const validatedHeartbeat = types_1.AgentHeartbeatSchema.parse(heartbeat);
            // Store heartbeat
            const heartbeatKey = `${this.keyPrefix}agents:${validatedHeartbeat.agentId}:heartbeat`;
            await this.client.setex(heartbeatKey, this.config.monitoring?.heartbeatInterval || 60, JSON.stringify(validatedHeartbeat));
            // Publish heartbeat
            await this.pubClient.publish(`${this.keyPrefix}heartbeats:global`, JSON.stringify(validatedHeartbeat));
            // Update agent status based on heartbeat
            await this.updateAgentStatus(validatedHeartbeat.agentId, validatedHeartbeat.status);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_1.A2AValidationError('Invalid heartbeat format', error.message);
            }
            throw error;
        }
    }
    async getAgentHealth(agentId) {
        const heartbeatData = await this.client.get(`${this.keyPrefix}agents:${agentId}:heartbeat`);
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
        await this.client.setex(messageKey, this.config.redis.ttl || 3600, JSON.stringify(message));
        // Add to conversation history if applicable
        if (message.conversationId) {
            await this.client.lpush(`${this.keyPrefix}conversations:${message.conversationId}:history`, message.id);
            // Keep only recent messages in conversation history
            await this.client.ltrim(`${this.keyPrefix}conversations:${message.conversationId}:history`, 0, 999 // Keep last 1000 messages
            );
        }
    }
    async publishSystemEvent(type, data) {
        await this.pubClient.publish(`${this.keyPrefix}events:global`, JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    }
};
exports.A2ARedisAdapter = A2ARedisAdapter;
exports.A2ARedisAdapter = A2ARedisAdapter = A2ARedisAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], A2ARedisAdapter);
