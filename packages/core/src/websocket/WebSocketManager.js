var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebSocketManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
let WebSocketManager = WebSocketManager_1 = class WebSocketManager extends EventEmitter {
    configService;
    logger = new Logger(WebSocketManager_1.name);
    server;
    clients = new Map();
    constructor(configService) {
        super();
        this.configService = configService;
    }
    async onModuleInit() {
        const port = this.configService.get('WS_PORT', 8080);
        this.server = new Server(port, {
            cors: {
                origin: this.configService.get('CORS_ORIGINS', '*'),
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.server.on('connection', (socket) => {
            this.handleConnection(socket);
        });
        this.logger.log(`WebSocket server started on port ${port}`);
    }
    async onModuleDestroy() {
        if (this.server) {
            this.server.close(() => {
                this.logger.log('WebSocket server closed');
            });
        }
    }
    handleConnection(socket) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            socket,
            connectedAt: new Date(),
            lastActivity: new Date(),
            metadata: {}
        };
        this.clients.set(clientId, client);
        this.logger.log(`Client connected: ${clientId}`);
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(clientId, reason);
        });
        socket.on('error', (error) => {
            this.logger.error(`Socket error for client ${clientId}:`, error);
            this.handleError(clientId, error);
        });
        socket.on('message', (data) => {
            this.handleMessage(clientId, data);
        });
        socket.on('ping', () => {
            this.handlePing(clientId);
        });
        socket.on('join-room', (room) => {
            this.handleJoinRoom(clientId, room);
        });
        socket.on('leave-room', (room) => {
            this.handleLeaveRoom(clientId, room);
        });
        // Send welcome message
        socket.emit('connected', {
            clientId,
            timestamp: new Date().toISOString(),
            message: 'Connected to WebSocket server'
        });
        this.emit('clientConnected', client);
    }
    handleDisconnection(clientId, reason) {
        const client = this.clients.get(clientId);
        if (client) {
            this.clients.delete(clientId);
            this.logger.log(`Client disconnected: ${clientId}, reason: ${reason}`);
            this.emit('clientDisconnected', { client, reason });
        }
    }
    handleError(clientId, error) {
        const client = this.clients.get(clientId);
        if (client) {
            this.logger.error(`Client error: ${clientId}`, error);
            this.emit('clientError', { client, error });
        }
    }
    handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastActivity = new Date();
            this.logger.debug(`Message from ${clientId}:`, data);
            this.emit('clientMessage', { client, data });
        }
    }
    handlePing(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastActivity = new Date();
            client.socket.emit('pong', { timestamp: new Date().toISOString() });
        }
    }
    handleJoinRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (client) {
            client.socket.join(room);
            this.logger.log(`Client ${clientId} joined room: ${room}`);
            this.emit('clientJoinedRoom', { client, room });
        }
    }
    handleLeaveRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (client) {
            client.socket.leave(room);
            this.logger.log(`Client ${clientId} left room: ${room}`);
            this.emit('clientLeftRoom', { client, room });
        }
    }
    // Public methods
    broadcast(message) {
        this.server.emit(message.type, {
            ...message.data,
            timestamp: message.timestamp
        });
        this.logger.debug('Broadcasted message:', message);
    }
    broadcastToRoom(room, message) {
        this.server.to(room).emit(message.type, {
            ...message.data,
            timestamp: message.timestamp
        });
        this.logger.debug(`Broadcasted to room ${room}:`, message);
    }
    sendToClient(clientId, type, data) {
        const client = this.clients.get(clientId);
        if (client) {
            client.socket.emit(type, {
                ...data,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        return false;
    }
    disconnectClient(clientId, reason) {
        const client = this.clients.get(clientId);
        if (client) {
            client.socket.disconnect(reason);
            return true;
        }
        return false;
    }
    getClient(clientId) {
        return this.clients.get(clientId);
    }
    getAllClients() {
        return Array.from(this.clients.values());
    }
    getConnectedClientsCount() {
        return this.clients.size;
    }
    getClientsInRoom(room) {
        return Array.from(this.clients.values()).filter(client => client.socket.rooms.has(room));
    }
    isClientConnected(clientId) {
        return this.clients.has(clientId);
    }
    updateClientMetadata(clientId, metadata) {
        const client = this.clients.get(clientId);
        if (client) {
            client.metadata = { ...client.metadata, ...metadata };
            return true;
        }
        return false;
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Health check methods
    async healthCheck() {
        return {
            status: 'healthy',
            connectedClients: this.clients.size,
            uptime: process.uptime()
        };
    }
    // Cleanup inactive clients
    cleanupInactiveClients(timeoutMs = 300000) {
        const now = new Date();
        let cleaned = 0;
        for (const [clientId, client] of this.clients) {
            const inactiveTime = now.getTime() - client.lastActivity.getTime();
            if (inactiveTime > timeoutMs) {
                this.disconnectClient(clientId, 'Inactive timeout');
                cleaned++;
            }
        }
        if (cleaned > 0) {
            this.logger.log(`Cleaned up ${cleaned} inactive clients`);
        }
        return cleaned;
    }
};
WebSocketManager = WebSocketManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], WebSocketManager);
export { WebSocketManager };
