"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedAgent = void 0;
const events_1 = require("events");
const ioredis_1 = require("ioredis");
class EnhancedAgent extends events_1.EventEmitter {
    name;
    redisUrl;
    pubClient;
    subClient;
    channels = [];
    constructor(name, redisUrl) {
        super();
        this.name = name;
        this.redisUrl = redisUrl;
        this.pubClient = new ioredis_1.Redis(redisUrl);
        this.subClient = new ioredis_1.Redis(redisUrl);
    }
    async initialize() {
        try {
            await this.subClient.subscribe(...this.channels, 'agent:broadcast');
            this.subClient.on('message', (channel, message) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    this.emit(channel, parsedMessage);
                }
                catch (error) {
                    console.error('Failed to parse message:', error);
                }
            });
        }
        catch (error) {
            console.error('Failed to initialize agent:', error);
            throw error;
        }
    }
    async publish(channel, message) {
        try {
            await this.pubClient.publish(channel, JSON.stringify(message));
        }
        catch (error) {
            console.error('Failed to publish message:', error);
            throw error;
        }
    }
    on(event, callback) {
        super.on(event, callback);
        return this;
    }
    async cleanup() {
        try {
            await this.pubClient.quit();
            await this.subClient.quit();
        }
        catch (error) {
            console.error('Failed to cleanup agent:', error);
            throw error;
        }
    }
}
exports.EnhancedAgent = EnhancedAgent;
