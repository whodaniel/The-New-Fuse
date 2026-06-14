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
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const ws_auth_guard_1 = require("../auth/ws-auth.guard"); // Changed from @/auth/ws-auth.guard
const cache_service_1 = require("../cache/cache.service"); // Changed from @/cache/cache.service
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    constructor(cache, jwtService, configService, monitoring) {
        this.cache = cache;
        this.jwtService = jwtService;
        this.configService = configService;
        this.monitoring = monitoring;
        this.logger = new common_1.Logger(WebsocketGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) {
                this.logger.warn(`WebSocket connection rejected - no token provided for client ${client.id}`);
                client.disconnect();
                return;
            }
            // Validate JWT token before caching
            let userId;
            try {
                const payload = this.jwtService.verify(token, {
                    secret: this.configService.get('JWT_SECRET'),
                });
                userId = payload.sub || payload.userId || payload.id;
                if (!userId) {
                    throw new Error('No user ID in token payload');
                }
            }
            catch (error) {
                this.logger.warn(`WebSocket connection rejected - invalid token for client ${client.id}`);
                client.disconnect();
                return;
            }
            await this.cache.set(`socket:${client.id}`, userId);
            await this.cache.sadd(`online_users`, userId);
            this.monitoring?.recordMetric('websocket.connection', 1, { userId });
            this.server.emit('users:online', {
                count: await this.cache.scard('online_users'),
            });
        }
        catch (error) {
            this.monitoring?.captureError(error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        const userId = await this.cache.get(`socket:${client.id}`);
        await this.cache.del(`socket:${client.id}`);
        if (userId) {
            await this.cache.srem('online_users', userId);
        }
        this.monitoring?.recordMetric('websocket.disconnect', 1, { userId });
        this.server.emit('users:online', {
            count: await this.cache.scard('online_users'),
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
            this.monitoring?.recordMetric('websocket.message', 1, {
                userId,
                agentId: payload.agentId,
            });
        }
        catch (error) {
            this.monitoring?.captureError(error);
            client.emit('error', { message: 'Failed to process message' });
        }
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_auth_guard_1.WsAuthGuard),
    (0, websockets_1.SubscribeMessage)('agent:message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleMessage", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
        },
    }),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)('UnifiedMonitoringService')),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        jwt_1.JwtService,
        config_1.ConfigService, Object])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map