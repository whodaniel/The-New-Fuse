import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

@Injectable()
export class CascadeBridge {
  private redisClient: Redis;
  private pubsub: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisOptions = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      keyPrefix: 'fuse:bridge:',
    };
    this.redisClient = new Redis(redisOptions);
    this.pubsub = new Redis(redisOptions);

    this.redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    this.pubsub.on('error', (err) => logger.error('Redis PubSub Error', err));
  }

  async start(): Promise<void> {
    await this.pubsub.subscribe('cascade-in', (err) => {
      if (err) {
        logger.error('Failed to subscribe to cascade-in', err);
        return;
      }
      logger.info('Subscribed to cascade-in channel');
    });

    this.pubsub.on('message', (channel, message) => {
      if (channel === 'cascade-in') {
        this.handleCascadeMessage(message);
      }
    });
  }

  private handleCascadeMessage(message: string): void {
    try {
      const parsedMessage = JSON.parse(message);
      logger.info('Received cascade message:', parsedMessage);
      // Process the message and publish to cascade-out
      this.redisClient.publish(
        'cascade-out',
        JSON.stringify({ processed: true, ...parsedMessage }),
      );
    } catch (err) {
      logger.error('Error handling cascade message', err);
    }
  }
}
