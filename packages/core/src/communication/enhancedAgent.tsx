import { Redis, createClient as createRedisClient } from 'redis'; // Import createClient
import { EventEmitter } from 'events';
import type { AgentCapability, AgentMessage, AgentConfig } from '@fuse/types/core';
import { Logger, getLogger } from '@the-new-fuse/utils'; // Assuming getLogger is exported from utils

const logger: Logger = getLogger('enhanced_agent');

export interface DevelopmentProposal {
    component: string;
    proposal: string;
    priority: number;
    benefits: string[];
    implementation_steps: string[];
}

export class EnhancedAgent extends EventEmitter {
    private readonly id: string;
    private readonly channel: string;
    private readonly broadcastChannel: string;
    private readonly description: string;
    private readonly capabilities: AgentCapability[];
    private redis: Redis;
    private isRunning: boolean = false;

    constructor(
        id: string,
        channel: string,
        broadcastChannel: string,
        description: string,
        capabilities: AgentCapability[]
    ) {
        super();
        this.id = id;
        this.channel = channel;
        this.broadcastChannel = broadcastChannel;
        this.description = description;
        this.capabilities = capabilities;
    }

    async start(): Promise<void> {
        if (this.isRunning) return;

        // Use createClient for Redis connection
        this.redis = createRedisClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.redis.on('error', (err: Error) => logger.error('Redis Client Error', err));

        await this.redis.connect();
        await this.subscribeToChannels();
        this.isRunning = true;

        this.emit('ready', {
            id: this.id,
            status: 'online',
            capabilities: this.capabilities
        });
    }

    async publishMessage(type: string, content: any): Promise<void> {
        const message: AgentMessage = {
            id: crypto.randomUUID(), // crypto.randomUUID is available in Node 19+ or specific environments
            source: this.id,
            type: type,
            content: content,
            timestamp: new Date().toISOString(),
            metadata: {
                version: '1.0',
                // Ensure 'medium' is a valid value if AgentMessage['metadata']['priority'] has a stricter type
                priority: 'medium' as any, // Using 'as any' if 'medium' is not strictly typed, otherwise ensure type compatibility
            }
        };

        await this.redis.publish(this.channel, JSON.stringify(message));
    }

    private async subscribeToChannels(): Promise<void> {
        // It's generally recommended to use a separate client for subscriptions
        const subscriber = this.redis.duplicate();
        await subscriber.connect();

        // Define the callback for message handling
        const messageHandler = (message: string, channel: string) => {
            try {
                logger.debug(`Received message from channel '${channel}':`, message);
                const parsedMessage = JSON.parse(message) as AgentMessage; // Add type assertion
                this.emit('message', parsedMessage);
            } catch (error: any) { // It's good practice to type 'error'
                logger.error(`Error parsing message from channel '${channel}':`, error);
                this.emit('error', error);
            }
        };

        // Subscribe to channels
        // Note: The 'subscribe' method in node-redis v4 takes an array of channels and a listener function.
        // The listener receives (message, channel).
        await subscriber.subscribe([this.channel, this.broadcastChannel], messageHandler);
        logger.info(`Subscribed to channels: ${this.channel}, ${this.broadcastChannel}`);
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;

        await this.redis.quit();
        this.isRunning = false;
        this.emit('stopped');
    }
}
