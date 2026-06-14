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
var ConnectionPool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionPool = void 0;
const common_1 = require("@nestjs/common");
const events_1 = require("events");
let ConnectionPool = ConnectionPool_1 = class ConnectionPool extends events_1.EventEmitter {
    logger = new common_1.Logger(ConnectionPool_1.name);
    connections = new Map();
    userConnections = new Map();
    metadata = new Map();
    maxConnections;
    idleTimeout;
    cleanupInterval;
    constructor(maxConnections = 10000, idleTimeout = 300000) {
        super();
        this.maxConnections = maxConnections;
        this.idleTimeout = idleTimeout;
        this.startCleanupTask();
    }
    add(socket) {
        if (this.connections.size >= this.maxConnections) {
            this.logger.warn(`Connection pool limit reached: ${this.maxConnections}`);
            this.emit('pool:limit-reached', { current: this.connections.size });
            return false;
        }
        this.connections.set(socket.id, socket);
        if (socket.userId) {
            if (!this.userConnections.has(socket.userId)) {
                this.userConnections.set(socket.userId, new Set());
            }
            this.userConnections.get(socket.userId).add(socket.id);
        }
        const metadata = {
            id: socket.id,
            userId: socket.userId,
            connectedAt: new Date(),
            lastActivity: new Date(),
            rooms: new Set(),
            metadata: {},
        };
        this.metadata.set(socket.id, metadata);
        socket.metadata = metadata;
        this.logger.debug(`Connection added to pool: ${socket.id} (Total: ${this.connections.size})`);
        this.emit('connection:added', { socketId: socket.id, userId: socket.userId });
        return true;
    }
    remove(socketId) {
        const socket = this.connections.get(socketId);
        if (!socket) {
            return false;
        }
        if (socket.userId) {
            const userSockets = this.userConnections.get(socket.userId);
            if (userSockets) {
                userSockets.delete(socketId);
                if (userSockets.size === 0) {
                    this.userConnections.delete(socket.userId);
                }
            }
        }
        this.connections.delete(socketId);
        this.metadata.delete(socketId);
        this.logger.debug(`Connection removed from pool: ${socketId} (Total: ${this.connections.size})`);
        this.emit('connection:removed', { socketId, userId: socket.userId });
        return true;
    }
    get(socketId) {
        return this.connections.get(socketId);
    }
    getUserConnections(userId) {
        const socketIds = this.userConnections.get(userId);
        if (!socketIds) {
            return [];
        }
        const sockets = [];
        for (const socketId of socketIds) {
            const socket = this.connections.get(socketId);
            if (socket) {
                sockets.push(socket);
            }
        }
        return sockets;
    }
    getMetadata(socketId) {
        return this.metadata.get(socketId);
    }
    updateActivity(socketId) {
        const metadata = this.metadata.get(socketId);
        if (metadata) {
            metadata.lastActivity = new Date();
        }
    }
    getStats() {
        const now = Date.now();
        let idle = 0;
        for (const [socketId, metadata] of this.metadata.entries()) {
            const idleTime = now - metadata.lastActivity.getTime();
            if (idleTime > 60000) {
                idle++;
            }
        }
        return {
            total: this.connections.size,
            active: this.connections.size - idle,
            idle,
            waiting: 0,
        };
    }
    getAllConnections() {
        return Array.from(this.connections.values());
    }
    size() {
        return this.connections.size;
    }
    hasCapacity() {
        return this.connections.size < this.maxConnections;
    }
    clear() {
        this.connections.clear();
        this.userConnections.clear();
        this.metadata.clear();
        this.logger.log('Connection pool cleared');
    }
    startCleanupTask() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupIdleConnections();
        }, 60000);
    }
    cleanupIdleConnections() {
        const now = Date.now();
        const toRemove = [];
        for (const [socketId, metadata] of this.metadata.entries()) {
            const idleTime = now - metadata.lastActivity.getTime();
            if (idleTime > this.idleTimeout) {
                toRemove.push(socketId);
            }
        }
        for (const socketId of toRemove) {
            const socket = this.connections.get(socketId);
            if (socket) {
                this.logger.debug(`Disconnecting idle connection: ${socketId}`);
                socket.disconnect(true);
                this.remove(socketId);
                this.emit('connection:idle-timeout', { socketId });
            }
        }
        if (toRemove.length > 0) {
            this.logger.log(`Cleaned up ${toRemove.length} idle connections`);
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
};
exports.ConnectionPool = ConnectionPool;
exports.ConnectionPool = ConnectionPool = ConnectionPool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Number, Number])
], ConnectionPool);
