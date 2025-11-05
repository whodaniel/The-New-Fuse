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
var AgentBridgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentBridgeService = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const redis_service_1 = require("./redis.service");
let AgentBridgeService = AgentBridgeService_1 = class AgentBridgeService {
    redisService;
    server;
    logger = new common_1.Logger(AgentBridgeService_1.name);
    constructor(redisService) {
        this.redisService = redisService;
        this.setupRedisSubscriptions();
    }
    async setupRedisSubscriptions() {
        // Listen for Redis messages and bridge them to WebSocket
        this.redisService.getSubClient().on('message', (channel, message) => {
            this.handleRedisMessage(channel, message);
        });
    }
    async handleRedisMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            // Emit to appropriate WebSocket room based on channel
            this.server.to(channel).emit('agent_message', {
                channel,
                message: data
            });
        }
        catch (error) {
            this.logger.error(`Error handling Redis message: ${error}`);
        }
    }
    handleJoinChannel(client, channel) {
        client.join(channel);
        this.logger.log(`Client ${client.id} joined channel ${channel}`);
    }
    handleLeaveChannel(client, channel) {
        client.leave(channel);
        this.logger.log(`Client ${client.id} left channel ${channel}`);
    }
    async handleAgentMessage(client, payload) {
        const { channel, message } = payload;
        // Forward message to Redis
        if (channel === 'agent:composer') {
            await this.redisService.sendToComposer(message);
        }
        else if (channel === 'agent:roo-coder') {
            await this.redisService.sendToRooCoder(message);
        }
    }
};
exports.AgentBridgeService = AgentBridgeService;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AgentBridgeService.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_agent_channel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], AgentBridgeService.prototype, "handleJoinChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_agent_channel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], AgentBridgeService.prototype, "handleLeaveChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('agent_message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AgentBridgeService.prototype, "handleAgentMessage", null);
exports.AgentBridgeService = AgentBridgeService = AgentBridgeService_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AgentBridgeService);
//# sourceMappingURL=agent-bridge.service.js.map