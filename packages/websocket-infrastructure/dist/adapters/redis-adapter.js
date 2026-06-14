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
var RedisWebSocketAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisWebSocketAdapter = void 0;
const common_1 = require("@nestjs/common");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const redis_adapter_1 = require("@socket.io/redis-adapter");
let RedisWebSocketAdapter = RedisWebSocketAdapter_1 = class RedisWebSocketAdapter {
    redisService;
    logger = new common_1.Logger(RedisWebSocketAdapter_1.name);
    pubClient;
    subClient;
    io;
    config;
    metrics = {
        totalConnections: 0,
        activeConnections: 0,
        totalMessages: 0,
        messagesPerSecond: 0,
        averageLatency: 0,
        errors: 0,
        reconnections: 0,
    };
    metricsInterval;
    constructor(config, redisService) {
        this.redisService = redisService;
        this.config = {
            keyPrefix: 'ws:',
            ...config,
        };
    }
    async initialize() {
        try {
            this.pubClient = this.redisService.getClient();
            this.subClient = this.pubClient.duplicate
                ? this.pubClient.duplicate()
                : this.pubClient;
            if (this.subClient.connect && this.subClient.status !== 'ready') {
                await this.subClient.connect().catch(() => { });
            }
            this.logger.log('Redis adapter initialized successfully');
            this.startMetricsCollection();
        }
        catch (error) {
            this.logger.error(`Failed to initialize Redis adapter: ${error}`);
            throw error;
        }
    }
    async waitForConnection(client, name) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Redis ${name} client connection timeout`));
            }, 10000);
            if (client.status === 'ready') {
                clearTimeout(timeout);
                resolve();
            }
            else {
                client.once('ready', () => {
                    clearTimeout(timeout);
                    this.logger.log(`Redis ${name} client connected`);
                    resolve();
                });
            }
        });
    }
    setupSocketIO(io) {
        if (!this.pubClient || !this.subClient) {
            throw new Error('Redis clients not initialized');
        }
        io.adapter((0, redis_adapter_1.createAdapter)(this.pubClient, this.subClient));
        this.io = io;
        this.logger.log('Socket.IO configured with Redis adapter');
    }
    broadcast(channel, data) {
        if (!this.io) {
            throw new Error('Socket.IO not initialized');
        }
        this.io.emit(channel, data);
        this.metrics.totalMessages++;
        this.logger.debug(`Broadcast to channel: ${channel}`);
    }
    sendToUser(userId, data) {
        if (!this.io) {
            throw new Error('Socket.IO not initialized');
        }
        this.io.to(`user:${userId}`).emit('message', data);
        this.metrics.totalMessages++;
        this.logger.debug(`Sent message to user: ${userId}`);
    }
    disconnect(socketId, reason) {
        if (!this.io) {
            throw new Error('Socket.IO not initialized');
        }
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.disconnect(true);
            this.logger.debug(`Disconnected socket: ${socketId}${reason ? ` (${reason})` : ''}`);
        }
    }
    async publish(channel, message) {
        const data = JSON.stringify(message);
        await this.redisService.publish(`${this.config.keyPrefix}${channel}`, data);
        this.metrics.totalMessages++;
    }
    async subscribe(channel, handler) {
        const fullChannel = `${this.config.keyPrefix}${channel}`;
        await this.redisService.subscribe(fullChannel, (message) => {
            try {
                const data = typeof message.message === 'string' ? JSON.parse(message.message) : message.message;
                handler(data);
            }
            catch (error) {
                this.logger.error(`Error parsing message from ${channel}: ${error}`);
                this.metrics.errors++;
            }
        });
        this.logger.log(`Subscribed to Redis channel: ${channel}`);
    }
    async unsubscribe(channel) {
        await this.redisService.unsubscribe(`${this.config.keyPrefix}${channel}`);
        this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
    }
    async set(key, value, ttl) {
        const data = JSON.stringify(value);
        const fullKey = `${this.config.keyPrefix}${key}`;
        await this.redisService.set(fullKey, data, ttl);
    }
    async get(key) {
        const data = await this.redisService.get(`${this.config.keyPrefix}${key}`);
        return data ? JSON.parse(data) : null;
    }
    async delete(key) {
        await this.redisService.del(`${this.config.keyPrefix}${key}`);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    startMetricsCollection() {
        let lastMessageCount = 0;
        this.metricsInterval = setInterval(() => {
            const currentMessages = this.metrics.totalMessages;
            this.metrics.messagesPerSecond = currentMessages - lastMessageCount;
            lastMessageCount = currentMessages;
            if (this.io) {
                this.metrics.activeConnections = this.io.sockets.sockets.size;
            }
        }, 1000);
    }
    async onModuleInit() {
        await this.initialize();
    }
    async onModuleDestroy() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        if (this.subClient && this.subClient.quit) {
            await this.subClient.quit();
        }
        this.logger.log('Redis adapter destroyed');
    }
};
exports.RedisWebSocketAdapter = RedisWebSocketAdapter;
exports.RedisWebSocketAdapter = RedisWebSocketAdapter = RedisWebSocketAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, infrastructure_1.UnifiedRedisService])
], RedisWebSocketAdapter);
