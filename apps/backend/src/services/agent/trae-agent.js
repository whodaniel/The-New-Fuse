"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraeAgent = void 0;
const ioredis_1 = require("ioredis");
const common_1 = require("@nestjs/common");
const events_1 = require("events");
class TraeAgent extends events_1.EventEmitter {
    logger = new common_1.Logger(TraeAgent.name);
    redis;
    subscriber;
    isConnected = false;
    channels = {
        primary: 'agent:trae',
        broadcast: 'agent:broadcast',
        augment: 'agent:augment',
        heartbeat: 'agent:heartbeat',
        metrics: 'monitoring:metrics',
        alerts: 'monitoring:alerts'
    };
    constructor() {
        super();
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redis = new ioredis_1.Redis(redisUrl);
        this.subscriber = new ioredis_1.Redis(redisUrl);
        this.setupSubscriptions();
        this.setupErrorHandling();
    }
    setupSubscriptions() {
        this.subscriber.subscribe(this.channels.primary, (err) => {
            if (err) {
                this.logger.error('Subscription error:', err);
                return;
            }
            this.isConnected = true;
            this.logger.log('Subscribed to channels');
        });
        this.subscriber.on('message', async (channel, message) => {
            try {
                const parsedMessage = JSON.parse(message);
                await this.handleMessage(channel, parsedMessage);
            }
            catch (error) {
                this.logger.error('Error processing message:', error);
            }
        });
    }
    setupErrorHandling() {
        this.redis.on('error', this.handleError.bind(this));
        this.subscriber.on('error', this.handleError.bind(this));
    }
    async handleMessage(channel, message) {
        this.logger.log(`Received message on ${channel}:`, message);
        if (message.type === 'task' && message.details?.action === 'ping') {
            const response = {
                type: 'task_response',
                timestamp: new Date().toISOString(),
                metadata: {
                    version: '1.0.0',
                    priority: 'high',
                    source: 'trae'
                },
                details: {
                    action: 'pong',
                    originalTimestamp: message.timestamp,
                    status: 'success'
                }
            };
            await this.publishMessage(this.channels.primary, response);
            this.logger.log('Sent pong response');
        }
    }
    async publishMessage(channel, message) {
        try {
            await this.redis.publish(channel, JSON.stringify(message));
        }
        catch (error) {
            this.logger.error(`Failed to publish message to ${channel}:`, error);
            throw error;
        }
    }
    handleError(error) {
        this.logger.error('Redis error:', error);
        this.isConnected = false;
    }
    async cleanup() {
        try {
            await this.subscriber.unsubscribe();
            await this.subscriber.quit();
            await this.redis.quit();
        }
        catch (error) {
            this.logger.error('Cleanup error:', error);
        }
    }
}
exports.TraeAgent = TraeAgent;
