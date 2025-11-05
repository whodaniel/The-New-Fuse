var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebsocketGateway_1;
var _a, _b, _c;
import { WebSocketGateway, WebSocketServer, SubscribeMessage, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../auth/ws-auth.guard'; // Changed from @/auth/ws-auth.guard
import { CacheService } from '../cache/cache.service'; // Changed from @/cache/cache.service
import { Logger } from '@nestjs/common';
// Note: MonitoringService import removed as it's not available
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    cache;
    server;
    logger = new Logger(WebsocketGateway_1.name);
    constructor(cache) {
        this.cache = cache;
    }
    async handleConnection(client) {
        try {
            const userId = client.handshake.auth.token;
            await this.cache.set(`socket:${client.id}`, userId);
            await this.cache.sadd(`online_users`, userId);
            this.logger.log(`WebSocket connection established for user: ${userId}`);
            this.server.emit('users:online', {
                count: await this.cache.scard('online_users')
            });
        }
        catch (error) {
            this.logger.error('WebSocket connection failed:', error instanceof Error ? error.message : String(error));
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = await this.cache.get(`socket:${client.id}`);
        await this.cache.del(`socket:${client.id}`);
        if (userId) {
            await this.cache.srem('online_users', userId);
        }
        // Use logger instead of monitoring service for metrics
        this.logger.log(`WebSocket disconnection for user: ${userId}`);
        // Note: Monitoring service calls removed as they're not available
        // this.monitoring.recordMetric?.('websocket.disconnection', 1, { userId }) || console.log('Metric recorded');
        // this.monitoring.captureError?.(error) || console.error('Error captured:', error);
        this.server.emit('users:online', {
            count: await this.cache.scard('online_users')
        });
    }
    async handleMessage(client, payload) {
        try {
            const userId = await this.cache.get(`socket:${client.id}`);
            // Process and broadcast message
            this.server.to(payload.roomId).emit('agent:message', {
                ...payload,
                timestamp: new Date(),
            });
            this.logger.log(`WebSocket message processed for user: ${userId}, agent: ${payload.agentId}`);
        }
        catch (error) {
            this.logger.error('WebSocket message processing failed:', error instanceof Error ? error.message : String(error));
            client.emit('error', { message: 'Failed to process message' });
        }
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", typeof (_b = typeof Server !== "undefined" && Server) === "function" ? _b : Object)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    UseGuards(WsAuthGuard),
    SubscribeMessage('agent:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof Socket !== "undefined" && Socket) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleMessage", null);
WebsocketGateway = WebsocketGateway_1 = __decorate([
    WebSocketGateway({
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof CacheService !== "undefined" && CacheService) === "function" ? _a : Object])
], WebsocketGateway);
export { WebsocketGateway };
//# sourceMappingURL=websocket.gateway.js.map