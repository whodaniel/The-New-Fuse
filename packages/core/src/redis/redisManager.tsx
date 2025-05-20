import Redis from 'ioredis';
import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { Message } from '../types/messages.js';
import { State } from '../types/state.js';

const logger: Logger = getLogger('redis_manager');

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
}

export class RedisManager {
    private readonly client: Redis;
    private readonly subscriber: Redis;
    private readonly publisher: Redis;
    private readonly messageHandlers: Map<string, (message: Message) => Promise<void>>;
    private readonly keyPrefix: string;

    constructor(config: RedisConfig) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db || 0,
            keyPrefix: config.keyPrefix || 'fuse:'
        });

        this.subscriber = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db || 0
        });

        this.publisher = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db || 0
        });

        this.keyPrefix = config.keyPrefix || 'fuse:';
        this.messageHandlers = new Map();

        this.setupErrorHandlers();
        this.setupSubscriber();
    }

    private setupErrorHandlers(): void {
        const connections = [this.client, this.subscriber, this.publisher];

        connections.forEach(connection => {
            connection.on('error', (error) => {
                logger.error('Redis connection error:', error);
            });

            connection.on('close', () => {
                logger.warn('Redis connection closed');
            });

            connection.on('reconnecting', () => {
                logger.info('Attempting to reconnect to Redis');
            });

            connection.on('connect', () => {
                logger.info('Connected to Redis');
            });
        });
    }

    private setupSubscriber(): void {
        this.subscriber.on('message', async (channel: string, message: string) => {
            try {
                const parsedMessage = JSON.parse(message) as Message;
                const handler = this.messageHandlers.get(channel);

                if (handler) {
                    await handler(parsedMessage);
                } else {
                    logger.warn(`No handler found for channel ${channel}`);
                }
            } catch (error) {
                logger.error(`Error processing message on channel ${channel}:`, error);
            }
        });
    }

    public async connect(): Promise<void> {
        try {
            await Promise.all([
                this.client.ping(),
                this.subscriber.ping(),
                this.publisher.ping()
            ]);
            logger.info('Successfully connected to Redis');
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await Promise.all([
                this.client.quit(),
                this.subscriber.quit(),
                this.publisher.quit()
            ]);
            logger.info('Disconnected from Redis');
        } catch (error) {
            logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }

    public async registerMessageHandler(
        channel: string,
        handler: (message: Message) => Promise<void>
    ): Promise<void> {
        this.messageHandlers.set(channel, handler);
        await this.subscribeToChannel(channel);
    }

    public async subscribeToChannel(channel: string): Promise<void> {
        try {
            await this.subscriber.subscribe(channel);
            logger.debug(`Subscribed to channel ${channel}`);
        } catch (error) {
            logger.error(`Error subscribing to channel ${channel}:`, error);
            throw error;
        }
    }

    public async unsubscribeFromChannel(channel: string): Promise<void> {
        try {
            await this.subscriber.unsubscribe(channel);
            logger.debug(`Unsubscribed from channel ${channel}`);
        } catch (error) {
            logger.error(`Error unsubscribing from channel ${channel}:`, error);
            throw error;
        }
    }

    public async publishMessage(channel: string, message: Message): Promise<void> {
        try {
            const messageString = JSON.stringify(message);
            await this.publisher.publish(channel, messageString);
            logger.debug(`Published message to channel ${channel}`);
        } catch (error) {
            logger.error(`Error publishing to channel ${channel}:`, error);
            throw error;
        }
    }

    public async saveState(key: string, state: State): Promise<void> {
        try {
            const stateString = JSON.stringify(state);
            await this.client.set(this.getFullKey(key), stateString);
            logger.debug(`Saved state for key ${key}`);
        } catch (error) {
            logger.error(`Error saving state for key ${key}:`, error);
            throw error;
        }
    }

    public async loadState(key: string): Promise<State | null> {
        try {
            const stateString = await this.client.get(this.getFullKey(key));
            if (!stateString) {
                return null;
            }
            return JSON.parse(stateString) as State;
        } catch (error) {
            logger.error(`Error loading state for key ${key}:`, error);
            throw error;
        }
    }

    public async deleteState(key: string): Promise<void> {
        try {
            await this.client.del(this.getFullKey(key));
            logger.debug(`Deleted state for key ${key}`);
        } catch (error) {
            logger.error(`Error deleting state for key ${key}:`, error);
            throw error;
        }
    }

    public async getQueueLength(): Promise<number> {
        try {
            const keys = await this.client.keys(`${this.keyPrefix}queue:*`);
            return keys.length;
        } catch (error) {
            logger.error('Error getting queue length:', error);
            return 0;
        }
    }

    public async getConnectionCount(): Promise<number> {
        try {
            const info = await this.client.info('clients');
            const match = info.match(/connected_clients:(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        } catch (error) {
            logger.error('Error getting connection count:', error);
            return 0;
        }
    }

    public async routeMessage(message: Message, priority: number): Promise<void> {
        try {
            const queueKey = `${this.keyPrefix}queue:${priority}`;
            await this.client.lpush(queueKey, JSON.stringify(message));
            logger.debug(`Routed message with priority ${priority}:`, message);
        } catch (error) {
            logger.error('Error routing message:', error);
            throw error;
        }
    }

    private getFullKey(key: string): string {
        return `${this.keyPrefix}${key}`;
    }

    public async flushAll(): Promise<void> {
        try {
            await this.client.flushall();
            logger.info('Redis database flushed');
        } catch (error) {
            logger.error('Error flushing Redis:', error);
            throw error;
        }
    }

    public async isConnected(): Promise<boolean> {
        try {
            await this.client.ping();
            return true;
        } catch (error) {
            logger.error('Error pinging Redis:', error);
            return false;
        }
    }
}
