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
exports.AgentCommunicationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../services/redis.service");
const ioredis_1 = require("ioredis");
let AgentCommunicationGateway = class AgentCommunicationGateway {
    redisService;
    server;
    logger = new common_1.Logger('AgentCommunicationGateway');
    subscriber;
    constructor(redisService) {
        this.redisService = redisService;
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.subscriber = new ioredis_1.Redis(redisUrl);
    }
    afterInit() {
        this.logger.log('WebSocket Gateway Initialized');
        this.setupRedisSubscriptions();
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async setupRedisSubscriptions() {
        try {
            // Subscribe to Trae and Augment channels
            await this.subscriber.subscribe('agent:trae', 'agent:augment', 'agent:broadcast');
            this.subscriber.on('message', (channel, message) => {
                try {
                    const data = JSON.parse(message);
                    // Emit the message to WebSocket clients
                    this.server.emit(channel, {
                        type: channel,
                        payload: data
                    });
                    this.logger.debug(`Forwarded message from ${channel} to WebSocket clients`);
                }
                catch (error) {
                    this.logger.error(`Error processing Redis message: ${error.message}`);
                }
            });
            this.logger.log('Redis subscriptions established');
        }
        catch (error) {
            this.logger.error(`Failed to setup Redis subscriptions: ${error.message}`);
        }
    }
};
exports.AgentCommunicationGateway = AgentCommunicationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AgentCommunicationGateway.prototype, "server", void 0);
exports.AgentCommunicationGateway = AgentCommunicationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], AgentCommunicationGateway);
