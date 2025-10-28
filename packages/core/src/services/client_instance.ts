import { createClient, RedisClientType } from 'redis';
import { Logger } from 'winston';
import { setupLogging } from './logging_config';
import { v4 as uuidv4 } from 'uuid';

const logger: Logger = setupLogging('client_instance.ts');

export class ClientInstance {
  private redisClient: RedisClientType;
  private clientId: string;
  private clientChannel: string;

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.redisClient = createClient({ url: redisUrl });
    this.clientId = uuidv4();
    this.clientChannel = `client:${this.clientId}`;
    this.redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  }

  async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      logger.info(`Client ${this.clientId} connected to Redis.`);
      await this.registerClient();
    } catch (err) {
      logger.error('Failed to connect to Redis', err);
    }
  }

  async disconnect(): Promise<void> {
    await this.redisClient.publish('system_events', JSON.stringify({ event: 'client_disconnected', clientId: this.clientId }));
    await this.redisClient.quit();
    logger.info(`Client ${this.clientId} disconnected from Redis.`);
  }

  private async registerClient(): Promise<void> {
    const clientData = {
      clientId: this.clientId,
      timestamp: Date.now(),
      capabilities: ['text_processing'],
    };
    await this.redisClient.publish('system_events', JSON.stringify({ event: 'client_connected', ...clientData }));
  }

  async start(): Promise<void> {
    await this.redisClient.subscribe(this.clientChannel, (message) => {
      this.handleMessage(message);
    });
    logger.info(`Client ${this.clientId} subscribed to channel ${this.clientChannel}`);
  }

  private handleMessage(message: string): void {
    try {
      const parsedMessage = JSON.parse(message);
      logger.info(`Received message:`, parsedMessage);
      // Handle different message types
    } catch (err) {
      logger.error('Error handling message', err);
    }
  }

  async sendMessage(receiverId: string, data: any): Promise<void> {
    const message = {
      senderId: this.clientId,
      receiverId,
      data,
    };
    await this.redisClient.publish(`client:${receiverId}`, JSON.stringify(message));
  }
}
