var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommunicationProtocol } from './CommunicationProtocol.js';
let CommunicationService = class CommunicationService {
    constructor(eventEmitter, protocol) {
        this.eventEmitter = eventEmitter;
        this.protocol = protocol;
        this.connections = new Map();
        this.userSockets = new Map();
    }
    async connectUser(userId, socketId) {
        const connection = {
            userId,
            socketId,
            connectedAt: new Date(),
        };
        this.connections.set(socketId, connection);
        this.userSockets.set(userId, socketId);
        this.eventEmitter.emit('user.connected', { userId, socketId });
    }
    async disconnectUser(socketId) {
        const connection = this.connections.get(socketId);
        if (connection) {
            this.connections.delete(socketId);
            this.userSockets.delete(connection.userId);
            this.eventEmitter.emit('user.disconnected', { userId: connection.userId, socketId });
        }
    }
    async sendMessage(senderId, recipientId, type, payload) {
        const recipientSocketId = this.userSockets.get(recipientId);
        if (recipientSocketId) {
            const message = this.protocol.createMessage(type, payload, senderId, recipientId);
            this.eventEmitter.emit('message.send', { socketId: recipientSocketId, message });
        }
    }
    async broadcastMessage(senderId, type, payload) {
        const message = this.protocol.createMessage(type, payload, senderId);
        this.connections.forEach((connection) => {
            if (connection.userId !== senderId) {
                this.eventEmitter.emit('message.send', { socketId: connection.socketId, message });
            }
        });
    }
    async processIncomingMessage(socketId, data) {
        try {
            const connection = this.connections.get(socketId);
            if (connection) {
                const message = {
                    type: data.type,
                    payload: data.payload,
                    timestamp: new Date(),
                    senderId: connection.userId,
                    recipientId: data.recipientId,
                };
                await this.protocol.processMessage(message);
            }
        }
        catch (error) {
            this.eventEmitter.emit('message.error', { socketId, error });
        }
    }
    getUserSocketId(userId) {
        return this.userSockets.get(userId);
    }
    getConnectedUsers() {
        return Array.from(this.userSockets.keys());
    }
    isUserConnected(userId) {
        return this.userSockets.has(userId);
    }
};
CommunicationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2,
        CommunicationProtocol])
], CommunicationService);
export { CommunicationService };
//# sourceMappingURL=CommunicationService.js.map