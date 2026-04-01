// @ts-ignore
import { createClient, RedisClientType } from 'redis';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { Logger } from 'winston';

enum ClientState {
  INITIALIZING = 'INITIALIZING',
  BROADCASTING = 'BROADCASTING',
  LISTENING = 'LISTENING',
}

interface ClientConfig {
  redis: {
    host: string;
    port: number;
    db: number;
  };
}

export class SimpleWebSocketClient {
  private state: ClientState = ClientState.INITIALIZING;
  private redisClient: any;
  private logger: Logger;
  private config: ClientConfig;

  constructor(config: ClientConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.redisClient = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}/${config.redis.db}`,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.redisClient.connect();
      this.state = ClientState.LISTENING;
      this.logger.info('WebSocket client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket client', { error });
      throw error;
    }
  }

  async sendMessage(channel: string, message: any): Promise<void> {
    if (!this.redisClient.isOpen) {
      this.logger.error('Redis client not connected');
      throw new Error('Redis client not connected');
    }

    try {
      await this.redisClient.publish(channel, JSON.stringify(message));
      this.logger.info('Message sent successfully', { channel });
    } catch (error) {
      this.logger.error('Failed to send message', { error, channel });
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const subscriber = this.redisClient.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message: any) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          this.logger.error('Failed to parse message', { error, message });
        }
      });
      this.logger.info('Subscribed to channel', { channel });
    } catch (error) {
      this.logger.error('Failed to subscribe to channel', { error, channel });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.redisClient.isOpen) {
        await this.redisClient.quit();
      }
      this.logger.info('WebSocket client disconnected');
    } catch (error) {
      this.logger.error('Error during disconnect', { error });
    }
  }
}
