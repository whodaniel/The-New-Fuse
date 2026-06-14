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
var ConnectionManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const common_1 = require("@nestjs/common");
const connection_pool_js_1 = require("./connection-pool.js");
let ConnectionManager = ConnectionManager_1 = class ConnectionManager {
    logger = new common_1.Logger(ConnectionManager_1.name);
    connectionPool;
    heartbeatInterval;
    heartbeatIntervalMs;
    heartbeatTimeoutMs;
    constructor(connectionPool, heartbeatIntervalMs = 30000, heartbeatTimeoutMs = 60000) {
        this.connectionPool = connectionPool;
        this.heartbeatIntervalMs = heartbeatIntervalMs;
        this.heartbeatTimeoutMs = heartbeatTimeoutMs;
    }
    handleConnection(socket) {
        const added = this.connectionPool.add(socket);
        if (!added) {
            socket.emit('error', { message: 'Connection pool limit reached' });
            socket.disconnect(true);
            return;
        }
        this.setupHeartbeat(socket);
        this.setupEventHandlers(socket);
        this.logger.log(`Client connected: ${socket.id}${socket.userId ? ` (User: ${socket.userId})` : ''}`);
    }
    handleDisconnection(socket, reason) {
        this.logger.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
        this.connectionPool.remove(socket.id);
    }
    setupHeartbeat(socket) {
        let lastPong = Date.now();
        const pingInterval = setInterval(() => {
            const now = Date.now();
            if (now - lastPong > this.heartbeatTimeoutMs) {
                this.logger.warn(`Heartbeat timeout for client: ${socket.id}`);
                socket.emit('heartbeat:timeout');
                socket.disconnect(true);
                clearInterval(pingInterval);
                return;
            }
            socket.emit('ping', { timestamp: now });
        }, this.heartbeatIntervalMs);
        socket.on('pong', (data) => {
            lastPong = Date.now();
            const latency = lastPong - data.timestamp;
            const metadata = this.connectionPool.getMetadata(socket.id);
            if (metadata) {
                metadata.lastActivity = new Date(lastPong);
                metadata.metadata.latency = latency;
            }
            this.logger.debug(`Pong received from ${socket.id} (Latency: ${latency}ms)`);
        });
        socket.on('disconnect', () => {
            clearInterval(pingInterval);
        });
    }
    setupEventHandlers(socket) {
        socket.on('error', (error) => {
            this.logger.error(`Socket error for ${socket.id}: ${error.message}`, error.stack);
        });
        socket.on('join:room', (roomName) => {
            socket.join(roomName);
            const metadata = this.connectionPool.getMetadata(socket.id);
            if (metadata) {
                metadata.rooms.add(roomName);
            }
            this.logger.debug(`Socket ${socket.id} joined room: ${roomName}`);
        });
        socket.on('leave:room', (roomName) => {
            socket.leave(roomName);
            const metadata = this.connectionPool.getMetadata(socket.id);
            if (metadata) {
                metadata.rooms.delete(roomName);
            }
            this.logger.debug(`Socket ${socket.id} left room: ${roomName}`);
        });
        socket.onAny(() => {
            this.connectionPool.updateActivity(socket.id);
        });
    }
    broadcast(event, data) {
        const connections = this.connectionPool.getAllConnections();
        connections.forEach((socket) => {
            socket.emit(event, data);
        });
        this.logger.debug(`Broadcast ${event} to ${connections.length} connections`);
    }
    sendToUser(userId, event, data) {
        const connections = this.connectionPool.getUserConnections(userId);
        connections.forEach((socket) => {
            socket.emit(event, data);
        });
        this.logger.debug(`Sent ${event} to user ${userId} (${connections.length} connections)`);
    }
    sendToRoom(roomName, event, data) {
        const connections = this.connectionPool.getAllConnections();
        let sentCount = 0;
        connections.forEach((socket) => {
            if (socket.rooms.has(roomName)) {
                socket.emit(event, data);
                sentCount++;
            }
        });
        this.logger.debug(`Sent ${event} to room ${roomName} (${sentCount} connections)`);
    }
    disconnect(socketId, reason) {
        const socket = this.connectionPool.get(socketId);
        if (socket) {
            if (reason) {
                socket.emit('disconnect:reason', { reason });
            }
            socket.disconnect(true);
            this.connectionPool.remove(socketId);
        }
    }
    disconnectUser(userId, reason) {
        const connections = this.connectionPool.getUserConnections(userId);
        connections.forEach((socket) => {
            if (reason) {
                socket.emit('disconnect:reason', { reason });
            }
            socket.disconnect(true);
            this.connectionPool.remove(socket.id);
        });
        this.logger.log(`Disconnected ${connections.length} connections for user ${userId}`);
    }
    getStats() {
        return this.connectionPool.getStats();
    }
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.connectionPool.destroy();
    }
};
exports.ConnectionManager = ConnectionManager;
exports.ConnectionManager = ConnectionManager = ConnectionManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [connection_pool_js_1.ConnectionPool, Number, Number])
], ConnectionManager);
