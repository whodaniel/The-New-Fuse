"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastManager = void 0;
const common_1 = require("@nestjs/common");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const coordination_types_1 = require("../types/coordination.types");
const uuid_1 = require("uuid");
/**
 * Broadcast manager for multi-agent coordination
 */
class BroadcastManager {
    constructor(redisService, keyPrefix, serializer) {
        this.redisService = redisService;
        this.logger = new common_1.Logger(BroadcastManager.name);
        this.handlers = new Map();
        this.subscriptions = new Set();
        this.keyPrefix = keyPrefix;
        this.serializer = serializer;
    }
    /**
     * Broadcast message to all agents
     */
    async broadcast(fromAgent, payload, options) {
        const message = {
            id: (0, uuid_1.v4)(),
            fromAgent,
            channel: options?.channel || coordination_types_1.CoordinationChannel.BROADCAST,
            topic: options?.topic,
            payload,
            priority: options?.priority || a2a_core_1.A2APriority.MEDIUM,
            timestamp: Date.now(),
            ttl: options?.ttl,
        };
        const channel = this.keyPrefix + message.channel;
        const fullChannel = message.topic ? channel + ':' + message.topic : channel;
        await this.redisService.publish(fullChannel, this.serializer.serialize(message));
        const topicSuffix = message.topic ? ':' + message.topic : '';
        this.logger.debug('Broadcast sent from ' + fromAgent + ' on channel ' + message.channel + topicSuffix);
    }
    /**
     * Subscribe to broadcast messages
     */
    async subscribe(channel, handler, topic) {
        const fullChannel = topic
            ? this.keyPrefix + channel + ':' + topic
            : this.keyPrefix + channel;
        if (!this.handlers.has(fullChannel)) {
            this.handlers.set(fullChannel, new Set());
        }
        this.handlers.get(fullChannel).add(handler);
        if (!this.subscriptions.has(fullChannel)) {
            await this.redisService.subscribe(fullChannel, async (message) => {
                const msgContent = typeof message.message === 'string'
                    ? message.message
                    : JSON.stringify(message.message);
                await this.handleMessage(fullChannel, msgContent);
            });
            this.subscriptions.add(fullChannel);
            this.logger.log('Subscribed to channel: ' + fullChannel);
        }
    }
    /**
     * Subscribe to pattern-based channels
     */
    async subscribePattern(channelPattern, handler) {
        const fullPattern = this.keyPrefix + channelPattern;
        if (!this.handlers.has(fullPattern)) {
            this.handlers.set(fullPattern, new Set());
        }
        this.handlers.get(fullPattern).add(handler);
        if (!this.subscriptions.has(fullPattern)) {
            await this.redisService.psubscribe(fullPattern, async (message) => {
                const msgContent = typeof message.message === 'string'
                    ? message.message
                    : JSON.stringify(message.message);
                await this.handleMessage(message.channel, msgContent);
            });
            this.subscriptions.add(fullPattern);
            this.logger.log('Subscribed to pattern: ' + fullPattern);
        }
    }
    async unsubscribe(channel, topic) {
        const fullChannel = topic
            ? this.keyPrefix + channel + ':' + topic
            : this.keyPrefix + channel;
        if (this.subscriptions.has(fullChannel)) {
            await this.redisService.unsubscribe(fullChannel);
            this.subscriptions.delete(fullChannel);
            this.handlers.delete(fullChannel);
            this.logger.log('Unsubscribed from channel: ' + fullChannel);
        }
    }
    async unsubscribePattern(channelPattern) {
        const fullPattern = this.keyPrefix + channelPattern;
        if (this.subscriptions.has(fullPattern)) {
            await this.redisService.punsubscribe(fullPattern);
            this.subscriptions.delete(fullPattern);
            this.handlers.delete(fullPattern);
            this.logger.log('Unsubscribed from pattern: ' + fullPattern);
        }
    }
    getSubscriptions() {
        return Array.from(this.subscriptions);
    }
    async clearAll() {
        for (const channel of this.subscriptions) {
            if (channel.includes('*')) {
                await this.redisService.punsubscribe(channel);
            }
            else {
                await this.redisService.unsubscribe(channel);
            }
        }
        this.subscriptions.clear();
        this.handlers.clear();
        this.logger.log('All subscriptions cleared');
    }
    async handleMessage(channel, messageData) {
        try {
            const message = this.serializer.deserialize(messageData);
            if (message.ttl && Date.now() - message.timestamp > message.ttl) {
                this.logger.debug('Message expired: ' + message.id);
                return;
            }
            const handlers = this.handlers.get(channel);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        await handler(message);
                    }
                    catch (error) {
                        this.logger.error('Handler error for channel ' + channel + ':', error);
                    }
                }
            }
            for (const [pattern, handlers] of this.handlers.entries()) {
                if (pattern.includes('*') && this.matchesPattern(channel, pattern)) {
                    for (const handler of handlers) {
                        try {
                            await handler(message);
                        }
                        catch (error) {
                            this.logger.error('Pattern handler error for ' + pattern + ':', error);
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to handle broadcast message:', error);
        }
    }
    matchesPattern(channel, pattern) {
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp('^' + regexPattern + '$');
        return regex.test(channel);
    }
}
exports.BroadcastManager = BroadcastManager;
//# sourceMappingURL=broadcast-manager.js.map