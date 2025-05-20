import { EventEmitter } from 'events';
import { Redis } from 'ioredis';

export class EnhancedAgent extends EventEmitter {
    private pubClient: Redis;
    private subClient: Redis;
    private readonly channels: string[] = [];

    constructor(
        private readonly name: string,
        private readonly redisUrl: string
    ) {
        super();
        this.pubClient = new Redis(redisUrl);
        this.subClient = new Redis(redisUrl);
    }

    async initialize(): Promise<void> {
        try {
            await this.subClient.subscribe(...this.channels, 'agent:broadcast');
            
            this.subClient.on('message', (channel: string, message: string) => {
                try {
                    const parsedMessage = JSON.parse(message);
                    this.emit(channel, parsedMessage);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            });
        } catch (error) {
            console.error('Failed to initialize agent:', error);
            throw error;
        }
    }

    async publish(channel: string, message: unknown): Promise<void> {
        try {
            await this.pubClient.publish(channel, JSON.stringify(message));
        } catch (error) {
            console.error('Failed to publish message:', error);
            throw error;
        }
    }

    on(event: string, callback: (data: any) => void): this {
        super.on(event, callback);
        return this;
    }

    async cleanup(): Promise<void> {
        try {
            await this.pubClient.quit();
            await this.subClient.quit();
        } catch (error) {
            console.error('Failed to cleanup agent:', error);
            throw error;
        }
    }
}
