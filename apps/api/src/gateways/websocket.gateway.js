var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
import { WebSocketGateway as NestWebSocketGateway, WebSocketServer, SubscribeMessage, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
let WebSocketGateway = class WebSocketGateway {
    server;
    logger = new Logger('WebSocketGateway');
    async handleConnection(client) {
        try {
            const userId = client.handshake.query.userId;
            if (!userId) {
                client.disconnect();
                return;
            }
            this.logger.log(`Client connected: ${client.id}`);
        }
        catch (error) {
            this.logger.error('Connection error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        try {
            this.logger.log(`Client disconnected: ${client.id}`);
        }
        catch (error) {
            this.logger.error('Disconnection error:', error);
        }
    }
    async handleJoinRoom(client, roomId) {
        client.join(roomId);
        this.logger.log(`Client ${client.id} joined room ${roomId}`);
    }
    async handleLeaveRoom(client, roomId) {
        client.leave(roomId);
        this.logger.log(`Client ${client.id} left room ${roomId}`);
    }
    emitMessage(roomId, message) {
        this.server.to(roomId).emit('message', message);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", typeof (_a = typeof Server !== "undefined" && Server) === "function" ? _a : Object)
], WebSocketGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('joinRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Socket !== "undefined" && Socket) === "function" ? _b : Object, String]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    SubscribeMessage('leaveRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof Socket !== "undefined" && Socket) === "function" ? _c : Object, String]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleLeaveRoom", null);
WebSocketGateway = __decorate([
    Injectable(),
    NestWebSocketGateway({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    })
], WebSocketGateway);
export { WebSocketGateway };
//# sourceMappingURL=websocket.gateway.js.map