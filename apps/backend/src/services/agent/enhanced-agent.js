import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
export class EnhancedAgent extends EventEmitter {
    constructor(name, redisUrl) {
        super();
        this.name = name;
        this.redisUrl = redisUrl;
        this.channels = [];
        this.pubClient = new Redis(redisUrl);
        this.subClient = new Redis(redisUrl);
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
