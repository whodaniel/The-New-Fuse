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
var WebSocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const connection_pool_js_1 = require("./connection/connection-pool.js");
const connection_manager_js_1 = require("./connection/connection-manager.js");
const redis_adapter_js_1 = require("./adapters/redis-adapter.js");
const message_queue_js_1 = require("./queue/message-queue.js");
const websocket_metrics_js_1 = require("./monitoring/websocket-metrics.js");
const compression_js_1 = require("./utils/compression.js");
let WebSocketGateway = WebSocketGateway_1 = class WebSocketGateway {
    config;
    redisAdapter;
    server;
    logger = new common_1.Logger(WebSocketGateway_1.name);
    connectionPool;
    connectionManager;
    messageQueue;
    monitoring;
    compressionMiddleware;
    constructor(config, redisAdapter) {
        this.config = config;
        this.redisAdapter = redisAdapter;
        this.connectionPool = new connection_pool_js_1.ConnectionPool(config?.connectionPool?.maxConnections ?? 10000, config?.connectionPool?.idleTimeout ?? 300000);
        this.connectionManager = new connection_manager_js_1.ConnectionManager(this.connectionPool, config?.heartbeat?.interval ?? 30000, config?.heartbeat?.timeout ?? 60000);
        this.messageQueue = new message_queue_js_1.MessageQueue({
            maxSize: config?.messageQueue?.maxSize ?? 10000,
            ttl: config?.messageQueue?.ttl ?? 3600000,
            processingInterval: 100,
            maxRetries: 3,
        });
        this.monitoring = new websocket_metrics_js_1.WebSocketMonitoring();
        this.compressionMiddleware = new compression_js_1.CompressionMiddleware(config?.compression?.threshold ?? 1024);
        this.setupEventListeners();
    }
    async afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
        if (this.redisAdapter) {
            await this.redisAdapter.initialize();
            this.redisAdapter.setupSocketIO(server);
        }
        if (this.config?.messageQueue?.enabled) {
            this.messageQueue.start();
        }
    }
    handleConnection(client) {
        try {
            this.connectionManager.handleConnection(client);
            this.monitoring.recordConnection(true);
            client.emit('connected', {
                id: client.id,
                timestamp: new Date(),
            });
            this.logger.log(`Client connected: ${client.id}`);
        }
        catch (error) {
            this.logger.error(`Connection error: ${error}`);
            this.monitoring.recordConnection(false);
            this.monitoring.recordError('connection');
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        this.connectionManager.handleDisconnection(client, 'client_disconnect');
        this.monitoring.recordDisconnection();
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleMessage(client, payload) {
        const startTime = Date.now();
        try {
            this.monitoring.recordMessage('inbound', payload.channel);
            let data = payload.data;
            if (payload.compressed) {
                data = this.compressionMiddleware.processIncoming(data, payload.compressed, payload.algorithm);
            }
            if (payload.broadcast) {
                this.broadcast(payload.channel, data);
            }
            else if (payload.userId) {
                this.sendToUser(payload.userId, payload.channel, data);
            }
            else {
                client.emit(payload.channel, data);
            }
            const processingTime = Date.now() - startTime;
            this.monitoring.recordProcessingTime(processingTime, payload.channel);
        }
        catch (error) {
            this.logger.error(`Error handling message: ${error}`);
            this.monitoring.recordError('message_handling');
            client.emit('error', { message: 'Failed to process message' });
        }
    }
    broadcast(channel, data) {
        const startTime = Date.now();
        try {
            const processed = this.compressionMiddleware.processOutgoing(data);
            const message = {
                channel,
                data: processed.data,
                compressed: processed.compressed,
                algorithm: processed.algorithm,
                timestamp: new Date(),
            };
            this.server.emit(channel, message);
            this.monitoring.recordMessage('outbound', channel);
            const latency = Date.now() - startTime;
            this.monitoring.recordMessageLatency(latency, channel);
        }
        catch (error) {
            this.logger.error(`Broadcast error: ${error}`);
            this.monitoring.recordError('broadcast');
        }
    }
    sendToUser(userId, channel, data) {
        const startTime = Date.now();
        try {
            const processed = this.compressionMiddleware.processOutgoing(data);
            const message = {
                channel,
                data: processed.data,
                compressed: processed.compressed,
                algorithm: processed.algorithm,
                timestamp: new Date(),
            };
            this.connectionManager.sendToUser(userId, channel, message);
            this.monitoring.recordMessage('outbound', channel);
            const latency = Date.now() - startTime;
            this.monitoring.recordMessageLatency(latency, channel);
        }
        catch (error) {
            this.logger.error(`Send to user error: ${error}`);
            this.monitoring.recordError('send_to_user');
        }
    }
    sendToRoom(room, channel, data) {
        const startTime = Date.now();
        try {
            const processed = this.compressionMiddleware.processOutgoing(data);
            const message = {
                channel,
                data: processed.data,
                compressed: processed.compressed,
                algorithm: processed.algorithm,
                timestamp: new Date(),
            };
            this.connectionManager.sendToRoom(room, channel, message);
            this.monitoring.recordMessage('outbound', channel);
            const latency = Date.now() - startTime;
            this.monitoring.recordMessageLatency(latency, channel);
        }
        catch (error) {
            this.logger.error(`Send to room error: ${error}`);
            this.monitoring.recordError('send_to_room');
        }
    }
    queueMessage(channel, data, priority = 0) {
        return this.messageQueue.enqueue(channel, data, priority);
    }
    getConnectionStats() {
        return this.connectionManager.getStats();
    }
    async getMetrics() {
        return this.monitoring.getMetricsJSON();
    }
    async getHealth() {
        const queueStats = this.messageQueue.getStats();
        return this.monitoring.getHealthStatus({
            redis: this.redisAdapter !== undefined,
            queueSize: queueStats.size,
        });
    }
    setupEventListeners() {
        this.messageQueue.on('message:process', (item) => {
            this.broadcast(item.channel, item.data);
        });
        this.messageQueue.on('queue:full', () => {
            this.logger.warn('Message queue is full');
            this.monitoring.recordError('queue_full');
        });
        this.connectionPool.on('pool:limit-reached', () => {
            this.logger.warn('Connection pool limit reached');
            this.monitoring.recordError('pool_limit');
        });
        setInterval(() => {
            const queueStats = this.messageQueue.getStats();
            this.monitoring.updateQueueSize(queueStats.size);
        }, 5000);
    }
    async onModuleDestroy() {
        this.logger.log('Shutting down WebSocket Gateway');
        this.messageQueue.destroy();
        this.connectionManager.destroy();
        this.connectionPool.destroy();
    }
};
exports.WebSocketGateway = WebSocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebSocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebSocketGateway.prototype, "handleMessage", null);
exports.WebSocketGateway = WebSocketGateway = WebSocketGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    }),
    __param(0, (0, common_1.Inject)('WEBSOCKET_CONFIG')),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, redis_adapter_js_1.RedisWebSocketAdapter])
], WebSocketGateway);
