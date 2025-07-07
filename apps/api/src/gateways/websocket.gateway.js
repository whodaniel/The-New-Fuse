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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let WebSocketGateway = class WebSocketGateway {
    server;
    logger = new common_1.Logger('WebSocketGateway');
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
exports.WebSocketGateway = WebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleLeaveRoom", null);
exports.WebSocketGateway = WebSocketGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    })
], WebSocketGateway);
