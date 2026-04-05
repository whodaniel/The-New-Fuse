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
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
// @ts-ignore
import { Server } from 'socket.io';
import { EventEmitter } from 'events';
import { A2AMessageSchema, AgentStatus, A2AError, A2AValidationError } from './types';
import { A2ARedisAdapter } from './redis-adapter';
// A2ASocket type is now replaced with any locally
let A2AWebSocketAdapter = A2AWebSocketAdapter_1 = class A2AWebSocketAdapter extends EventEmitter {
    constructor(config, redisAdapter) {
        super();
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        Object.defineProperty(this, "redisAdapter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: redisAdapter
        });
        Object.defineProperty(this, "server", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Logger(A2AWebSocketAdapter_1.name)
        });
        Object.defineProperty(this, "connectedAgents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        }); // agentId -> socket
        Object.defineProperty(this, "socketToAgent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        }); // socketId -> agentId
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
                await this.redisAdapter.updateAgentStatus(agentId, AgentStatus.OFFLINE);
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
                throw new A2AValidationError('Agent ID is required', 'agentId');
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
            await this.redisAdapter.updateAgentStatus(data.agentId, AgentStatus.ONLINE);
            // Send authentication success
            client.emit('authentication:success', {
                agentId: data.agentId,
                timestamp: Date.now()
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
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            // Validate the message
            const validatedMessage = A2AMessageSchema.parse({
                ...data,
                payload: data.payload ?? {},
                fromAgent: client.agentId, // Ensure fromAgent matches authenticated agent
                timestamp: Date.now()
            });
            // Send through Redis adapter
            await this.redisAdapter.sendMessage({ ...validatedMessage, payload: validatedMessage.payload || {} });
            // Acknowledge message sent
            client.emit('message:sent', {
                messageId: validatedMessage.id,
                timestamp: validatedMessage.timestamp
            });
        }
        catch (error) {
            this.logger.error('Send message error:', error);
            client.emit('message:error', {
                code: error instanceof A2AError ? error.code : 'SEND_ERROR',
                message: error instanceof Error ? error.message : 'Failed to send message'
            });
        }
    }
    async handleSendRequest(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
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
                code: error instanceof A2AError ? error.code : 'REQUEST_ERROR',
                message: error instanceof Error ? error.message : 'Request failed'
            });
        }
    }
    async handleSendBroadcast(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            await this.redisAdapter.broadcast(client.agentId, data.payload, {
                channel: data.channel,
                topic: data.topic
            });
            client.emit('broadcast:sent', {
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error('Send broadcast error:', error);
            client.emit('broadcast:error', {
                code: error instanceof A2AError ? error.code : 'BROADCAST_ERROR',
                message: error instanceof Error ? error.message : 'Broadcast failed'
            });
        }
    }
    async handleJoinConversation(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            await this.redisAdapter.joinConversation(data.conversationId, client.agentId);
            client.join(`conversation:${data.conversationId}`);
            client.emit('conversation:joined', {
                conversationId: data.conversationId,
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error('Join conversation error:', error);
            client.emit('conversation:error', {
                code: error instanceof A2AError ? error.code : 'CONVERSATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to join conversation'
            });
        }
    }
    async handleLeaveConversation(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            await this.redisAdapter.leaveConversation(data.conversationId, client.agentId);
            client.leave(`conversation:${data.conversationId}`);
            client.emit('conversation:left', {
                conversationId: data.conversationId,
                timestamp: Date.now()
            });
        }
        catch (error) {
            this.logger.error('Leave conversation error:', error);
            client.emit('conversation:error', {
                code: error instanceof A2AError ? error.code : 'CONVERSATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to leave conversation'
            });
        }
    }
    async handleDiscoverAgents(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
            }
            const agents = await this.redisAdapter.discoverAgents(data);
            client.emit('agents:discovered', agents);
        }
        catch (error) {
            this.logger.error('Discover agents error:', error);
            client.emit('discovery:error', {
                code: error instanceof A2AError ? error.code : 'DISCOVERY_ERROR',
                message: error instanceof Error ? error.message : 'Agent discovery failed'
            });
        }
    }
    async handleSendHeartbeat(client, data) {
        try {
            if (!client.isAuthenticated || !client.agentId) {
                throw new A2AError('Not authenticated', 'NOT_AUTHENTICATED');
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
                code: error instanceof A2AError ? error.code : 'HEARTBEAT_ERROR',
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
            if (message.metadata?.channel) {
                this.server.to(message.metadata.channel).emit('message:received', message);
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
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], A2AWebSocketAdapter.prototype, "server", void 0);
__decorate([
    SubscribeMessage('authenticate'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleAuthenticate", null);
__decorate([
    SubscribeMessage('send:message'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendMessage", null);
__decorate([
    SubscribeMessage('send:request'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendRequest", null);
__decorate([
    SubscribeMessage('send:broadcast'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendBroadcast", null);
__decorate([
    SubscribeMessage('join:conversation'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleJoinConversation", null);
__decorate([
    SubscribeMessage('leave:conversation'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleLeaveConversation", null);
__decorate([
    SubscribeMessage('discover:agents'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleDiscoverAgents", null);
__decorate([
    SubscribeMessage('send:heartbeat'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], A2AWebSocketAdapter.prototype, "handleSendHeartbeat", null);
A2AWebSocketAdapter = A2AWebSocketAdapter_1 = __decorate([
    Injectable(),
    NestWebSocketGateway({
        namespace: '/a2a',
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ['websocket', 'polling']
    }),
    __metadata("design:paramtypes", [Object, A2ARedisAdapter])
], A2AWebSocketAdapter);
export { A2AWebSocketAdapter };
