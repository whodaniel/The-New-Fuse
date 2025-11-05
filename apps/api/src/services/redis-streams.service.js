/**
 * Redis Streams Service
 * Provides real-time communication and event streaming for multi-agent systems
 * Handles message queuing, pub/sub, and stream processing for The New Fuse
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisStreamsService_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Redis from 'ioredis';
let RedisStreamsService = RedisStreamsService_1 = class RedisStreamsService {
    configService;
    eventEmitter;
    logger = new Logger(RedisStreamsService_1.name);
    redis;
    subscriber;
    consumers = new Map();
    streamStats = new Map();
    messageHandlers = new Map();
    constructor(configService, eventEmitter) {
        this.configService = configService;
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        await this.initializeRedisConnections();
        await this.setupDefaultStreams();
        this.startStatsCollection();
    }
    async onModuleDestroy() {
        await this.closeConnections();
    }
    /**
     * Initialize Redis connections for streams and pub/sub
     */
    async initializeRedisConnections() {
        const redisConfig = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        };
        this.redis = new Redis(redisConfig);
        this.subscriber = new Redis(redisConfig);
        // Setup connection event handlers
        this.redis.on('connect', () => {
            this.logger.log('Redis streams connection established');
        });
        this.redis.on('error', (error) => {
            this.logger.error('Redis streams connection error:', error);
        });
        this.subscriber.on('connect', () => {
            this.logger.log('Redis subscriber connection established');
        });
        await this.redis.connect();
        await this.subscriber.connect();
    }
    /**
     * Setup default streams for the application
     */
    async setupDefaultStreams() {
        const defaultStreams = [
            'agency:commands',
            'agency:events',
            'agent:communications',
            'swarm:orchestration',
            'system:notifications'
        ];
        for (const streamKey of defaultStreams) {
            try {
                // Create stream with a dummy message if it doesn't exist
                await this.redis.xgroup('CREATE', streamKey, 'processors', '0', 'MKSTREAM');
                this.logger.log(`Created stream and consumer group: ${streamKey}`);
            }
            catch (error) {
                if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
                    this.logger.error(`Error creating stream ${streamKey}:`, error);
                }
            }
        }
    }
    /**
     * Publish a message to a Redis stream
     */
    async publishToStream(streamKey, message) {
        const streamMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: Date.now()
        };
        try {
            const messageId = await this.redis.xadd(streamKey, '*', 'data', JSON.stringify(streamMessage), 'type', message.type, 'agencyId', message.agencyId, 'agentId', message.agentId, 'priority', message.priority);
            this.logger.debug(`Message published to stream ${streamKey}: ${messageId}`);
            // Update stats
            this.updateStreamStats(streamKey, 'published');
            // Emit local event
            this.eventEmitter.emit('stream.message.published', {
                streamKey,
                messageId,
                message: streamMessage
            });
            return messageId;
        }
        catch (error) {
            this.logger.error(`Error publishing to stream ${streamKey}:`, error);
            throw error;
        }
    }
    /**
     * Start consuming messages from a stream
     */
    async startConsumer(config, handler) {
        const { groupName, consumerName, streamKey } = config;
        const consumerKey = `${streamKey}:${groupName}:${consumerName}`;
        if (this.consumers.has(consumerKey)) {
            this.logger.warn(`Consumer ${consumerKey} is already running`);
            return;
        }
        this.consumers.set(consumerKey, true);
        this.messageHandlers.set(consumerKey, handler);
        try {
            // Create consumer group if it doesn't exist
            await this.redis.xgroup('CREATE', streamKey, groupName, '0', 'MKSTREAM');
        }
        catch (error) {
            if (error instanceof Error && !error.message.includes('BUSYGROUP')) {
                this.logger.error(`Error creating consumer group ${groupName} for stream ${streamKey}:`, error);
            }
        }
        this.logger.log(`Starting consumer ${consumerName} for stream ${streamKey} in group ${groupName}`);
        // Start the consumer loop
        this.consumeMessages(config);
    }
    /**
     * Stop a consumer
     */
    async stopConsumer(streamKey, groupName, consumerName) {
        const consumerKey = `${streamKey}:${groupName}:${consumerName}`;
        this.consumers.set(consumerKey, false);
        this.messageHandlers.delete(consumerKey);
        this.logger.log(`Stopped consumer ${consumerName} for stream ${streamKey}`);
    }
    /**
     * Consume messages from a stream
     */
    async consumeMessages(config) {
        const { groupName, consumerName, streamKey, batchSize = 10, blockTime = 1000 } = config;
        const consumerKey = `${streamKey}:${groupName}:${consumerName}`;
        while (this.consumers.get(consumerKey)) {
            try {
                // Read pending messages first
                const pendingMessages = await this.redis.xreadgroup('GROUP', groupName, consumerName, 'COUNT', batchSize, 'STREAMS', streamKey, '0');
                if (pendingMessages && pendingMessages.length > 0) {
                    await this.processStreamMessages(pendingMessages, consumerKey, streamKey, groupName);
                }
                // Then read new messages
                const newMessages = await this.redis.xreadgroup('GROUP', groupName, consumerName, 'COUNT', batchSize, 'BLOCK', blockTime, 'STREAMS', streamKey, '>');
                if (newMessages && newMessages.length > 0) {
                    await this.processStreamMessages(newMessages, consumerKey, streamKey, groupName);
                }
            }
            catch (error) {
                this.logger.error(`Error consuming messages for ${consumerKey}:`, error);
                await this.sleep(5000); // Wait 5 seconds before retrying
            }
        }
    }
    /**
     * Process messages from a stream
     */
    async processStreamMessages(messages, consumerKey, streamKey, groupName) {
        const handler = this.messageHandlers.get(consumerKey);
        if (!handler)
            return;
        for (const [, streamMessages] of messages) {
            for (const [messageId, fields] of streamMessages) {
                try {
                    const messageData = this.parseMessageFields(fields);
                    const streamMessage = JSON.parse(messageData.data);
                    // Process the message
                    await handler(streamMessage);
                    // Acknowledge the message
                    await this.redis.xack(streamKey, groupName, messageId);
                    this.logger.debug(`Processed message ${messageId} from stream ${streamKey}`);
                    this.updateStreamStats(streamKey, 'processed');
                }
                catch (error) {
                    this.logger.error(`Error processing message ${messageId} from stream ${streamKey}:`, error);
                    this.updateStreamStats(streamKey, 'error');
                    // Handle failed message (could implement retry logic here)
                    await this.handleFailedMessage(streamKey, groupName, messageId, error);
                }
            }
        }
    }
    /**
     * Parse message fields from Redis stream
     */
    parseMessageFields(fields) {
        const result = {};
        for (let i = 0; i < fields.length; i += 2) {
            result[fields[i]] = fields[i + 1];
        }
        return result;
    }
    /**
     * Handle failed message processing
     */
    async handleFailedMessage(streamKey, groupName, messageId, error) {
        // For now, just acknowledge to prevent infinite retries
        // In production, you might want to move to a dead letter queue
        try {
            await this.redis.xack(streamKey, groupName, messageId);
            this.eventEmitter.emit('stream.message.failed', {
                streamKey,
                messageId,
                error: error.message
            });
        }
        catch (ackError) {
            this.logger.error(`Error acknowledging failed message ${messageId}:`, ackError);
        }
    }
    /**
     * Publish a notification to all agency members
     */
    async publishNotification(agencyId, notification) {
        await this.publishToStream('system:notifications', {
            agencyId,
            agentId: 'system',
            type: 'notification',
            payload: notification,
            priority: 'medium'
        });
        // Also publish to pub/sub for real-time updates
        await this.subscriber.publish(`agency:${agencyId}:notifications`, JSON.stringify(notification));
    }
    /**
     * Send a command to a specific agent
     */
    async sendCommandToAgent(agencyId, agentId, command) {
        return await this.publishToStream('agency:commands', {
            agencyId,
            agentId,
            type: 'command',
            payload: command,
            priority: 'high',
            metadata: {
                correlationId: this.generateMessageId(),
                ttl: command.timeout || 30000
            }
        });
    }
    /**
     * Broadcast event to all agents in an agency
     */
    async broadcastEvent(agencyId, event) {
        return await this.publishToStream('agency:events', {
            agencyId,
            agentId: 'broadcast',
            type: 'event',
            payload: event,
            priority: 'medium'
        });
    }
    /**
     * Get statistics for a stream
     */
    async getStreamStats(streamKey) {
        try {
            const info = await this.redis.xinfo('STREAM', streamKey);
            const groups = await this.redis.xinfo('GROUPS', streamKey);
            const stats = {
                streamKey,
                length: info[1],
                lastGeneratedId: info[3],
                groups: groups.map((group) => ({
                    name: group[1],
                    consumers: group[3],
                    pending: group[5],
                    lastDeliveredId: group[7]
                })),
                messagesPerSecond: this.streamStats.get(streamKey)?.messagesPerSecond || 0,
                totalProcessed: this.streamStats.get(streamKey)?.totalProcessed || 0,
                errors: this.streamStats.get(streamKey)?.errors || 0
            };
            return stats;
        }
        catch (error) {
            this.logger.error(`Error getting stats for stream ${streamKey}:`, error);
            return null;
        }
    }
    /**
     * Update stream statistics
     */
    updateStreamStats(streamKey, action) {
        const stats = this.streamStats.get(streamKey) || {
            streamKey,
            length: 0,
            lastGeneratedId: '',
            groups: [],
            messagesPerSecond: 0,
            totalProcessed: 0,
            errors: 0
        };
        switch (action) {
            case 'published':
            case 'processed':
                stats.totalProcessed++;
                break;
            case 'error':
                stats.errors++;
                break;
        }
        this.streamStats.set(streamKey, stats);
    }
    /**
     * Start collecting statistics
     */
    startStatsCollection() {
        setInterval(() => {
            this.calculateMessageRates();
        }, 60000); // Calculate rates every minute
    }
    /**
     * Calculate message rates per second
     */
    calculateMessageRates() {
        for (const [, stats] of this.streamStats.entries()) {
            // This is a simplified rate calculation
            // In production, you'd want more sophisticated rate tracking
            stats.messagesPerSecond = Math.round(stats.totalProcessed / 60);
        }
    }
    /**
     * Generate a unique message ID
     */
    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Close Redis connections
     */
    async closeConnections() {
        this.logger.log('Closing Redis connections...');
        // Stop all consumers
        for (const consumerKey of this.consumers.keys()) {
            this.consumers.set(consumerKey, false);
        }
        await this.redis.quit();
        await this.subscriber.quit();
        this.logger.log('Redis connections closed');
    }
    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
RedisStreamsService = RedisStreamsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof EventEmitter2 !== "undefined" && EventEmitter2) === "function" ? _a : Object])
], RedisStreamsService);
export { RedisStreamsService };
//# sourceMappingURL=redis-streams.service.js.map