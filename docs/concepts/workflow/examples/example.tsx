import { createClient, RedisClientType } from 'redis';
import { Logger } from 'winston';
import { setupLogging } from './logging_config.js';

interface RedisMessage {
  type: string;
  data: string;
}

/**
 * Class for managing example components.
 */
export class Example {
  private redisClient: RedisClientType;
  private pubsub: RedisClientType;
  private connected: boolean;
  private logger: Logger;

  constructor(redisHost: string, redisPort: number, redisDb: number) {
    this.redisClient = createClient({
      socket: {
        host: redisHost,
        port: redisPort
      },
      database: redisDb
    });
    this.pubsub = this.redisClient.duplicate();
    this.connected = false;
    this.logger = setupLogging('example');
  }

  /**
   * Connect to Redis and subscribe to the example channel.
   */
  public async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      await this.pubsub.connect();
      
      const pong = await this.redisClient.ping();
      if (pong === 'PONG') {
        this.connected = true;
        await this.pubsub.subscribe('example_channel', this.handleMessage.bind(this));
        this.logger.info('Subscribed to example_channel');
      }
    } catch (error) {
      this.logger.error('Error connecting to Redis:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Send a message to the example channel.
   */
  public async sendMessage(message: Record<string, any>): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to Redis');
    }

    try {
      const messageStr = JSON.stringify(message);
      await this.redisClient.publish('example_channel', messageStr);
      this.logger.debug('Sent message:', messageStr);
    } catch (error) {
      this.logger.error('Error sending message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Handle incoming messages.
   */
  private async handleMessage(message: string): Promise<void> {
    try {
      const messageData = JSON.parse(message);
      // Process the message
      this.logger.debug('Received message:', messageData);
      
      // Add your message processing logic here
      
    } catch (error) {
      this.logger.error('Error processing message:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Disconnect from Redis.
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.pubsub.unsubscribe('example_channel');
        await this.pubsub.quit();
        await this.redisClient.quit();
        this.connected = false;
        this.logger.info('Disconnected from Redis');
      }
    } catch (error) {
      this.logger.error('Error disconnecting:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Check if connected to Redis.
   */
  public isConnected(): boolean {
    return this.connected;
  }
}
