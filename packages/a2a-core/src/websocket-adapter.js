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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var A2AWebSocketAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AWebSocketAdapter = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const events_1 = require("events");
const types_1 = require("./types");
const redis_adapter_1 = require("./redis-adapter");
let A2AWebSocketAdapter = A2AWebSocketAdapter_1 = class A2AWebSocketAdapter extends events_1.EventEmitter {
    config;
    redisAdapter;
    server;
    logger = new common_1.Logger(A2AWebSocketAdapter_1.name);
    connectedAgents = new Map(); // agentId -> socket
    socketToAgent = new Map(); // socketId -> agentId
    constructor(config, redisAdapter) {
        super();
        this.config = config;
        this.redisAdapter = redisAdapter;
        this.setupRedisSubscriptions();
    }
    setupRedisSubscriptions() {
        // Forward Redis events to WebSocket clients
        this.redisAdapter.on('message:received', (message) => {
            this.forwardMessageToWebSocket(message);
        });
        this.redisAdapter.on('agent:registered', (registration) => {
            this.server.emit('agent:registered', registration);
        });
        this.redisAdapter.on('agent:unregistered', (agentId) => {
            this.server.emit('agent:unregistered', { agentId });
            // Disconnect the agent if connected
            const socket = this.connectedAgents.get(agentId);
            if (socket) {
                socket.disconnect();
            }
        });
        this.redisAdapter.on('agent:status_changed', (agentId, status) => {
            this.server.emit('agent:status_changed', { agentId, status });
        });
        this.redisAdapter.on('heartbeat:received', (heartbeat) => {
            this.server.emit('heartbeat:received', heartbeat);
        });
    }
    async handleConnection(client) {
        this.logger.log(`Client connecting: ${client.id}`);
        try {
            // Wait for authentication
            const authTimeout = setTimeout(() => {
                if (!client.isAuthenticated) {
                    this.logger.warn(`Client ${client.id} authentication timeout`);
                    client.emit('error', { code: 'AUTH_TIMEOUT', message: 'Authentication timeout' });
                    client.disconnect();
                }
            }, 10000); // 10 second auth timeout
            client.on('disconnect', () => {
                clearTimeout(authTimeout);
            });
        }
        catch (error) {
            this.logger.error('Connection error:', error);
            client.emit('error', { code: 'CONNECTION_ERROR', message: 'Failed to establish connection' });
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const agentId = this.socketToAgent.get(client.id);
        if (agentId) {
            this.logger.log(`Agent disconnected: ${agentId} (${client.id})`);
            // Clean up mappings
            this.connectedAgents.delete(agentId);
            this.socketToAgent.delete(client.id);
            // Update agent status to offline
            try {
                await this.redisAdapter.updateAgentStatus(agentId, types_1.AgentStatus.OFFLINE);
            }
            catch (error) {
                this.logger.error(`Failed to update agent status on disconnect:`, error);
            }
            // Emit disconnection event
            this.server.emit('agent:disconnected', { agentId });
        }
    }
    async handleAuthenticate(client, data) {
        try {
            // Basic validation
            if (!data.agentId) {
                throw new types_1.A2AValidationError('Agent ID is required', 'agentId');
            }
            // TODO: Implement proper authentication based on config
            // For now, we'll do basic validation
            const isValid = await this.validateAgent(data.agentId, data.token, data.signature);
            if (!isValid) {
                client.emit('authentication:failed', {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid authentication credentials'
                });
                client.disconnect();
                return;
            }
            // Check if agent is already connected
            const existingSocket = this.connectedAgents.get(data.agentId);
            if (existingSocket && existingSocket.connected) {
                this.logger.warn(`Agent ${data.agentId} already connected, disconnecting previous connection`);
                existingSocket.disconnect();
            }
            // Register the connection
            client.agentId = data.agentId;
            client.isAuthenticated = true;
            this.connectedAgents.set(data.agentId, client);
            this.socketToAgent.set(client.id, data.agentId);
            // Subscribe to agent-specific channels
            client.join(`agent:${data.agentId}`);
            client.join('global');
            // Update agent status to online
            await this.redisAdapter.updateAgentStatus(data.agentId, types_1.AgentStatus.ONLINE);
            // Send authentication success
            client.emit('authentication:success', {
                agentId: data.agentId,
                timestamp: new Date().toISOString()
            });
            this.logger.log(`Agent authenticated: ${data.agentId} (${client.id})`);
        }
        catch (error) {
            this.logger.error('Authentication error:', error);
            client.emit('authentication:failed', {
                code: 'AUTH_ERROR',
                message: error instanceof Error ? error.message : 'Authentication failed'
            });
            client.disconnect();
        }
    }
    async handleSendMessage(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            // Validate the message
            const validatedMessage = types_1.A2AMessageSchema.parse({
                ...data,
                fromAgent: client.agentId, // Ensure fromAgent matches authenticated agent
                timestamp: new Date().toISOString()
            });
            // Send through Redis adapter
            await this.redisAdapter.sendMessage(validatedMessage);
            // Acknowledge message sent
            client.emit('message:sent', {
                messageId: validatedMessage.id,
                timestamp: validatedMessage.timestamp
            });
        }
        catch (error) {
            this.logger.error('Send message error:', error);
            client.emit('message:error', {
                code: error instanceof types_1.A2AError ? error.code : 'SEND_ERROR',
                message: error instanceof Error ? error.message : 'Failed to send message'
            });
        }
    }
    async handleSendRequest(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            const response = await this.redisAdapter.sendRequest(client.agentId, data.toAgent, data.payload, {
                timeout: data.timeout,
                conversationId: data.conversationId
            });
            client.emit('request:response', response);
        }
        catch (error) {
            this.logger.error('Send request error:', error);
            client.emit('request:error', {
                code: error instanceof types_1.A2AError ? error.code : 'REQUEST_ERROR',
                message: error instanceof Error ? error.message : 'Request failed'
            });
        }
    }
    async handleSendBroadcast(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            await this.redisAdapter.broadcast(client.agentId, data.payload, {
                channel: data.channel,
                topic: data.topic
            });
            client.emit('broadcast:sent', {
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Send broadcast error:', error);
            client.emit('broadcast:error', {
                code: error instanceof types_1.A2AError ? error.code : 'BROADCAST_ERROR',
                message: error instanceof Error ? error.message : 'Broadcast failed'
            });
        }
    }
    async handleJoinConversation(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            await this.redisAdapter.joinConversation(data.conversationId, client.agentId);
            client.join(`conversation:${data.conversationId}`);
            client.emit('conversation:joined', {
                conversationId: data.conversationId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Join conversation error:', error);
            client.emit('conversation:error', {
                code: error instanceof types_1.A2AError ? error.code : 'CONVERSATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to join conversation'
            });
        }
    }
    async handleLeaveConversation(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            await this.redisAdapter.leaveConversation(data.conversationId, client.agentId);
            client.leave(`conversation:${data.conversationId}`);
            client.emit('conversation:left', {
                conversationId: data.conversationId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Leave conversation error:', error);
            client.emit('conversation:error', {
                code: error instanceof types_1.A2AError ? error.code : 'CONVERSATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to leave conversation'
            });
        }
    }
    async handleDiscoverAgents(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            const agents = await this.redisAdapter.discoverAgents(data);
            client.emit('agents:discovered', agents);
        }
        catch (error) {
            this.logger.error('Discover agents error:', error);
            client.emit('discovery:error', {
                code: error instanceof types_1.A2AError ? error.code : 'DISCOVERY_ERROR',
                message: error instanceof Error ? error.message : 'Agent discovery failed'
            });
        }
    }
    async handleSendHeartbeat(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new types_1.A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            const heartbeat = {
                ...data,
                agentId: client.agentId,
                timestamp: new Date().toISOString()
            };
            await this.redisAdapter.sendHeartbeat(heartbeat);
            client.emit('heartbeat:sent', {
                timestamp: heartbeat.timestamp
            });
        }
        catch (error) {
            this.logger.error('Send heartbeat error:', error);
            client.emit('heartbeat:error', {
                code: error instanceof types_1.A2AError ? error.code : 'HEARTBEAT_ERROR',
                message: error instanceof Error ? error.message : 'Heartbeat failed'
            });
        }
    }
    // Forward Redis messages to appropriate WebSocket clients
    forwardMessageToWebSocket(message) {
        if (message.toAgent) {
            // Direct message to specific agent
            const targetSocket = this.connectedAgents.get(message.toAgent);
            if (targetSocket && targetSocket.connected) {
                targetSocket.emit('message:received', message);
            }
        }
        else {
            // Broadcast to all connected agents (or filtered by routing)
            if (message.routing?.channel) {
                this.server.to(message.routing.channel).emit('message:received', message);
            }
            else {
                this.server.to('global').emit('message:received', message);
            }
        }
        // Also send to conversation participants if applicable
        if (message.conversationId) {
            this.server.to(`conversation:${message.conversationId}`).emit('message:received', message);
        }
    }
    // Validate agent authentication
    async validateAgent(agentId, token, signature) {
        try {
            // Check if agent exists in Redis
            const agentData = await this.redisAdapter.discoverAgents({ type: undefined });
            const agent = agentData.find(a => a.agentId === agentId);
            if (!agent) {
                this.logger.warn(`Authentication failed: Agent ${agentId} not found`);
                return false;
            }
            // TODO: Implement proper token/signature validation based on agent.authentication
            // For now, we'll accept any registered agent
            return true;
        }
        catch (error) {
            this.logger.error('Agent validation error:', error);
            return false;
        }
    }
    // Public methods for external access
    getConnectedAgents() {
        return Array.from(this.connectedAgents.keys());
    }
    isAgentConnected(agentId) {
        const socket = this.connectedAgents.get(agentId);
        return socket ? socket.connected : false;
    }
    async sendDirectMessage(message) {
        this.forwardMessageToWebSocket(message);
    }
};
exports.A2AWebSocketAdapter = A2AWebSocketAdapter;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], A2AWebSocketAdapter.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send:message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send:request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send:broadcast'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendBroadcast", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('discover:agents'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleDiscoverAgents", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send:heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendHeartbeat", null);
exports.A2AWebSocketAdapter = A2AWebSocketAdapter = A2AWebSocketAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        namespace: '/a2a',
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ['websocket', 'polling']
    }),
    __metadata("design:paramtypes", [Object, redis_adapter_1.A2ARedisAdapter])
], A2AWebSocketAdapter);
